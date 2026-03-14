import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { prisma } from "../lib/prisma.js";
import { inMemoryStore } from "../lib/inMemoryStore.js";
import { mailer } from "../lib/mailer.js";
import { logger } from "../lib/logger.js";
import { COOKIE_REFRESH_NAME } from "../lib/constants.js";
import { AppError } from "../types/index.js";

const SALT_ROUNDS = 12;
const SIGNUP_OTP_TTL_SECONDS = Number(process.env.SIGNUP_OTP_EXPIRY_MINUTES || 10) * 60;
const PASSWORD_RESET_OTP_TTL_SECONDS = Number(process.env.PASSWORD_RESET_OTP_EXPIRY_MINUTES || 10) * 60;
const ACCESS_EXPIRES = (process.env.JWT_ACCESS_EXPIRES_IN || "15m") as jwt.SignOptions["expiresIn"];
const REFRESH_EXPIRES = (process.env.JWT_REFRESH_EXPIRES_IN || "7d") as jwt.SignOptions["expiresIn"];

const signAccessToken = (payload: { id: string; email: string; role: string }): string =>
  jwt.sign(payload, process.env.JWT_ACCESS_SECRET || "", {
    expiresIn: ACCESS_EXPIRES,
  });

const signRefreshToken = (payload: { id: string }): string =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET || "", {
    expiresIn: REFRESH_EXPIRES,
  });

const signResetToken = (payload: { id: string; purpose: "password_reset" }): string =>
  jwt.sign(payload, process.env.JWT_ACCESS_SECRET || "", {
    expiresIn: "10m",
  });

const saveRefreshToken = async (userId: string, token: string): Promise<void> => {
  await inMemoryStore.set(`refresh:${userId}`, token, 7 * 24 * 60 * 60);
};

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const generateOtp = (): string => Math.floor(100000 + Math.random() * 900000).toString();

const signupOtpKey = (email: string): string => `otp:signup:${email}`;
const resetOtpKey = (email: string): string => `otp:reset:${email}`;
const pendingSignupKey = (email: string): string => `signup:pending:${email}`;

const isSmtpConfigured = (): boolean => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!host || !user || !pass || !from) {
    return false;
  }

  // Treat template placeholder values as "not configured".
  if (user.includes("your@") || pass.includes("your-app-password")) {
    return false;
  }

  return true;
};

const sendOtpEmail = async (email: string, otp: string, context: "signup" | "reset"): Promise<void> => {
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.RESEND_FROM_EMAIL;
  const smtpFrom = process.env.SMTP_FROM;

  const subject = context === "signup" ? "Your signup OTP" : "Your password reset OTP";
  const html = `<div style=\"font-family:Arial,sans-serif\"><h2>Your OTP: ${otp}</h2><p>This OTP expires in 10 minutes.</p><p>If you did not request this, you can safely ignore this email.</p></div>`;

  let resendErrorMessage: string | null = null;

  if (resendApiKey && resendFrom) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: resendFrom,
          to: email,
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Resend API failed (${response.status}): ${body}`);
      }

      return;
    } catch (error) {
      resendErrorMessage = error instanceof Error ? error.message : String(error);
      logger.warn("Resend delivery failed; falling back to SMTP if configured", {
        email,
        context,
        error: resendErrorMessage,
      });
    }
  }

  if (!isSmtpConfigured() || !smtpFrom) {
    if (resendErrorMessage) {
      throw new AppError(`OTP email delivery failed: ${resendErrorMessage}`, 502, "Bad gateway");
    }

    throw new AppError(
      "Email provider is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL (or valid SMTP settings).",
      500,
      "Internal server error"
    );
  }

  try {
    await mailer.sendMail({
      from: smtpFrom,
      to: email,
      subject,
      html,
    });
  } catch (error) {
    throw new AppError(
      `SMTP delivery failed: ${error instanceof Error ? error.message : String(error)}`,
      502,
      "Bad gateway"
    );
  }
};

const getPublicUser = (user: { id: string; name: string; email: string; role: string }) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

export const authService = {
  async signup(input: { name: string; email: string; password: string }) {
    const email = normalizeEmail(input.email);
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      throw new AppError("Email already registered", 409, "Conflict");
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const otp = generateOtp();

    await inMemoryStore.set(
      pendingSignupKey(email),
      JSON.stringify({ name: input.name.trim(), email, passwordHash }),
      SIGNUP_OTP_TTL_SECONDS
    );
    await inMemoryStore.set(signupOtpKey(email), otp, SIGNUP_OTP_TTL_SECONDS);

    await sendOtpEmail(email, otp, "signup");

    return { message: "OTP sent to your email. Verify OTP to complete signup." };
  },

  async verifySignupOtp(input: { email: string; otp: string }) {
    const email = normalizeEmail(input.email);
    const storedOtp = await inMemoryStore.get(signupOtpKey(email));
    if (!storedOtp || storedOtp !== input.otp) {
      throw new AppError("OTP expired or invalid", 400, "Bad request");
    }

    const pendingRaw = await inMemoryStore.get(pendingSignupKey(email));
    if (!pendingRaw) {
      throw new AppError("Signup request expired. Please request a new OTP.", 400, "Bad request");
    }

    let pending: { name: string; email: string; passwordHash: string };
    try {
      pending = JSON.parse(pendingRaw) as { name: string; email: string; passwordHash: string };
    } catch {
      await inMemoryStore.del(pendingSignupKey(email), signupOtpKey(email));
      throw new AppError("Signup request invalid. Please request a new OTP.", 400, "Bad request");
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      await inMemoryStore.del(pendingSignupKey(email), signupOtpKey(email));
      throw new AppError("Email already registered", 409, "Conflict");
    }

    const user = await prisma.user.create({
      data: {
        name: pending.name,
        email,
        passwordHash: pending.passwordHash,
        role: "STAFF",
      },
    });

    await inMemoryStore.del(pendingSignupKey(email), signupOtpKey(email));

    const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ id: user.id });
    await saveRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken, user: getPublicUser(user) };
  },

  async login(input: { email: string; password: string }) {
    const email = normalizeEmail(input.email);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError("Invalid credentials", 401, "Unauthorized");
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new AppError("Invalid credentials", 401, "Unauthorized");
    }

    const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ id: user.id });
    await saveRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken, user: getPublicUser(user) };
  },

  async refresh(refreshTokenCookie: string | undefined) {
    if (!refreshTokenCookie) {
      throw new AppError("No refresh token", 401, "Unauthorized");
    }

    let payload: { id: string };
    try {
      payload = jwt.verify(
        refreshTokenCookie,
        process.env.JWT_REFRESH_SECRET || ""
      ) as { id: string };
    } catch {
      throw new AppError("Invalid or expired token", 401, "Unauthorized");
    }

    const key = `refresh:${payload.id}`;
    const stored = await inMemoryStore.get(key);

    if (!stored || stored !== refreshTokenCookie) {
      await inMemoryStore.del(key);
      throw new AppError("Token reuse detected", 401, "Unauthorized");
    }

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      throw new AppError("Invalid or expired token", 401, "Unauthorized");
    }

    const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ id: user.id });
    await saveRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken };
  },

  async logout(userId: string) {
    await inMemoryStore.del(`refresh:${userId}`);
    return { message: "Logged out successfully" };
  },

  async forgotPassword(email: string) {
    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (user) {
      const otp = generateOtp();
      await inMemoryStore.set(resetOtpKey(normalizedEmail), otp, PASSWORD_RESET_OTP_TTL_SECONDS);
      await sendOtpEmail(normalizedEmail, otp, "reset");
    }

    return { message: "If that email exists, an OTP was sent" };
  },

  async verifyOtp(input: { email: string; otp: string }) {
    const email = normalizeEmail(input.email);
    const storedOtp = await inMemoryStore.get(resetOtpKey(email));
    if (!storedOtp) {
      throw new AppError("OTP expired or invalid", 400, "Bad request");
    }

    if (storedOtp !== input.otp) {
      throw new AppError("OTP incorrect", 400, "Bad request");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError("OTP expired or invalid", 400, "Bad request");
    }

    await inMemoryStore.del(resetOtpKey(email));

    const resetToken = signResetToken({ id: user.id, purpose: "password_reset" });
    await inMemoryStore.set(`reset:${user.id}`, resetToken, 600);

    return { resetToken };
  },

  async resetPassword(input: {
    resetToken?: string;
    email?: string;
    otp?: string;
    password: string;
    confirmPassword: string;
  }) {
    if (input.password !== input.confirmPassword) {
      throw new AppError("Passwords do not match", 400, "Bad request");
    }

    let userId: string;

    if (input.resetToken) {
      let payload: { id: string; purpose: string };
      try {
        payload = jwt.verify(input.resetToken, process.env.JWT_ACCESS_SECRET || "") as {
          id: string;
          purpose: string;
        };
      } catch {
        throw new AppError("Invalid or expired token", 401, "Unauthorized");
      }

      if (payload.purpose !== "password_reset") {
        throw new AppError("Invalid reset token", 400, "Bad request");
      }

      const stored = await inMemoryStore.get(`reset:${payload.id}`);
      if (!stored || stored !== input.resetToken) {
        throw new AppError("Invalid or expired token", 401, "Unauthorized");
      }

      userId = payload.id;
      await inMemoryStore.del(`reset:${userId}`);
    } else {
      if (!input.email || !input.otp) {
        throw new AppError("Email and OTP are required", 400, "Bad request");
      }

      const email = normalizeEmail(input.email);
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        throw new AppError("OTP expired or invalid", 400, "Bad request");
      }

      const storedOtp = await inMemoryStore.get(resetOtpKey(email));
      if (!storedOtp || storedOtp !== input.otp) {
        throw new AppError("OTP expired or invalid", 400, "Bad request");
      }

      userId = user.id;
      await inMemoryStore.del(resetOtpKey(email));
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await inMemoryStore.del(`refresh:${userId}`);

    return { message: "Password reset successfully" };
  },

  cookieName: COOKIE_REFRESH_NAME,
};

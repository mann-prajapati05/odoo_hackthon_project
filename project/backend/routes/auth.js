import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { z } from "zod";
import { Resend } from "resend";
import { query } from "../utils/db.js";

const router = express.Router();

const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const signupRequestSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email").transform((value) => value.toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const otpVerifySchema = z.object({
  email: z.string().email("Please enter a valid email").transform((value) => value.toLowerCase()),
  otp: z.string().regex(/^\d{6}$/, "OTP must be a 6-digit code"),
});

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email").transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Password is required"),
});

const mapUserRole = (dbRole) => {
  if (dbRole === "inventory_manager") return "manager";
  if (dbRole === "warehouse_staff") return "staff";
  return "admin";
};

const buildUserPayload = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: mapUserRole(user.role),
  createdAt: user.created_at,
});

const getOtpHash = (email, otp) =>
  crypto.createHash("sha256").update(`${email}:${otp}`).digest("hex");

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const signAccessToken = (user) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: mapUserRole(user.role),
    },
    jwtSecret,
    { expiresIn: "1h" }
  );
};

const validateBody = (schema, req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: parsed.error.issues[0]?.message || "Invalid request payload",
    });
  }

  return parsed.data;
};

router.post("/signup/request-otp", async (req, res, next) => {
  try {
    const body = validateBody(signupRequestSchema, req, res);
    if (!body) return;

    const { name, email, password } = body;

    const existingUser = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    if (!resend) {
      return res.status(500).json({ message: "Resend is not configured on server" });
    }

    const otp = generateOtp();
    const otpHash = getOtpHash(email, otp);
    const passwordHash = await bcrypt.hash(password, 10);
    const otpExpiryMinutes = Number(process.env.SIGNUP_OTP_EXPIRY_MINUTES || 10);

    await query(
      `
      INSERT INTO pending_signup_otps (email, name, password_hash, otp_hash, expires_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW() + ($5 || ' minutes')::interval, NOW())
      ON CONFLICT (email)
      DO UPDATE SET
        name = EXCLUDED.name,
        password_hash = EXCLUDED.password_hash,
        otp_hash = EXCLUDED.otp_hash,
        expires_at = EXCLUDED.expires_at,
        updated_at = NOW()
      `,
      [email, name, passwordHash, otpHash, otpExpiryMinutes]
    );

    await resend.emails.send({
      from: resendFrom,
      to: email,
      subject: "Your signup OTP code",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>Verify your email</h2>
          <p>Use this OTP to complete signup:</p>
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
          <p>This code expires in ${otpExpiryMinutes} minutes.</p>
        </div>
      `,
    });

    return res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    return next(error);
  }
});

router.post("/signup/verify-otp", async (req, res, next) => {
  try {
    const body = validateBody(otpVerifySchema, req, res);
    if (!body) return;

    const { email, otp } = body;

    const pending = await query(
      `
      SELECT email, name, password_hash, otp_hash, expires_at
      FROM pending_signup_otps
      WHERE email = $1
      `,
      [email]
    );

    if (!pending.rows.length) {
      return res.status(400).json({ message: "No pending signup found for this email" });
    }

    const pendingSignup = pending.rows[0];
    if (new Date(pendingSignup.expires_at).getTime() < Date.now()) {
      await query("DELETE FROM pending_signup_otps WHERE email = $1", [email]);
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    const otpHash = getOtpHash(email, otp);
    if (otpHash !== pendingSignup.otp_hash) {
      return res.status(400).json({ message: "Invalid OTP code" });
    }

    const inserted = await query(
      `
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, 'warehouse_staff')
      RETURNING id, name, email, role, created_at
      `,
      [pendingSignup.name, pendingSignup.email, pendingSignup.password_hash]
    );

    await query("DELETE FROM pending_signup_otps WHERE email = $1", [email]);

    const user = inserted.rows[0];
    const accessToken = signAccessToken(user);

    return res.status(201).json({
      accessToken,
      user: buildUserPayload(user),
    });
  } catch (error) {
    if (error?.code === "23505") {
      return res.status(409).json({ message: "Email is already registered" });
    }
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const body = validateBody(loginSchema, req, res);
    if (!body) return;

    const userResult = await query(
      "SELECT id, name, email, role, password_hash, created_at FROM users WHERE email = $1",
      [body.email]
    );

    if (!userResult.rows.length) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = userResult.rows[0];
    const isValidPassword = await bcrypt.compare(body.password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const accessToken = signAccessToken(user);

    return res.status(200).json({
      accessToken,
      user: buildUserPayload(user),
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/refresh", (req, res) => {
  return res.status(401).json({ message: "Session expired. Please login again." });
});

router.post("/logout", (req, res) => {
  return res.status(204).send();
});

export default router;

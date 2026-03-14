import { REFRESH_COOKIE_OPTIONS } from "../lib/constants.js";
import { authService } from "../services/auth.service.js";
export const authController = {
    async signup(req, res) {
        const result = await authService.signup(req.body);
        res.status(200).json(result);
    },
    async verifySignupOtp(req, res) {
        const result = await authService.verifySignupOtp(req.body);
        res.cookie(authService.cookieName, result.refreshToken, REFRESH_COOKIE_OPTIONS);
        res.status(201).json({ accessToken: result.accessToken, user: result.user });
    },
    async login(req, res) {
        const result = await authService.login(req.body);
        res.cookie(authService.cookieName, result.refreshToken, REFRESH_COOKIE_OPTIONS);
        res.status(200).json({ accessToken: result.accessToken, user: result.user });
    },
    async refresh(req, res) {
        const result = await authService.refresh(req.cookies[authService.cookieName]);
        res.cookie(authService.cookieName, result.refreshToken, REFRESH_COOKIE_OPTIONS);
        res.status(200).json({ accessToken: result.accessToken });
    },
    async logout(req, res) {
        const result = await authService.logout(req.user.id);
        res.clearCookie(authService.cookieName, REFRESH_COOKIE_OPTIONS);
        res.status(200).json(result);
    },
    async forgotPassword(req, res) {
        const result = await authService.forgotPassword(req.body.email);
        res.status(200).json(result);
    },
    async verifyOtp(req, res) {
        const result = await authService.verifyOtp(req.body);
        res.status(200).json(result);
    },
    async resetPassword(req, res) {
        const result = await authService.resetPassword(req.body);
        res.status(200).json(result);
    },
};

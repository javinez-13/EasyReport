import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { AuthenticatedRequest } from "../types/auth.types";

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json({
        success: true,
        message: "User registered successfully. Please verify your email.",
        user: result.user,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err.message || "Registration failed",
      });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const result = await AuthService.login(req.body);

      // Optionally set refresh token in HTTP-only cookie
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        message: "Login successful",
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (err: any) {
      res.status(401).json({
        success: false,
        message: err.message || "Invalid credentials",
      });
    }
  }

  static async refresh(req: Request, res: Response) {
    try {
      const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
      const result = await AuthService.refresh(refreshToken);
      res.status(200).json({
        success: true,
        accessToken: result.accessToken,
        user: result.user,
      });
    } catch (err: any) {
      res.status(401).json({
        success: false,
        message: err.message || "Could not refresh token",
      });
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
      await AuthService.logout(refreshToken);
      res.clearCookie("refreshToken");
      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || "Logout failed",
      });
    }
  }

  static async verifyEmail(req: Request, res: Response) {
    try {
      const token = req.query.token as string || req.body.token;
      if (!token) {
        return res.status(400).json({ success: false, message: "Token is required" });
      }
      await AuthService.verifyEmail(token);
      res.status(200).json({
        success: true,
        message: "Email verified successfully",
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err.message || "Verification failed",
      });
    }
  }

  static async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
      }
      const result = await AuthService.forgotPassword(email);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || "Password reset request failed",
      });
    }
  }

  static async resetPassword(req: Request, res: Response) {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return res.status(400).json({ success: false, message: "Token and new password are required" });
      }
      await AuthService.resetPassword(token, password);
      res.status(200).json({
        success: true,
        message: "Password reset successfully",
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err.message || "Password reset failed",
      });
    }
  }

  static async googleAuth(req: Request, res: Response) {
    try {
      const { googleId, email, fullname } = req.body;
      if (!googleId || !email) {
        return res.status(400).json({ success: false, message: "Google ID and email are required" });
      }
      const result = await AuthService.googleAuth({ googleId, email, fullname });
      
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        message: "Google login successful",
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err.message || "Google auth failed",
      });
    }
  }

  static async me(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const user = await AuthService.getUserById(req.user.id);
      if (!user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      res.status(200).json({
        success: true,
        user,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

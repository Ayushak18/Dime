import { Router } from "express";
import { signup, login, refresh, logout, getUserById } from "../services/auth.service.ts";
import { requireAuth } from "../middleware/requireAuth.ts";

const router = Router();

const ACCESS_TOKEN_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const accessTokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: ACCESS_TOKEN_MAX_AGE_MS,
};

const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/api/v1/auth",
  maxAge: REFRESH_TOKEN_MAX_AGE_MS,
};

router.post("/auth/signup", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ status: "error", message: "Email and password are required" });
  }

  try {
    const user = await signup(email, password);
    res.status(201).json({ status: "ok", data: user });
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_IN_USE") {
      return res.status(409).json({ status: "error", message: "Email already in use" });
    }
    throw error;
  }
});

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ status: "error", message: "Email and password are required" });
  }

  try {
    const { user, accessToken, refreshToken } = await login(email, password);

    res.cookie("accessToken", accessToken, accessTokenCookieOptions);
    res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);
    res.json({ status: "ok", data: user });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_CREDENTIALS") {
      return res.status(401).json({ status: "error", message: "Invalid email or password" });
    }
    throw error;
  }
});

router.post("/auth/refresh", async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json({ status: "error", message: "Not authenticated" });
  }

  try {
    const { accessToken, refreshToken } = await refresh(token);

    res.cookie("accessToken", accessToken, accessTokenCookieOptions);
    res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);
    res.json({ status: "ok" });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_REFRESH_TOKEN") {
      return res.status(401).json({ status: "error", message: "Invalid or expired refresh token" });
    }
    throw error;
  }
});

router.post("/auth/logout", async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (token) {
    await logout(token);
  }

  res.clearCookie("accessToken", accessTokenCookieOptions);
  res.clearCookie("refreshToken", refreshTokenCookieOptions);
  res.json({ status: "ok" });
});

router.get("/auth/me", requireAuth, async (req, res) => {
  const user = await getUserById(req.userId as string);
  res.json({ status: "ok", data: user });
});

export default router;

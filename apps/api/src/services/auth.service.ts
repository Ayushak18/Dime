import "dotenv/config";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import prisma from "../lib/prisma.ts";

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "30m";
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const BCRYPT_SALT_ROUNDS = 12;

export function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

export function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function signAccessToken(userId: string) {
  const options: jwt.SignOptions = {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  };

  return jwt.sign({ userId }, JWT_SECRET, options);
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as { userId: string };
}

export function generateRefreshToken() {
  const token = crypto.randomBytes(64).toString("hex");
  const tokenHash = hashRefreshToken(token);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  return { token, tokenHash, expiresAt };
}

export function hashRefreshToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function signup(email: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("EMAIL_IN_USE");
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { email, passwordHash } });

  return { id: user.id, email: user.email };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);
  if (!passwordMatches) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const accessToken = signAccessToken(user.id);
  const { token: refreshToken, tokenHash, expiresAt } = generateRefreshToken();

  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  return {
    user: { id: user.id, email: user.email },
    accessToken,
    refreshToken,
  };
}

export async function refresh(rawToken: string) {
  const tokenHash = hashRefreshToken(rawToken);
  const existing = await prisma.refreshToken.findUnique({
    where: { tokenHash },
  });

  if (!existing || existing.expiresAt < new Date()) {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  const {
    token: newRefreshToken,
    tokenHash: newTokenHash,
    expiresAt: newExpiresAt,
  } = generateRefreshToken();

  await prisma.$transaction([
    prisma.refreshToken.delete({ where: { id: existing.id } }),
    prisma.refreshToken.create({
      data: { userId: existing.userId, tokenHash: newTokenHash, expiresAt: newExpiresAt },
    }),
  ]);

  const accessToken = signAccessToken(existing.userId);

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(rawToken: string) {
  const tokenHash = hashRefreshToken(rawToken);
  await prisma.refreshToken.deleteMany({ where: { tokenHash } });
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  return { id: user.id, email: user.email };
}

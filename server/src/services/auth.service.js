import bcrypt from "bcrypt";
import prisma from "../config/db.js";
import { generateToken } from "../utils/jwt.js";

export const registerUser = async ({ fullName, email, password }) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    const error = new Error("Email address is already registered");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      createdAt: true,
    },
  });

  return user;
};
export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!passwordMatches) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken({
    userId: user.id,
  });

  return {
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      createdAt: user.createdAt,
    },
  };
};
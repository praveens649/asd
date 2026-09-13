import express from "express";
import { register,login,logout } from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { registerSchema, loginSchema } from "../validators/auth.validate.js";
import { authRateLimiter } from "../middleware/ratelimit.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";
const router = express.Router();

router.post(
  "/register",
  authRateLimiter,
  validate(registerSchema),
  register
);
router.post(
  "/login",
    authRateLimiter,
  validate(loginSchema),
  login
);
router.post(
  "/logout",
  authenticate,
  logout
);

export default router;
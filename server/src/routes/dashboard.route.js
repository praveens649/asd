import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { getStats } from "../controllers/dashboard.controller.js";

const router = express.Router();

router.use(authenticate);

router.get("/", getStats);

export default router;
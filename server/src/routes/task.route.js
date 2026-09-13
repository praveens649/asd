import express from "express";

import {
  create,
  getAll,
  getOne,
  update,
  remove,
} from "../controllers/task.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

import {
  createTaskSchema,
  updateTaskSchema,
} from "../validators/task.validator.js";

const router = express.Router();

router.use(authenticate);

router.get("/", getAll);

router.post(
  "/",
  validate(createTaskSchema),
  create
);

router.get("/:id", getOne);

router.put(
  "/:id",
  validate(updateTaskSchema),
  update
);

router.delete("/:id", remove);

export default router;
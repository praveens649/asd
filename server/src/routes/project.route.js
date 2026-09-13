import express from "express";

import {
  create,
  getAll,
  getOne,
  update,
  remove,
} from "../controllers/project.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

import {
  createProjectSchema,
  updateProjectSchema,
} from "../validators/project.validator.js";

const router = express.Router();

router.use(authenticate);

router.get("/", getAll);

router.post(
  "/",
  validate(createProjectSchema),
  create
);

router.get("/:id", getOne);

router.put(
  "/:id",
  validate(updateProjectSchema),
  update
);

router.delete("/:id", remove);

export default router;
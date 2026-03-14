import { Router } from "express";

import { operationController } from "../controllers/operation.controller.js";
import { validate } from "../middleware/validate.js";
import {
  operationCancelSchema,
  operationCreateSchema,
  operationListQuerySchema,
  operationStatusPatchSchema,
  operationUpdateSchema,
} from "../validators/operation.validators.js";

const router = Router();

router.get("/", validate(operationListQuerySchema, "query"), operationController.list);
router.get("/counts", operationController.counts);
router.post("/", validate(operationCreateSchema, "body"), operationController.create);
router.get("/:id", operationController.getById);
router.put("/:id", validate(operationUpdateSchema, "body"), operationController.update);
router.patch("/:id/status", validate(operationStatusPatchSchema, "body"), operationController.patchStatus);
router.post("/:id/validate", operationController.validate);
router.post("/:id/cancel", validate(operationCancelSchema, "body"), operationController.cancel);
router.post("/:id/duplicate", operationController.duplicate);
router.patch("/:id/lock-quantities", operationController.lockQuantities);
router.get("/:id/timeline", operationController.timeline);

export default router;

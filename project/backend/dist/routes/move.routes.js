import { Router } from "express";
import { moveController } from "../controllers/move.controller.js";
const router = Router();
router.get("/", moveController.list);
export default router;

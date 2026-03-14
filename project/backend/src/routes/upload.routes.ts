import { Router } from "express";
import multer from "multer";

import { uploadController } from "../controllers/upload.controller.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

router.post("/", upload.single("file"), uploadController.upload);

export default router;

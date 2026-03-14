import type { Request, Response } from "express";
import { Readable } from "node:stream";

import { cloudinary } from "../lib/cloudinary.js";
import { AppError } from "../types/index.js";

export const uploadController = {
  async upload(req: Request, res: Response) {
    const file = req.file;
    if (!file) {
      throw new AppError("File is required", 422, "Validation failed");
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      throw new AppError("Unsupported file type", 415, "Unsupported Media Type");
    }

    if (file.size > 2 * 1024 * 1024) {
      throw new AppError("File too large (max 2MB)", 413, "Payload Too Large");
    }

    if ((process.env.STORAGE_PROVIDER || "cloudinary") !== "cloudinary") {
      throw new AppError("Only cloudinary storage provider is configured", 400, "Bad request");
    }

    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "coreinventory/products",
          transformation: [{ width: 400, height: 400, crop: "fill", quality: "auto" }],
        },
        (error, uploaded) => {
          if (error || !uploaded) {
            reject(error || new Error("Upload failed"));
            return;
          }
          resolve(uploaded as { secure_url: string; public_id: string });
        }
      );

      Readable.from(file.buffer).pipe(stream);
    });

    res.status(200).json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  },
};

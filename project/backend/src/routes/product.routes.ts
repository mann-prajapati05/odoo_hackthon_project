import { Router } from "express";
import multer from "multer";
import { z } from "zod";

import { productController } from "../controllers/product.controller.js";
import { validate } from "../middleware/validate.js";
import { productCreateSchema, productQuerySchema, productUpdateSchema } from "../validators/product.validators.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.get("/", validate(productQuerySchema, "query"), productController.list);
router.post("/", validate(productCreateSchema, "body"), productController.create);
router.get("/:id", productController.getById);
router.put("/:id", validate(productUpdateSchema, "body"), productController.update);
router.delete("/:id", productController.remove);
router.get("/:id/stock", productController.stock);
router.get("/:id/stock-history", productController.stockHistory);
router.post("/import", upload.single("file"), productController.importPreview);
router.post(
  "/import/confirm",
  validate(
    z.object({
      rows: z.array(
        z.object({
          name: z.string(),
          sku: z.string(),
          category: z.string().optional(),
          uom: z.string(),
          initial_qty: z.number().optional(),
          location_shortcode: z.string().optional(),
        })
      ),
      selectedRowIndexes: z.array(z.number().int().min(1)),
    }),
    "body"
  ),
  productController.importConfirm
);
router.get("/export", productController.export);
export default router;

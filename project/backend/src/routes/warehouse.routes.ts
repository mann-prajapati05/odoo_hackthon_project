import { Router } from "express";

import { warehouseController } from "../controllers/warehouse.controller.js";
import { authorize } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import {
  locationCreateSchema,
  locationUpdateSchema,
  warehouseCreateSchema,
  warehouseUpdateSchema,
} from "../validators/warehouse.validators.js";

export const warehouseRouter = Router();
export const locationRouter = Router();

warehouseRouter.get("/", warehouseController.list);
warehouseRouter.post("/", authorize("ADMIN", "MANAGER"), validate(warehouseCreateSchema, "body"), warehouseController.create);
warehouseRouter.get("/:id", warehouseController.getById);
warehouseRouter.put("/:id", validate(warehouseUpdateSchema, "body"), warehouseController.update);
warehouseRouter.delete("/:id", warehouseController.remove);
warehouseRouter.get("/:id/locations", warehouseController.listLocations);
warehouseRouter.post(
  "/:id/locations",
  validate(locationCreateSchema, "body"),
  warehouseController.createLocation
);

locationRouter.put("/:id", validate(locationUpdateSchema, "body"), warehouseController.updateLocation);
locationRouter.delete("/:id", warehouseController.deleteLocation);

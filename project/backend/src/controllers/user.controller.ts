import type { Request, Response } from "express";

import { userService } from "../services/user.service.js";

export const userController = {
  async me(req: Request, res: Response) {
    const data = await userService.me(req.user!.id);
    res.status(200).json(data);
  },

  async updateMe(req: Request, res: Response) {
    const data = await userService.updateProfile(req.user!.id, req.body.name);
    res.status(200).json(data);
  },

  async updatePassword(req: Request, res: Response) {
    const data = await userService.updatePassword(req.user!.id, req.body);
    res.status(200).json(data);
  },

  async stats(req: Request, res: Response) {
    const data = await userService.stats(req.user!.id);
    res.status(200).json(data);
  },
};

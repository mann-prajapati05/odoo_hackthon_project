import { userService } from "../services/user.service.js";
export const userController = {
    async me(req, res) {
        const data = await userService.me(req.user.id);
        res.status(200).json(data);
    },
    async updateMe(req, res) {
        const data = await userService.updateProfile(req.user.id, req.body.name);
        res.status(200).json(data);
    },
    async updatePassword(req, res) {
        const data = await userService.updatePassword(req.user.id, req.body);
        res.status(200).json(data);
    },
    async stats(req, res) {
        const data = await userService.stats(req.user.id);
        res.status(200).json(data);
    },
};

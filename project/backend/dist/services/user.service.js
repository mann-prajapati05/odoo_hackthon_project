import bcrypt from "bcryptjs";
import { OperationStatus, OperationType } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../types/index.js";
export const userService = {
    async me(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, role: true, createdAt: true },
        });
        if (!user) {
            throw new AppError("Not found", 404, "Not found");
        }
        return user;
    },
    async updateProfile(userId, name) {
        return prisma.user.update({
            where: { id: userId },
            data: { name },
            select: { id: true, name: true, email: true, role: true },
        });
    },
    async updatePassword(userId, input) {
        if (input.newPassword !== input.confirmPassword) {
            throw new AppError("Passwords do not match", 400, "Bad request");
        }
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new AppError("Not found", 404, "Not found");
        }
        const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
        if (!valid) {
            throw new AppError("Current password is incorrect", 400, "Bad request");
        }
        const passwordHash = await bcrypt.hash(input.newPassword, 12);
        await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
        return { message: "Password updated" };
    },
    async stats(userId) {
        const operationsCreated = await prisma.operation.count({ where: { createdById: userId } });
        const receiptsValidated = await prisma.operation.count({
            where: {
                type: OperationType.RECEIPT,
                status: OperationStatus.DONE,
                validatedById: userId,
            },
        });
        const deliveriesCompleted = await prisma.operation.count({
            where: {
                type: OperationType.DELIVERY,
                status: OperationStatus.DONE,
                validatedById: userId,
            },
        });
        const lastTimeline = await prisma.operationTimeline.findFirst({
            where: { actorId: userId },
            orderBy: { createdAt: "desc" },
            select: { createdAt: true },
        });
        return {
            operationsCreated,
            receiptsValidated,
            deliveriesCompleted,
            lastActiveAt: lastTimeline?.createdAt ?? new Date().toISOString(),
        };
    },
};

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export type JwtUserPayload = {
  id: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "STAFF";
};

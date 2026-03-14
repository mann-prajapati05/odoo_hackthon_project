export class AppError extends Error {
    message;
    statusCode;
    code;
    details;
    constructor(message, statusCode = 400, code, details) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.name = "AppError";
    }
}

import type { SerializedError } from './custom-error';
import { CustomError } from './custom-error';

// Thrown for any invalid request input (Joi DTOs, or anything else).
// Each entry becomes one item in the response's "errors" array.
export class RequestValidationError extends CustomError {
    statusCode = 400;

    constructor(public errors: SerializedError[]) {
        super('Invalid request parameters');

        // Only because we are extending a built in class
        Object.setPrototypeOf(this, RequestValidationError.prototype);
    }

    serializeErrors() {
        return this.errors;
    }
}

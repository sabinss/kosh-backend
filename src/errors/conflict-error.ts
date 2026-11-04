import { CustomError } from './custom-error';

export class ConflictError extends CustomError {
    statusCode = 409;

    constructor(public message: string) {
        super(message);

        // Only because we are extending a built in class
        Object.setPrototypeOf(this, ConflictError.prototype);
    }

    serializeErrors() {
        return [{ message: this.message }];
    }
}

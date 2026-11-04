import { CustomError } from './custom-error';

export class UnauthorizedError extends CustomError {
    statusCode = 401;

    constructor(public message: string = 'Not authenticated') {
        super(message);

        // Only because we are extending a built in class
        Object.setPrototypeOf(this, UnauthorizedError.prototype);
    }

    serializeErrors() {
        return [{ message: this.message }];
    }
}

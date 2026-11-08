import { CustomError, type SerializedError } from './custom-error';

export class NotFoundError extends CustomError {
    statusCode = 404;

    constructor(public message: string = 'Not found') {
        super(message);

        // Only because we are extending a built in class
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }

    serializeErrors(): SerializedError[] {
        return [{ message: this.message }];
    }
}

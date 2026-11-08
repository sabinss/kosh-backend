import { CustomError } from './custom-error';

// 403: the user is authenticated, but their roles do not allow this action.
export class ForbiddenError extends CustomError {
    statusCode = 403;

    constructor(
        public message: string = 'You do not have permission to do this',
    ) {
        super(message);

        // Only because we are extending a built in class
        Object.setPrototypeOf(this, ForbiddenError.prototype);
    }

    serializeErrors() {
        return [{ message: this.message }];
    }
}

export interface SerializedError {
    message: string;
    field?: string;
}

/**
 * Base class for all errors the API knows how to respond to.
 * Every subclass provides a status code and a serialized list of errors,
 * which the global error handler turns into the single response format:
 *
 *   { "errors": [{ "message": "...", "field": "optional" }] }
 */
export abstract class CustomError extends Error {
    abstract statusCode: number;

    constructor(message: string) {
        super(message);
        // Only because we are extending a built in class
        Object.setPrototypeOf(this, new.target.prototype);
    }

    abstract serializeErrors(): SerializedError[];
}

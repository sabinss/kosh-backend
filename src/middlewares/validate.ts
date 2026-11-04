import type { NextFunction, Request, Response } from 'express';
import type BaseDto from '../common/dto/base.dto';
import { RequestValidationError } from '../errors/request-validation-error';

// Usage: router.post('/login', validate(LoginDto), controller.login);
const validate = (DtoClass: typeof BaseDto) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        const { errors, value } = DtoClass.validate(req.body);
        if (errors) {
            // Goes to the global errorHandler -> 400 { errors: [{ message, field }] }
            throw new RequestValidationError(errors);
        }
        req.body = value;
        next();
    };
};

export default validate;

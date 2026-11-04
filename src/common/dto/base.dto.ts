import Joi from 'joi';

export interface ValidationIssue {
    message: string;
    field?: string;
}

export type ValidationResult<T> =
    { errors: ValidationIssue[]; value: null } | { errors: null; value: T };

class BaseDto {
    static schema: Joi.ObjectSchema = Joi.object({});

    static validate<T = unknown>(data: unknown): ValidationResult<T> {
        const result: Joi.ValidationResult = this.schema.validate(data, {
            abortEarly: false,
            stripUnknown: true,
        });
        const { error } = result;
        const value: unknown = result.value;

        if (error) {
            const errors = error.details.map((d) => ({
                message: d.message,
                // Nested paths become "address.city"; top-level errors have no field
                ...(d.path.length ? { field: d.path.join('.') } : {}),
            }));
            return { errors, value: null };
        }
        return { errors: null, value: value as T };
    }
}

export default BaseDto;

import Joi from 'joi';
import BaseDto from '../../../common/dto/base.dto';

class RegisterDto extends BaseDto {
    static schema = Joi.object({
        email: Joi.string().email().lowercase().required(),
        password: Joi.string().min(8).required(),
        name: Joi.string().trim().max(50).required(),
    });
}

export default RegisterDto;

import Joi from 'joi';

const userSchema = Joi.object({
  username: Joi.string().alphanum().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  roleId: Joi.string()
    .guid({ version: ['uuidv4'] })
    .min(1)
    .label('roleId')
    .required()
    .messages({
      'string.guid': 'Role id is invalid',
    }),
});

export const searchUserSchema = Joi.object({
  page: Joi.number().integer().positive().min(1).default(1),
  limit: Joi.number().integer().positive().min(1).max(100).default(10),
  q: Joi.string().allow('').optional(),
});

export const getUserSchema = Joi.string()
  .guid({ version: ['uuidv4'] })
  .label('userId')
  .required()
  .messages({
    'string.guid': 'User id is invalid',
  });

export const signupSchema = userSchema.fork(['roleId'], schema =>
  schema.optional()
);

export const signinSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const verifyEmailSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const createUserSchema = userSchema;
export const updateProfileSchema = userSchema.fork(
  ['username', 'email', 'password', 'roleId'],
  schema => schema.optional()
);
export const updateUserSchema = userSchema.fork(
  ['username', 'email', 'password', 'roleId'],
  schema => schema.optional()
);

export const resetPasswordSchema = Joi.object({
  newPassword: Joi.string().min(6).required(),
});

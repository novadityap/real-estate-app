import Joi from 'joi';

const roleSchema = Joi.object({
  name: Joi.string()
    .required()
});

export const searchRoleSchema = Joi.object({
  page: Joi.number().integer().positive().min(1).default(1),
  limit: Joi.number().integer().positive().min(1).max(100).default(10),
  q: Joi.string().allow('').optional(),
});
export const getRoleSchema = Joi.string()
  .guid({ version: ['uuidv4'] })
  .label('roleId')
  .required()
  .messages({
    'string.guid': 'Role id is invalid',
  });
export const createRoleSchema = roleSchema;
export const updateRoleSchema = roleSchema.fork(['name'], schema =>
  schema.optional()
);

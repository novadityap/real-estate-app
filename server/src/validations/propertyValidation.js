import Joi from 'joi';

const propertyTypes = ['sale', 'rent'];
const propertySchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().required(),
  address: Joi.string().required(),
  regularPrice: Joi.number().integer().positive().required(),
  discountPrice: Joi.number().integer().positive().optional(),
  bathroom: Joi.number().integer().positive().required(),
  bedroom: Joi.number().integer().positive().required(),
  parking: Joi.boolean().required(),
  furnished: Joi.boolean().required(),
  type: Joi.string()
  .valid(...propertyTypes)
  .required()
  .messages({
    'any.only': `Property type must be one of: ${propertyTypes.join(', ')}`,
  }),
  offer: Joi.boolean().required(),
});

export const searchPropertySchema = Joi.object({
  page: Joi.number().integer().positive().min(1).default(1),
  limit: Joi.number().integer().positive().min(1).max(100).default(10),
  q: Joi.string().allow('').optional(),
});

export const getPropertySchema = Joi.string()
  .guid({ version: ['uuidv4'] })
  .label('propertyId')
  .required()
  .messages({
    'string.guid': 'Property id is invalid',
  });

export const createPropertySchema = propertySchema;
export const updatePropertySchema = propertySchema.fork(Object.keys(propertySchema.describe().keys), (schema) =>
  schema.optional()
);

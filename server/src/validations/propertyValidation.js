import Joi from 'joi';

const propertyTypes = ['sale', 'rent'];
const propertySchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().required(),
  address: Joi.string().required(),
  regularPrice: Joi.number().integer().positive().required(),
  offer: Joi.boolean().required(),
  discountPrice: Joi.when('offer', {
    is: true,
    then: Joi.number()
      .integer()
      .positive()
      .less(Joi.ref('regularPrice'))
      .required()
      .messages({
        'number.less': 'Discount price must be less than regular price',
        'any.required': 'Discount price is required when offer is true',
      }),
    otherwise: Joi.number().forbidden().messages({
      'any.unknown': 'Discount price is not allowed when offer is false',
    }),
  }),
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
});

export const searchPropertySchema = Joi.object({
  page: Joi.number().integer().positive().min(1).default(1),
  limit: Joi.number().integer().positive().min(1).max(100).default(10),
  q: Joi.string().allow('').optional(),
  type: Joi.string().valid('rent', 'sale').optional().allow(''),
  minPrice: Joi.number().integer().positive().min(0).optional(),
  maxPrice: Joi.number().integer().positive().min(0).optional(),
  minBedroom: Joi.number().integer().positive().min(0).optional(),
  maxBedroom: Joi.number().integer().positive().min(0).optional(),
  minBathroom: Joi.number().integer().positive().min(0).optional(),
  maxBathroom: Joi.number().integer().positive().min(0).optional(),
  offer: Joi.boolean().optional(),
  furnished: Joi.boolean().optional(),
  parking: Joi.boolean().optional(),
  sortBy: Joi.string().valid('latest', 'oldest', 'price_low_to_high', 'price_high_to_low').default('latest'),
});

export const getPropertySchema = Joi.string()
  .guid({ version: ['uuidv4'] })
  .label('propertyId')
  .required()
  .messages({
    'string.guid': 'Property id is invalid',
  });

export const removeImageSchema = Joi.object({
  image: Joi.string().uri().required().messages({
    'string.base': 'Image must be a string',
    'string.uri': 'Image URL must be a valid URL',
    'any.required': 'Image is required',
  }),
});

export const createPropertySchema = propertySchema;
export const updatePropertySchema = propertySchema.fork(
  Object.keys(propertySchema.describe().keys),
  schema => schema.optional()
);

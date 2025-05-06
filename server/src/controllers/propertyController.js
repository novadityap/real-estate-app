import {
  createPropertySchema,
  updatePropertySchema,
  getPropertySchema,
  searchPropertySchema,
} from '../validations/propertyValidation.js';
import validate from '../utils/validate.js';
import uploadFile from '../utils/uploadFile.js';
import ResponseError from '../utils/responseError.js';
import logger from '../utils/logger.js';
import checkOwnership from '../utils/checkOwnership.js';
import cloudinary from '../utils/cloudinary.js';
import extractPublicId from '../utils/extractPublicId.js';
import prisma from '../utils/database.js';

const show = async (req, res, next) => {
  try {
    const propertyId = validate(getPropertySchema, req.params.propertyId);

    const property = await prisma.property.findUnique({
      where: {
        id: propertyId,
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!property) {
      logger.warn('property not found');
      throw new ResponseError('Property not found', 404);
    }

    logger.info('Property retrieved successfully');
    res.json({
      code: 200,
      message: 'Property retrieved successfully',
      data: property,
    });
  } catch (e) {
    next(e);
  }
};

const search = async (req, res, next) => {
  try {
    const query = validate(searchPropertySchema, req.query);
    const { page, limit, q } = query;

    const [properties, totalProperties] = await prisma.$transaction([
      prisma.property.findMany({
        where: q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
                { address: { contains: q, mode: 'insensitive' } },
                { type: { contains: q, mode: 'insensitive' } },
                {
                  owner: {
                    is: {
                      username: { contains: q, mode: 'insensitive' },
                    },
                  },
                },
                {
                  owner: {
                    is: {
                      email: { contains: q, mode: 'insensitive' },
                    },
                  },
                },
              ],
            }
          : undefined,
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.property.count({
        where: q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
                { address: { contains: q, mode: 'insensitive' } },
                { type: { contains: q, mode: 'insensitive' } },
                {
                  owner: {
                    is: {
                      username: { contains: q, mode: 'insensitive' },
                    },
                  },
                },
                {
                  owner: {
                    is: {
                      email: { contains: q, mode: 'insensitive' },
                    },
                  },
                },
              ],
            }
          : undefined,
      }),
    ]);

    if (properties.length === 0) {
      logger.info('no properties found');
      return res.json({
        code: 200,
        message: 'No properties found',
        data: [],
        meta: {
          pageSize: limit,
          totalItems: 0,
          currentPage: page,
          totalPages: 0,
        },
      });
    }

    logger.info('properties retrieved successfully');
    res.json({
      code: 200,
      message: 'Properties retrieved successfully',
      data: properties,
      meta: {
        pageSize: limit,
        totalItems: totalProperties,
        currentPage: page,
        totalPages: Math.ceil(totalProperties / limit),
      },
    });
  } catch (e) {
    next(e);
  }
};

const create = async (req, res, next) => {
  try {
    const { files, fields } = await uploadFile(req, {
      fieldname: 'images',
      folderName: 'properties',
      isRequired: true,
      maxFiles: 5,
      formSchema: createPropertySchema,
    });

    fields.images = [];

    for (const file of files) {
      fields.images.push(file.secure_url);
    }

    await prisma.property.create({
      data: {
        ...fields,
        ownerId: req.user.id,
      },
    });

    logger.info('property created successfully');
    res.status(201).json({
      code: 201,
      message: 'Property created successfully',
    });
  } catch (e) {
    next(e);
  }
};

const update = async (req, res, next) => {
  try {
    const propertyId = validate(getPropertySchema, req.params.propertyId);
    await checkOwnership({
      modelName: 'property',
      paramsId: propertyId,
      ownerFieldName: 'ownerId',
      currentUser: req.user,
    });

    const property = await prisma.property.findUnique({
      where: {
        id: propertyId,
      },
    });

    if (!property) {
      logger.warn('property not found');
      throw new ResponseError('Property not found', 404);
    }

    const { files, fields } = await uploadFile(req, {
      fieldname: 'images',
      maxFiles: 5,
      folderName: 'properties',
      formSchema: updatePropertySchema,
    });

    if (files && files.length > 0) {
      const newImages = files.map(f => f.secure_url);
      const oldImages = property.images;

      const imagesToDelete = oldImages.filter(img => !newImages.includes(img));

      for (const image of imagesToDelete) {
        await cloudinary.uploader.destroy(extractPublicId(image));
      }

      fields.images = newImages;
      logger.info('property images updated successfully');
    }

    const updatedProperty = await prisma.property.update({
      where: {
        id: propertyId,
      },
      data: fields,
    });

    logger.info('property updated successfully');
    res.json({
      code: 200,
      message: 'Property updated successfully',
      data: updatedProperty,
    });
  } catch (e) {
    next(e);
  }
};

const remove = async (req, res, next) => {
  try {
    const propertyId = validate(getPropertySchema, req.params.propertyId);
    await checkOwnership({
      modelName: 'property',
      paramsId: propertyId,
      ownerFieldName: 'ownerId',
      currentUser: req.user,
    });

    const property = await prisma.property.findUnique({
      where: {
        id: propertyId,
      },
    });

    if (!property) {
      logger.warn('property not found');
      throw new ResponseError('Property not found', 404);
    }

    for (const image of property.images) {
      await cloudinary.uploader.destroy(extractPublicId(image));
    }

    logger.info('property images deleted successfully');

    await prisma.property.delete({
      where: {
        id: propertyId,
      },
    });

    logger.info('property deleted successfully');
    res.json({
      code: 200,
      message: 'Property deleted successfully',
    });
  } catch (e) {
    next(e);
  }
};

export default { show, search, create, update, remove };

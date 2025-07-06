import {
  createPropertySchema,
  updatePropertySchema,
  getPropertySchema,
  searchPropertySchema,
  removeImageSchema,
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

  if (!property) throw new ResponseError('Property not found', 404);

  logger.info('Property retrieved successfully');
  res.status(200).json({
    code: 200,
    message: 'Property retrieved successfully',
    data: property,
  });
};

const search = async (req, res, next) => {
  const query = validate(searchPropertySchema, req.query);
  const {
    q,
    type,
    minPrice,
    maxPrice,
    minBedroom,
    maxBedroom,
    minBathroom,
    maxBathroom,
    offer,
    furnished,
    parking,
    sortBy,
    page,
    limit,
    source
  } = query;

  const where = {
    AND: [],
  };

  if (source === 'datatable' && req.user.role !== 'admin') {
    where.AND.push({ ownerId: req.user.id });
  }

  if (q) {
    const searchConditions = [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { address: { contains: q, mode: 'insensitive' } },
      { type: { contains: q, mode: 'insensitive' } },
      {
        owner: {
          OR: [{ email: { contains: q, mode: 'insensitive' } }],
        },
      },
    ];

    if (!isNaN(Number(q))) {
      searchConditions.push(
        { regularPrice: { equals: Number(q) } },
        { discountPrice: { equals: Number(q) } },
        { bedroom: { equals: Number(q) } },
        { bathroom: { equals: Number(q) } }
      );
    }

    where.AND.push({ OR: searchConditions });
  }

  if (type) where.AND.push({ type: { equals: type } });
  if (offer !== undefined) where.AND.push({ offer });
  if (furnished !== undefined) where.AND.push({ furnished });
  if (parking !== undefined) where.AND.push({ parking });

  if (minPrice || maxPrice) {
    const priceFilter = {};

    if (minPrice) {
      priceFilter.OR = [
        { regularPrice: { gte: Number(minPrice) } },
        { discountPrice: { gte: Number(minPrice) } },
      ];
    }

    if (maxPrice) {
      priceFilter.OR = [
        ...(priceFilter.OR || []),
        { regularPrice: { lte: Number(maxPrice) } },
        { discountPrice: { lte: Number(maxPrice) } },
      ];
    }

    where.AND.push(priceFilter);
  }

  if (minBedroom || maxBedroom) {
    const bedroomFilter = { bedroom: {} };
    if (minBedroom) bedroomFilter.bedroom.gte = Number(minBedroom);
    if (maxBedroom) bedroomFilter.bedroom.lte = Number(maxBedroom);
    where.AND.push(bedroomFilter);
  }

  if (minBathroom || maxBathroom) {
    const bathroomFilter = { bathroom: {} };
    if (minBathroom) bathroomFilter.bathroom.gte = Number(minBathroom);
    if (maxBathroom) bathroomFilter.bathroom.lte = Number(maxBathroom);
    where.AND.push(bathroomFilter);
  }

  let orderBy = { createdAt: 'desc' };
  if (sortBy === 'oldest') {
    orderBy = { createdAt: 'asc' };
  } else if (sortBy === 'latest') {
    orderBy = { createdAt: 'desc' };
  } else if (sortBy === 'price_low_to_high') {
    orderBy = [{ regularPrice: 'asc' }, { discountPrice: 'asc' }];
  } else if (sortBy === 'price_high_to_low') {
    orderBy = [{ regularPrice: 'desc' }, { discountPrice: 'desc' }];
  }

  const [properties, totalProperties] = await prisma.$transaction([
    prisma.property.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy,
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
    }),
    prisma.property.count({ where }),
  ]);

  if (properties.length === 0) {
    logger.info('no properties found');
    return res.status(200).json({
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
  res.status(200).json({
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
};

const create = async (req, res, next) => {
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
};

const update = async (req, res, next) => {
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

  if (!property) throw new ResponseError('Property not found', 404);

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
  res.status(200).json({
    code: 200,
    message: 'Property updated successfully',
    data: updatedProperty,
  });
};

const remove = async (req, res, next) => {
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

  if (!property) throw new ResponseError('Property not found', 404);

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
  res.status(200).json({
    code: 200,
    message: 'Property deleted successfully',
  });
};

const uploadImage = async (req, res, next) => {
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

  if (!property) throw new ResponseError('Property not found', 404);

  const existingFileCount = property.images.length;

  const { files } = await uploadFile(req, {
    fieldname: 'images',
    maxFiles: 5,
    folderName: 'properties',
    existingFileCount,
  });
  
  for (const file of files) {
    property.images.push(file.secure_url);
  }

  await prisma.property.update({
    where: {
      id: propertyId,
    },
    data: {
      images: property.images,
    },
  });

  logger.info('property images uploaded successfully');
  res.status(201).json({
    code: 201,
    message: 'Property images uploaded successfully',
  });
};

const removeImage = async (req, res, next) => {
  const propertyId = validate(getPropertySchema, req.params.propertyId);
  const fields = validate(removeImageSchema, req.body);

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

  if (!property) throw new ResponseError('Property not found', 404);

  if (!property.images.includes(fields.image)) {
    throw new ResponseError('Image not found in this property', 404);
  }

  const publicId = extractPublicId(fields.image);
  await cloudinary.uploader.destroy(publicId);

  const updatedImages = property.images.filter(img => img !== fields.image);

  await prisma.property.update({
    where: { id: propertyId },
    data: { images: updatedImages },
  });

  logger.info('property image deleted successfully');
  res.status(200).json({
    code: 200,
    message: 'Property image deleted successfully',
  });
};

export default {
  show,
  search,
  create,
  update,
  remove,
  removeImage,
  uploadImage,
};

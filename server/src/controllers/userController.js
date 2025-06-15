import {
  createUserSchema,
  updateUserSchema,
  getUserSchema,
  searchUserSchema,
  updateProfileSchema,
} from '../validations/userValidation.js';
import validate from '../utils/validate.js';
import uploadFile from '../utils/uploadFile.js';
import ResponseError from '../utils/responseError.js';
import logger from '../utils/logger.js';
import bcrypt from 'bcrypt';
import checkOwnership from '../utils/checkOwnership.js';
import cloudinary from '../utils/cloudinary.js';
import extractPublicId from '../utils/extractPublicId.js';
import prisma from '../utils/database.js';

const show = async (req, res, next) => {
  const userId = validate(getUserSchema, req.params.userId);
  await checkOwnership({
    modelName: 'user',
    paramsId: userId,
    ownerFieldName: 'userId',
    currentUser: req.user,
  });

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      role: true,
    },
  });

  if (!user) throw new ResponseError('User not found', 404);

  logger.info('user retrieved successfully');
  res.status(200).json({
    code: 200,
    message: 'User retrieved successfully',
    data: user,
  });
};

const updateProfile = async (req, res, next) => {
  const userId = validate(getUserSchema, req.params.userId);
  await checkOwnership({
    modelName: 'user',
    paramsId: userId,
    ownerFieldName: 'userId',
    currentUser: req.user,
  });

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) throw new ResponseError('User not found', 404);

  const { files, fields } = await uploadFile(req, {
    fieldname: 'avatar',
    folderName: 'avatars',
    formSchema: updateProfileSchema,
  });

  if (fields.username && fields.username !== user.username) {
    const isUsernameTaken =
      (await prisma.user.count({
        where: {
          username: fields.username,
          id: { not: userId },
        },
      })) > 0;

    if (isUsernameTaken) {
      throw new ResponseError('Validation errors', 400, {
        username: 'Username already in use',
      });
    }
  }

  if (fields.email && fields.email !== user.email) {
    const isEmailTaken =
      (await prisma.user.count({
        where: {
          email: fields.email,
          id: { not: userId },
        },
      })) > 0;

    if (isEmailTaken) {
      throw new ResponseError('Validation errors', 400, {
        email: 'Email already in use',
      });
    }
  }

  if (fields.password) fields.password = await bcrypt.hash(fields.password, 10);

  if (files && files.length > 0) {
    if (user.avatar !== process.env.DEFAULT_AVATAR_URL)
      await cloudinary.uploader.destroy(extractPublicId(user.avatar));

    fields.avatar = files[0].secure_url;
    logger.info('avatar updated successfully');
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: fields,
    include: {
      role: true,
    },
  });

  logger.info('profile updated successfully');
  res.status(200).json({
    code: 200,
    message: 'Profile updated successfully',
    data: {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      role: updatedUser.role.name,
    },
  });
};

const search = async (req, res, next) => {
  const query = validate(searchUserSchema, req.query);
  const { page, limit, q } = query;

  const where = {};

  if (q) {
    where.OR = [
      { username: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      {
        role: {
          is: {
            name: {
              contains: q,
              mode: 'insensitive',
            },
          },
        },
      },
    ];
  }

  const [users, totalUsers] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      include: {
        role: true,
      },
      orderBy: [{ role: { name: 'asc' } }, { createdAt: 'desc' }],
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
    }),
    prisma.user.count({ where }),
  ]);

  if (users.length === 0) {
    logger.info('no users found');
    return res.status(200).json({
      code: 200,
      message: 'No users found',
      data: [],
      meta: {
        pageSize: limit,
        totalItems: 0,
        currentPage: page,
        totalPages: 0,
      },
    });
  }

  logger.info('users retrieved successfully');
  res.status(200).json({
    code: 200,
    message: 'Users retrieved successfully',
    data: users,
    meta: {
      pageSize: limit,
      totalItems: totalUsers,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
    },
  });
};

const create = async (req, res, next) => {
  const fields = validate(createUserSchema, req.body);

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username: fields.username }, { email: fields.email }],
    },
  });

  const errors = {};

  if (user) {
    if (user.username === fields.username) {
      errors.username = 'Username already in use';
    }
    if (user.email === fields.email) {
      errors.email = 'Email already in use';
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ResponseError('Validation errors', 400, errors);
  }

  const role = await prisma.role.findUnique({
    where: {
      id: fields.roleId,
    },
  });

  if (!role) {
    throw new ResponseError('Validation errors', 400, {
      roles: 'Invalid role id',
    });
  }

  delete fields.roleId;

  fields.password = await bcrypt.hash(fields.password, 10);

  await prisma.user.create({
    data: {
      avatar: process.env.DEFAULT_AVATAR_URL,
      isVerified: true,
      verificationToken: null,
      verificationTokenExpires: null,
      roleId: role.id,
      ...fields,
    },
  });

  logger.info('user created successfully');
  res.status(201).json({
    code: 201,
    message: 'User created successfully',
  });
};

const update = async (req, res, next) => {
  const userId = validate(getUserSchema, req.params.userId);
  await checkOwnership({
    modelName: 'user',
    paramsId: userId,
    ownerFieldName: 'userId',
    currentUser: req.user,
  });

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) throw new ResponseError('User not found', 404);

  const { files, fields } = await uploadFile(req, {
    fieldname: 'avatar',
    folderName: 'avatars',
    formSchema: updateUserSchema,
  });

  if (fields.username && fields.username !== user.username) {
    const isUsernameTaken =
      (await prisma.user.count({
        where: {
          username: fields.username,
          id: { not: userId },
        },
      })) > 0;

    if (isUsernameTaken) {
      throw new ResponseError('Validation errors', 400, {
        username: 'Username already in use',
      });
    }
  }

  if (fields.email && fields.email !== user.email) {
    const isEmailTaken =
      (await prisma.user.count({
        where: {
          email: fields.email,
          id: { not: userId },
        },
      })) > 0;

    if (isEmailTaken) {
      throw new ResponseError('Validation errors', 400, {
        email: 'Email already in use',
      });
    }
  }

  if (fields.roleId) {
    const role = await prisma.role.findUnique({
      where: {
        id: fields.roleId,
      },
    });

    if (!role) {
      throw new ResponseError('Validation errors', 400, {
        roles: 'Invalid role id',
      });
    }
  }

  if (fields.password) fields.password = await bcrypt.hash(fields.password, 10);

  if (files && files.length > 0) {
    if (user.avatar !== process.env.DEFAULT_AVATAR_URL)
      await cloudinary.uploader.destroy(extractPublicId(user.avatar));

    fields.avatar = files[0].secure_url;
    logger.info('avatar updated successfully');
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: fields,
  });

  logger.info('user updated successfully');
  res.status(200).json({
    code: 200,
    message: 'User updated successfully',
    data: updatedUser,
  });
};

const remove = async (req, res, next) => {
  const userId = validate(getUserSchema, req.params.userId);
  await checkOwnership({
    modelName: 'user',
    paramsId: userId,
    ownerFieldName: 'userId',
    currentUser: req.user,
  });

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) throw new ResponseError('User not found', 404);

  const properties = await prisma.property.findMany({
    where: {
      ownerId: userId,
    },
  });

  if (properties.length !== 0) {
    const propertyPublicIds = properties.flatMap(property =>
      property.images
        .map(image => extractPublicId(image))
        .filter(publicId => publicId !== null)
    );

    if (propertyPublicIds.length > 0)
      await cloudinary.api.delete_resources(propertyPublicIds);
  }

  if (user.avatar !== process.env.DEFAULT_AVATAR_URL) {
    await cloudinary.uploader.destroy(extractPublicId(user.avatar));
    logger.info('avatar deleted successfully');
  }

  await prisma.user.delete({
    where: {
      id: userId,
    },
  });

  logger.info('user deleted successfully');
  res.status(200).json({
    code: 200,
    message: 'User deleted successfully',
  });
};

export default { show, search, create, update, remove, updateProfile };

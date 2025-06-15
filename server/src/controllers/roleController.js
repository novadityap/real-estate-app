import ResponseError from '../utils/responseError.js';
import logger from '../utils/logger.js';
import validate from '../utils/validate.js';
import {
  createRoleSchema,
  updateRoleSchema,
  getRoleSchema,
  searchRoleSchema,
} from '../validations/roleValidation.js';
import prisma from '../utils/database.js';

const create = async (req, res, next) => {
  const fields = validate(createRoleSchema, req.body);

  const isNameTaken =
    (await prisma.role.count({
      where: {
        name: fields.name,
      },
    })) > 0;

  if (isNameTaken) {
    throw new ResponseError('Validation errors', 400, {
      name: 'Name already in use',
    });
  }

  await prisma.role.create({
    data: fields,
  });

  logger.info('role created successfully');
  res.status(201).json({
    code: 201,
    message: 'Role created successfully',
  });
};

const search = async (req, res, next) => {
  const query = validate(searchRoleSchema, req.query);
  const { page, limit, q } = query;
  const where = {};

  if (q) {
    where.OR = [{ name: { contains: q, mode: 'insensitive' } }];
  }

  const [roles, totalRoles] = await prisma.$transaction([
    prisma.role.findMany({
      where,
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
      orderBy: {
        name: 'asc',
      },
    }),
    prisma.role.count({ where }),
  ]);

  if (roles.length === 0) {
    logger.info('no roles found');
    return res.status(200).json({
      code: 200,
      message: 'No roles found',
      data: [],
      meta: {
        pageSize: limit,
        totalItems: 0,
        currentPage: page,
        totalPages: 0,
      },
    });
  }

  logger.info('roles retrieved successfully');
  res.status(200).json({
    code: 200,
    message: 'Roles retrieved successfully',
    data: roles,
    meta: {
      pageSize: limit,
      totalItems: totalRoles,
      currentPage: page,
      totalPages: Math.ceil(totalRoles / limit),
    },
  });
};

const list = async (req, res, next) => {
  const roles = await prisma.role.findMany();
  if (roles.length === 0) {
    logger.info('no roles found');
    return res.status(200).json({
      code: 200,
      message: 'No roles found',
      data: [],
    });
  }

  logger.info('roles retrieved successfully');
  res.status(200).json({
    code: 200,
    message: 'Roles retrieved successfully',
    data: roles,
  });
};

const show = async (req, res, next) => {
  const roleId = validate(getRoleSchema, req.params.roleId);

  const role = await prisma.role.findUnique({
    where: {
      id: roleId,
    },
  });

  if (!role) throw new ResponseError('Role not found', 404);

  logger.info('role retrieved successfully');
  res.status(200).json({
    code: 200,
    message: 'Role retrieved successfully',
    data: role,
  });
};

const update = async (req, res, next) => {
  const roleId = validate(getRoleSchema, req.params.roleId);
  const fields = validate(updateRoleSchema, req.body);

  const role = await prisma.role.findUnique({
    where: {
      id: roleId,
    },
  });

  if (!role) throw new ResponseError('Role not found', 404);

  if (fields.name && fields.name != role.name) {
    const isNameTaken =
      (await prisma.role.count({
        where: {
          name: fields.name,
        },
      })) > 0;

    if (isNameTaken) {
      throw new ResponseError('Validation errors', 400, {
        name: 'Name already in use',
      });
    }
  }

  const updatedRole = await prisma.role.update({
    where: {
      id: roleId,
    },
    data: fields,
  });

  logger.info('role updated successfully');
  res.status(200).json({
    code: 200,
    message: 'Role updated successfully',
    data: updatedRole,
  });
};

const remove = async (req, res, next) => {
  const roleId = validate(getRoleSchema, req.params.roleId);

  const role = await prisma.role.findUnique({
    where: {
      id: roleId,
    },
  });

  if (!role) throw new ResponseError('Role not found', 404);

  await prisma.role.delete({
    where: {
      id: roleId,
    },
  });

  logger.info('role deleted successfully');
  res.status(200).json({
    code: 200,
    message: 'Role deleted successfully',
  });
};

export default { create, search, show, update, remove, list };

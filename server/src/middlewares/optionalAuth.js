import logger from '../utils/logger.js';
import jwt from 'jsonwebtoken';

const optionalAuth = async (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = {
        id: decoded.sub,
        role: decoded.role,
      };

      logger.info('User identified from optionalAuth middleware', {
        userId: decoded.sub,
        role: decoded.role,
      });
    } else {
      req.user = null;
      logger.info('Guest access (no token)');
    }

    next();
};

export default optionalAuth;

import express from 'express';
import propertyController from '../controllers/propertyController.js';
import dashboardController from '../controllers/dashboardController.js';
import roleController from '../controllers/roleController.js';
import userController from '../controllers/userController.js';
import authController from '../controllers/authController.js';
import authorize from '../middlewares/authorize.js';
import authenticate from '../middlewares/authenticate.js';

const apiRouter = express.Router();

// Public API
apiRouter.post('/auth/signup', authController.signup);
apiRouter.post('/auth/verify-email/:verificationToken', authController.verifyEmail);
apiRouter.post('/auth/resend-verification', authController.resendVerification);
apiRouter.post('/auth/refresh-token', authController.refreshToken);
apiRouter.post('/auth/signin', authController.signin);
apiRouter.post('/auth/request-reset-password', authController.requestResetPassword);
apiRouter.post('/auth/reset-password/:resetToken', authController.resetPassword);
apiRouter.get('/properties/search', propertyController.search);
apiRouter.get('/properties/:propertyId', propertyController.show);

// Auth API
apiRouter.post('/auth/signout', authenticate, authController.signout);

// Dashboard API
apiRouter.get('/dashboard', authenticate, authorize(['admin']), dashboardController.stats);

// Role API
apiRouter.get('/roles', authenticate, authorize(['admin']), roleController.list);
apiRouter.post('/roles', authenticate, authorize(['admin']), roleController.create);
apiRouter.get('/roles/search', authenticate, authorize(['admin']), roleController.search);
apiRouter.get('/roles/:roleId', authenticate, authorize(['admin']), roleController.show);
apiRouter.patch('/roles/:roleId', authenticate, authorize(['admin']), roleController.update);
apiRouter.delete('/roles/:roleId', authenticate, authorize(['admin']), roleController.remove);

// User API
apiRouter.get('/users/search', authenticate, authorize(['admin']), userController.search);
apiRouter.post('/users', authenticate, authorize(['admin']), userController.create);
apiRouter.get('/users/:userId', authenticate, authorize(['admin', 'user']), userController.show);
apiRouter.patch('/users/:userId', authenticate, authorize(['admin']), userController.update);
apiRouter.patch('/users/:userId/profile', authenticate, authorize(['admin', 'user']), userController.updateProfile);
apiRouter.delete('/users/:userId', authenticate, authorize(['admin', 'user']), userController.remove);

// Property API
apiRouter.post('/properties', authenticate, authorize(['admin', 'user']), propertyController.create);
apiRouter.patch('/properties/:propertyId', authenticate, authorize(['admin', 'user']), propertyController.update);
apiRouter.delete('/properties/:propertyId', authenticate, authorize(['admin', 'user']), propertyController.remove);
apiRouter.post('/properties/:propertyId/images', authenticate, authorize(['admin', 'user']), propertyController.uploadImage);
apiRouter.delete('/properties/:propertyId/images', authenticate, authorize(['admin', 'user']), propertyController.removeImage);

export default apiRouter;
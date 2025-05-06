import express from 'express';
import propertyController from '../controllers/propertyController.js';
// import dashboardController from '../controllers/dashboardController.js';
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

apiRouter.use(authenticate);

// Auth API
apiRouter.post('/auth/signout', authController.signout);

// Dashboard API
// apiRouter.get('/dashboard', authorize(['admin']), dashboardController.stats);

// Role API
apiRouter.get('/roles', authorize(['admin']), roleController.list);
apiRouter.post('/roles', authorize(['admin']), roleController.create);
apiRouter.get('/roles/search', authorize(['admin']), roleController.search);
apiRouter.get('/roles/:roleId', authorize(['admin']), roleController.show);
apiRouter.put('/roles/:roleId', authorize(['admin']), roleController.update);
apiRouter.delete('/roles/:roleId', authorize(['admin']), roleController.remove);

// User API
apiRouter.get('/users/search', authorize(['admin']), userController.search);
apiRouter.post('/users', authorize(['admin']), userController.create);
apiRouter.get('/users/:userId', authorize(['admin', 'user']), userController.show);
apiRouter.patch('/users/:userId', authorize(['admin']), userController.update);
apiRouter.patch('/users/:userId/profile', authorize(['admin', 'user']), userController.updateProfile);
apiRouter.delete('/users/:userId', authorize(['admin', 'user']), userController.remove);

// Property API
apiRouter.post('/properties', authorize(['admin', 'user']), propertyController.create);
apiRouter.patch('/properties/:propertyId', authorize(['admin']), propertyController.update);
apiRouter.delete('/properties/:propertyId', authorize(['admin', 'user']), propertyController.remove);

export default apiRouter;
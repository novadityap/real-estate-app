import app from './app.js';
import logger from './utils/logger.js';
import loadEnv from '/utils/loadEnv.js'

(async () => {
  loadEnv();

  app.listen(process.env.PORT, '0.0.0.0', () => logger.info(`Server running on port ${process.env.PORT}`));
})();
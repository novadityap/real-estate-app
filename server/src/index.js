import app from './app.js';
import 'dotenv/config';
import logger from './utils/logger.js';

(async () => {
  const port = process.env.PORT || 3000;

  app.listen(port, '0.0.0.0', () => logger.info(`Server running on port ${port}`));
})();
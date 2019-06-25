/**
 * Copyright 2019 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an 'AS IS' BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
import * as bodyParser from 'body-parser';
import * as express from 'express';
import { getLogger } from 'log4js';
import * as path from 'path';
import * as swaggerUi from 'swagger-ui-express';
import * as YAML from 'yamljs';
import * as config from 'config';

import setupRoutes from './routes/index';
import * as errorHandler from './middlewares/error-handler';

const app: express.Application = express();

/**
 * Set up logging
 */
const logger = getLogger('server');
logger.level = config.get('logLevel');

logger.debug('setting up app: registering routes, middleware...');

/**
 * Load swagger document
 */
const swaggerDocument = YAML.load(path.join(__dirname, '../public', 'swagger.yaml'));

/**
 * Support json parsing
 */
app.use(bodyParser.urlencoded({
  extended: true,
}));
app.use(bodyParser.json({ limit: '50mb' }));

/**
 * Register routes
 */
setupRoutes().then((router) => {
  app.use(router);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  /**
   * Error handler
   */
  app.use(errorHandler.catchNotFound);
  app.use(errorHandler.handleError);

  /**
   * Start server
   */
  const host = process.env.HOST || config.get('host');
  const port = process.env.PORT || config.get('port');
  app.listen(port, () => {
    logger.info(`app listening on http://${host}:${port}`);

    logger.info(`Swagger UI is available at http://${host}:${port}/api-docs`);
  });
}).catch((err) => {
  logger.error(err.message);
});

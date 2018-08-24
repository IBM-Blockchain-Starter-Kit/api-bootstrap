/**
 * Copyright 2018 IBM Corp. All Rights Reserved.
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

const bodyParser = require('body-parser');
const express = require('express');
const log4js = require('log4js');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const config = require('config');

const routes = require('./routes');
const errorHandler = require('./middlewares/error-handler');

const app = express();

/**
 * Set up logging
 */
const logger = log4js.getLogger('server');
logger.setLevel(config.logLevel);

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
app.use(routes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

/**
 * Error handler
 */
app.use(errorHandler.catchNotFound);
app.use(errorHandler.handleError);

/**
 * Start server
 */
const host = process.env.HOST || config.host;
const port = process.env.PORT || config.port;
app.listen(port, () => {
  logger.info(`app listening on http://${host}:${port}`);

  logger.info(`Swagger UI is available at http://${host}:${port}/api-docs`);
});

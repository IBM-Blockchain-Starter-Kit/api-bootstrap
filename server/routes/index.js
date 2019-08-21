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

const express = require('express');
const log4js = require('log4js');
const config = require('config');

const { FabricRoutes } = require('../middlewares/fabric-routes');
const health = require('./health');

const router = express.Router();
const logger = log4js.getLogger('routes - index');
logger.level = config.logLevel;

/**
 * Add all the specified routes and return the router object
 */
async function setupRoutes() {
  logger.debug('entering >>> setupRoutes');

  try {
    // Add routes
    router.use('/health', health);

    // Hyperledger Fabric routes
    // add specified routes and create their middleware functions to connect to the fabric network
    const fabricRoutes = new FabricRoutes(router);
    await fabricRoutes.setup();

    // GET home page
    router.get('/', (req, res) => {
      logger.debug('GET /');
      res.redirect('/api-docs');
    });

    logger.debug('exiting <<< setupRoutes');
    return router;
  } catch (err) {
    logger.error(err.message);
    throw new Error(err.message);
  }
}

module.exports = setupRoutes;

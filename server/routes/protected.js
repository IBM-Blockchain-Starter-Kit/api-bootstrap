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
const auth = require('../middlewares/auth');
const passport = require('passport');
const APIStrategy = require('ibmcloud-appid').APIStrategy;

const protected = require('../controllers/protected');

const router = express.Router();

/**
 * Set up logging
 */
const logger = log4js.getLogger('routes - protected');
logger.setLevel(config.logLevel);

if (process.env.NODE_ENV == 'production') {
  logger.debug('setting up /protected route');
}
/**
 * Add protected route
 * Create an array of client ID's that are able to access this endpoint
 * and pass the list to the filter function
 */

router.get('/', passport.authenticate(APIStrategy.STRATEGY_NAME, {session: false}), auth.filter(['990de778-d3ad-4fea-a619-e7c9d3b900d3']), protected.getProtected);

module.exports = router;
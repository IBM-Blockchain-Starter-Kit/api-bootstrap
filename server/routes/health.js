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

const healthCtrl = require('../controllers/health');

const router = express.Router();

/**
 * Set up logging
 */
const logger = log4js.getLogger('routes - health');
logger.setLevel(config.logLevel);

logger.debug('setting up /health route');

/**
 * Add routes
 */
router.get('/', healthCtrl.getHealth);

module.exports = router;

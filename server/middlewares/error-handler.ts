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

import * as config from 'config';
import * as createError from 'http-errors';
import { getLogger } from 'log4js';

import * as util from '../helpers/util';

/**
 * Set up logging
 */
const logger = getLogger('middlewares - error-handler');
logger.level = config.get('logLevel');

/**
 * Catch 404 Error and forward to error handler function
 */
export const catchNotFound = (req, res, next) => {
  logger.debug('entering >>> catchNotFound()');
  next(createError(404, '404: Page not found'));
};

/**
 * Error handler function
 */
export const handleError = (err, req, res, next) => {
  logger.debug('entering >>> handleError()');
  const jsonRes = {
    message: err.message,
    statusCode: err.status || 500,
    success: false,
  };
  util.sendResponse(res, jsonRes);
};

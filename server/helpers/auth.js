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
const jwt = require('jsonwebtoken');
const log4js = require('log4js');
const config = require('config');
const util = require('../helpers/util');

/**
 * Set up logging
 */
const logger = log4js.getLogger('helpers - auth');
logger.setLevel(config.logLevel);


logger.debug('importing up app id config');

/**
 * auth object
 */
const auth = {};

/**
* filter audience, or list of client ID's, that can access this
*/
auth.filter = whitelist => (req, res, next) => {
  const accessTokenString = auth.getAccessToken(req, next);
  const accessTokenPayload = jwt.decode(accessTokenString);

  const audience = auth.getAudience(accessTokenPayload);

  if (whitelist.includes(audience)) {
    logger.debug('client is in whitelist, proceed');
    next();
  } else {
    logger.debug('token does not have the appropriate access rights (aud)');
    res.status(401).send({ error: 'invalid_grant', message: 'This token does not have the appropriate access rights (aud)' });
  }
};

/**
 * Takes the token and determines what version to return formatted audience
 */
auth.getAudience = (token) => {
  logger.info(`token aud: ${token.aud}`);
  let audience;
  if (Array.isArray(token.aud)) {
    logger.debug('token.aud is an array - convert to string');
    audience = token.aud.toString();
  } else {
    logger.debug('token.aud is a string');
    audience = token.aud;
  }
  logger.debug(`audience: ${audience}`);
  return audience;
};

/**
 * Helper to grab auth header from request
 */
auth.getAccessToken = (req, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    logger.debug('Authorization header not found');
    return next(new Error('Authorization header not found'));
  }

  // Check for Bearer type in header component
  const authHeaderComponents = authHeader.split(' ');
  if (authHeaderComponents[0].indexOf('Bearer') !== 0) {
    logger.debug('Malformed authorization header');
    return next(new Error('Malformed authorization header'));
  }
  return authHeaderComponents[1];
};

module.exports = auth;

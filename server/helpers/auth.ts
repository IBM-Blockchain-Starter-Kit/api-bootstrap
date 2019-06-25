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
import * as jwt from 'jsonwebtoken';
import { getLogger } from 'log4js';
import * as config from 'config';

/**
 * Set up logging
 */
const logger = getLogger('helpers - auth');
logger.level = config.get('logLevel');


logger.debug('importing app id config');

/**
 * Takes the token and determines what version to return formatted audience
 */
export const getAudience = (token) => {
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
export const getAccessToken = (req, next) => {
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

/**
* filter audience, or list of client ID's, that can access this
*/
export const filter = whitelist => (req, res, next) => {
  const accessTokenString = getAccessToken(req, next);
  const accessTokenPayload = jwt.decode(accessTokenString);

  const audience = getAudience(accessTokenPayload);

  if (whitelist.includes(audience)) {
    logger.debug('client is in whitelist, proceed');
    next();
  } else {
    logger.debug('token does not have the appropriate access rights (aud)');
    res.statusCode = 401;
    res.json({ error: 'invalid_grant', message: 'This token does not have the appropriate access rights (aud)' });
  }
};

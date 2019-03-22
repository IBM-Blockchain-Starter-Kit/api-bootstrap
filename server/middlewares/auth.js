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
const logger = log4js.getLogger('middlewares - auth');
logger.setLevel(config.logLevel);


logger.debug('importing up app id config');

function getAudience(token) {
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
}

/**
 * auth object
 */
const auth = {};

/**
* filter audience, or list of client ID's, that can access this
*/
auth.filter = whitelist => (req, res, next) => {
  const accessTokenString = util.getAccessToken(req, next);
  const accessTokenPayload = jwt.decode(accessTokenString);

  const audience = getAudience(accessTokenPayload);

  if (whitelist.includes(audience)) {
    logger.debug('client is in whitelist, proceed');
    next();
  } else {
    logger.debug('token does not have the appropriate access rights (aud)');
    res.status(401).send({ error: 'invalid_grant', message: 'This token does not have the appropriate access rights (aud)' });
  }
};

module.exports = auth;

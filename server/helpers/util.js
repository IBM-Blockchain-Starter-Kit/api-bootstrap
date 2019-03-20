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

const log4js = require('log4js');
const fs = require('fs');
const config = require('config');
const FabricCAServices = require('fabric-ca-client');

/**
 * Set up logging
 */
const logger = log4js.getLogger('helpers - util');
logger.setLevel(config.logLevel);

/**
 * Util object
 */
const util = {};

/**
 * Send http response helper
 * res: express response object
 * msg: {statusCode (int), success (bool), message (string), etc}
 */
util.sendResponse = (res, msg) => {
  logger.debug('entering >>> sendResponse()');
  const response = msg;
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = response.statusCode;
  delete response.statusCode;
  res.json(response);
};

/**
 * Get network config file path for org
 */
util.getNetworkConfigFilePath = (org) => {
  logger.debug('entering >>> getNetworkConfigFilePath()');
  return `${__dirname}/../../fabric-network/network-config-${org}.json`;
};

/**
 * Enroll given user with given org Fabric CA
 */
util.userEnroll = (orgName, enrollId, enrollSecret) => {
  logger.debug('entering >>> userEnroll()');
  logger.debug(`Enrolling user ${enrollId}`);
  return new Promise(((resolve, reject) => {
    const ccpPath = util.getNetworkConfigFilePath(orgName);
    const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
    const ccp = JSON.parse(ccpJSON);

    // get orgs and CAs fields from connection profile
    const orgs = ccp.organizations;
    const CAs = ccp.certificateAuthorities;

    if (!orgs[orgName]) {
      logger.debug(`Invalid org name: ${orgName}`);
      throw new Error(`Invalid org name: ${orgName}`);
    }

    // get certificate authority for orgName
    const fabricCAKey = orgs[orgName].certificateAuthorities[0];
    const caURL = CAs[fabricCAKey].url;

    // enroll user with certificate authority for orgName
    const tlsOptions = {
      trustedRoots: [],
      verify: false,
    };
    const caService = new FabricCAServices(caURL, tlsOptions);
    const req = {
      enrollmentID: enrollId,
      enrollmentSecret: enrollSecret,
    };
    caService.enroll(req).then(
      (enrollment) => {
        enrollment.key = enrollment.key.toBytes();
        return resolve(enrollment);
      },
      (err) => {
        logger.debug(err);
        return reject(err);
      },
    );
  }));
};

module.exports = util;

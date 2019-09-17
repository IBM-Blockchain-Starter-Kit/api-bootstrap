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
import * as FabricCAServices from 'fabric-ca-client';
import * as fs from 'fs';
import { getLogger } from 'log4js';

/**
 * Set up logging
 */
const logger = getLogger('helpers - util');
logger.level = config.get('logLevel');

export const ccpPath = `${__dirname}/../config/fabric-connection-profile.json`;

/**
 * Send http response helper
 * res: express response object
 * msg: {statusCode (int), success (bool), message (string), et
 */
export const sendResponse = (res, msg) => {
  logger.debug('entering >>> sendResponse()');
  const response = msg;
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = response.statusCode;
  delete response.statusCode;
  res.json(response);
};

/**
 * Enroll given user with given org Fabric CA
 */
export const userEnroll = (orgName, enrollId, enrollSecret) => {
  logger.debug('entering >>> userEnroll()');
  logger.debug(`Enrolling user ${enrollId}`);
  return new Promise(((resolve, reject) => {
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

    // get mspid for orgName
    const { mspid } = orgs[orgName];

    // enroll user with certificate authority for orgName
    const tlsOptions: FabricCAServices.TLSOptions = {
      trustedRoots: Buffer.from(''),
      verify: false,
    };
    const caService = new FabricCAServices(caURL, tlsOptions);
    const req = {
      enrollmentID: enrollId,
      enrollmentSecret: enrollSecret,
    };
    caService.enroll(req).then(
      (enrollment) => {
        let enrollmentModified;
        // eslint-disable-next-line prefer-const
        enrollmentModified = enrollment;
        enrollmentModified.key = enrollment.key.toBytes();
        enrollmentModified.mspid = mspid;
        return resolve(enrollmentModified);
      },
      (err) => {
        logger.debug(err);
        return reject(err);
      },
    );
  }));
};

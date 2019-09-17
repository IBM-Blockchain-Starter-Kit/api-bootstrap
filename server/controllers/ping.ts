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
import { getLogger } from 'log4js';

import * as util from '../helpers/util';

const logger = getLogger('controllers - ping');
logger.level = config.get('logLevel');

const pingCC = async (req, res) => {
  logger.debug('entering >>> pingCC()');

  let jsonRes;
  try {
    // More info on the following calls: https://fabric-sdk-node.github.io/Contract.html

    // get contract instance retrieved in fabric-routes middleware
    const contract = res.locals.defaultchannel.pingcc;

    // invoke transaction
    // Create transaction proposal for endorsement and sendTransaction to orderer
    const invokeResponse = await contract.submitTransaction('Health');

    // query
    // simply query the ledger
    // const queryResponse = await contract.evaluateTransaction('Health');

    jsonRes = {
      result: invokeResponse.toString(),
      statusCode: 200,
      success: true,
    };
  } catch (err) {
    jsonRes = {
      message: `${err.message}`,
      statusCode: 500,
      success: false,
    };
  }

  logger.debug('exiting <<< pingCC()');
  util.sendResponse(res, jsonRes);
};

export { pingCC as default };

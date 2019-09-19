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
import { FileSystemWallet, X509WalletMixin } from 'fabric-network';
import { getLogger } from 'log4js';

import { CertificateManagerWallet } from '@blockchainlabs/ibm-certificate-manager-wallet';
import * as IBMCloudEnv from 'ibm-cloud-env';

IBMCloudEnv.init('/server/config/mappings.json');
const certManagerCredentials = IBMCloudEnv.getDictionary('cert-manager-credentials');
console.log(certManagerCredentials);

let fsWallet;

if (config.get('cmWalletEnabled')) {
  fsWallet = new CertificateManagerWallet(certManagerCredentials);
} else {
  fsWallet = new FileSystemWallet(config.get('fsWalletPath'));
}

/**
 * Set up logging
 */
const logger = getLogger('helpers - wallet');
logger.level = config.get('logLevel');

/**
 * Return FileSystemWallet object
 */
export const getWallet = () => {
  logger.debug('entering >>> getWallet()');
  return fsWallet;
};

/**
 *
 * @param {string} id - label of id in wallet
 */
export const identityExists = async (id) => {
  logger.debug('entering >>> identityExists()');
  const exists = await fsWallet.exists(id);
  logger.debug(`${id} exists in wallet: ${exists}`);
  return exists;
};

/**
 *
 * @param {string} id - label of id importing into wallet
 * @param {string} org - org that id belongs to
 * @param {string} cert - cert from enrolling user
 * @param {string} key - key from enrolling user
 */
export const importIdentity = async (id, org, cert, key) => {
  logger.debug('entering >>> importIdentity()');
  try {
    logger.debug(`Importing ${id} into wallet`);
    await fsWallet.import(id, X509WalletMixin.createIdentity(org, cert, key));
  } catch (err) {
    logger.debug(`Error importing ${id} into wallet: ${err}`);
    throw new Error(err);
  }
};

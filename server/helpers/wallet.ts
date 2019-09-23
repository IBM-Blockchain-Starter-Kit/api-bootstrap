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
import * as IBMCloudEnv from 'ibm-cloud-env';
import { getLogger } from 'log4js';
// tslint:disable-next-line: no-var-requires
const CertificateManagerWallet = require('@blockchainlabs/ibm-certificate-manager-wallet');

IBMCloudEnv.init('/server/config/mappings.json');
const certManagerCredentials = IBMCloudEnv.getDictionary('cert-manager-credentials');

const CERTIFICATE_MANAGER_WALLET = 'CertificateManagerWallet';
const FILESYSTEM_WALLET = 'FileSystemWallet';

let wallet;

/**
 * Set up logging
 */
const logger = getLogger('helpers - wallet');
logger.level = config.get('logLevel');

/**
 * @param {string} walletType - 'CertificateManagerWallet' | 'FileSystemWallet'
 * Return Wallet object
 */
export const initWallet = (walletType) => {
  logger.debug('entering >>> initWallet()');
  // check if correct wallet type in config
  const supportedWallets: string[] = config.get('supportedWallets');
  if (!(supportedWallets.includes(walletType))) {
    throw new Error ('Incorrect activeWallet in config');
  }
  // initialize based on wallet type
  if (walletType === FILESYSTEM_WALLET) {
    wallet = new FileSystemWallet(config.get('fsWalletPath'));
  }
  if (walletType === CERTIFICATE_MANAGER_WALLET) {
    wallet = new CertificateManagerWallet(certManagerCredentials);
  }
  logger.debug('exiting <<< initWallet()');
};

/**
 * Return Wallet object
 */
export const getWallet = () => {
  logger.debug('entering >>> getWallet()');
  return wallet;
};

/**
 *
 * @param {string} id - label of id in wallet
 */
export const identityExists = async (id) => {
  logger.debug('entering >>> identityExists()');
  const exists = await wallet.exists(id);
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
    await wallet.import(id, X509WalletMixin.createIdentity(org, cert, key));
  } catch (err) {
    logger.debug(`Error importing ${id} into wallet: ${err}`);
    throw new Error(err);
  }
};

/**
 *
 * @param {string} id - label of id deleting from wallet
 */
export const deleteIdentity = async (id) => {
  logger.debug('entering >>> deleteIdentity()');
  try {
    logger.debug(`Deleting ${id} into wallet`);
    await wallet.delete(id);
  } catch (err) {
    logger.debug(`Error deleting ${id} from wallet: ${err}`);
    throw new Error(err);
  }
};

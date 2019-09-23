/**
 * Copyright 2019 IBM All Rights Reserved.
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
import { FileSystemWallet } from 'fabric-network';
import * as fs from 'fs';
import * as rimraf from 'rimraf';

// tslint:disable-next-line: no-var-requires
const CertificateManagerWallet = require('@blockchainlabs/ibm-certificate-manager-wallet');
import * as walletHelper from '../../server/helpers/wallet';

const cert = fs.readFileSync(`${__dirname}/../mocks/testuser1.pem`, 'utf8');
const key = fs.readFileSync(`${__dirname}/../mocks/testuser1.key`, 'utf8');

const FILESYSTEM_WALLET = 'FileSystemWallet';
const CERTIFICATE_MANAGER_WALLET = 'CertificateManagerWallet';

describe('helpers - wallet', () => {

    beforeAll(async () => {
        // check if correct wallet type in config
        const supportedWallets: string[] = config.get('supportedWallets');
        if (!(supportedWallets.includes(config.get('activeWallet')))) {
            throw new Error ('Incorrect activeWallet in config');
        }

        // delete test wallet before starting for file system wallet
        if (config.get('activeWallet') === FILESYSTEM_WALLET) {
            rimraf.sync(config.get('fsWalletPath'));
        }
    });
    afterAll(async () => {
        // delete test wallet after tests for file system wallet
        if (config.get('activeWallet') === FILESYSTEM_WALLET) {
            rimraf.sync(config.get('fsWalletPath'));
        }

        // delete test user after tests for certifacte manager wallet
        if (config.get('activeWallet') === CERTIFICATE_MANAGER_WALLET) {
            if (await walletHelper.identityExists('testuser1')) {
                await walletHelper.deleteIdentity('testuser1');
            }
        }
    });

    let wallet;

    beforeEach(() => {
        walletHelper.initWallet(config.get('activeWallet'));
        wallet = walletHelper.getWallet();
    });

    describe('#initWallet', () => {
        test('should fail for incorrect type of wallet', () => {
            expect(() => {
                walletHelper.initWallet('IncorrectWalletType');
            }).toThrow(new Error('Incorrect activeWallet in config'));
        });
    });

    describe('#getWallet', () => {
        test('should get correct type of wallet', () => {
            if (config.get('activeWallet') === FILESYSTEM_WALLET) {
                expect(wallet).toBeInstanceOf(FileSystemWallet);
            }
            if (config.get('activeWallet') === CERTIFICATE_MANAGER_WALLET) {
                expect(wallet).toBeInstanceOf(CertificateManagerWallet);
            }
        });
    });

    describe('#importIdentity', () => {
        test('should handle wallet import error - invalid cert and key', async () => {
            return expect(walletHelper.importIdentity('testuser1', 'org1', 'cert', 'key')).rejects.toThrow(Error);
        });

        test('should import identity successfully', async () => {
            expect(await walletHelper.importIdentity('testuser1', 'org1', cert, key));
        });
    });

    describe('#identityExists', () => {
        test('should return true if identity exists in wallet', async () => {
            const result = await walletHelper.identityExists('testuser1');
            expect(result).toBe(true);
        });

        test('should return false if identity does not exist in wallet', async () => {
            const result = await walletHelper.identityExists('testuser2');
            expect(result).toBe(false);
        });
    });

    describe('#deleteIdentity', () => {
        test('should handle error during delete', async () => {
            // let wallet;
            (wallet.delete) = jest.fn(() => {
                return Promise.reject(new Error('error deleting identity'));
            });
            try {
                await walletHelper.deleteIdentity('testuser1');
            } catch (e) {
                expect(e.message).toMatch('error deleting identity');
            }
        });

        test('should delete identity properly', async () => {
            expect(await walletHelper.importIdentity('testuser2', 'org1', cert, key));
            const result = await walletHelper.identityExists('testuser2');
            expect(result).toBe(true);
            await walletHelper.deleteIdentity('testuser2');
            const resultFalse = await walletHelper.identityExists('testuser2');
            expect(resultFalse).toBe(false);
        });
    });
});

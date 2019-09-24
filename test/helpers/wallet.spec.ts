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

import * as walletHelper from '../../server/helpers/wallet';

// tslint:disable-next-line: no-var-requires
const CertificateManagerWallet = require('@blockchainlabs/ibm-certificate-manager-wallet');
jest.mock('@blockchainlabs/ibm-certificate-manager-wallet');
import * as IBMCloudEnv from 'ibm-cloud-env';
jest.mock('ibm-cloud-env');
import { FileSystemWallet } from 'fabric-network';
jest.mock('fabric-network');

describe('helpers - wallet', () => {

    let wallet;

    describe('#initWallet', () => {
        test('should fail for incorrect type of wallet', () => {
            expect(() => {
                walletHelper.initWallet('IncorrectWalletType');
            }).toThrow(new Error('Incorrect activeWallet in config'));
        });
    });

    describe('#getWallet', () => {
        test('should get wallet type of FileSystemWallet', () => {
            walletHelper.initWallet('FileSystemWallet');
            wallet = walletHelper.getWallet();
            expect(wallet).toBeInstanceOf(FileSystemWallet);
        });

        test('should get wallet type of CertificateManagerWallet', () => {
            (IBMCloudEnv.init as any) = jest.fn(() => true);
            (IBMCloudEnv.getDictionary as any) = jest.fn(() => true);
            walletHelper.initWallet('CertificateManagerWallet');
            wallet = walletHelper.getWallet();
            expect(wallet).toBeInstanceOf(CertificateManagerWallet);
        });
    });

    describe('wallet features', () => {

        beforeEach(() => {
            wallet = walletHelper.getWallet();
        });

        describe('#importIdentity', () => {

            test('should handle wallet import error - invalid cert and key', async () => {
                wallet.import = jest.fn().mockImplementation(async () => {
                    return Promise.reject(new Error('error with import'));
                });
                try {
                    await walletHelper.importIdentity('testuser', 'org1', 'cert', 'key');
                } catch (e) {
                    expect(e.message).toMatch('error with import');
                }
            });

            test('should import identity successfully', async () => {
                wallet.import = jest.fn().mockImplementation(async () => {
                    return('success');
                });
                await walletHelper.importIdentity('testuser', 'org1', 'cert', 'key');
                expect(wallet.import.mock.calls.length).toBe(1);
            });
        });

        describe('#identityExists', () => {
            test('should return true if identity exists in wallet', async () => {
                wallet.exists = jest.fn().mockImplementation(async () => {
                    return(true);
                });
                const result = await walletHelper.identityExists('testuser');
                expect(result).toBe(true);
            });

            test('should return false if identity does not exist in wallet', async () => {
                wallet.exists = jest.fn().mockImplementation(async () => {
                    return(false);
                });
                const result = await walletHelper.identityExists('testuser');
                expect(result).toBe(false);
            });

        });

        describe('#deleteIdentity', () => {
            test('should handle error during delete', async () => {
                wallet.delete = jest.fn().mockImplementation(async () => {
                    return Promise.reject(new Error('error deleting identity'));
                });
                try {
                    await walletHelper.deleteIdentity('testuser');
                } catch (e) {
                    expect(e.message).toMatch('error deleting identity');
                }
            });

            test('should delete identity properly', async () => {
                wallet.delete = jest.fn().mockImplementation(async () => {
                    return('success');
                });
                await walletHelper.deleteIdentity('testuser');
                expect(wallet.delete.mock.calls.length).toBe(1);
            });
        });
    });
});

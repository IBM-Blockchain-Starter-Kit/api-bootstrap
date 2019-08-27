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

import * as walletHelper from '../../server/helpers/wallet';

const cert = fs.readFileSync(`${__dirname}/../mocks/cert`, 'utf8');
const key = fs.readFileSync(`${__dirname}/../mocks/key`, 'utf8');

describe('helpers - wallet', () => {
    beforeAll(() => {
        // delete test wallet before starting
        rimraf.sync(config.get('fsWalletPath'));
    });
    afterAll(() => {
        // delete test wallet after tests
        rimraf.sync(config.get('fsWalletPath'));
    });

    let wallet;

    beforeEach(() => {
        wallet = walletHelper.getWallet();
    });

    describe('#getWallet', () => {
        test('should get wallet of type FileSystemWallet', () => {
            expect(wallet).toBeInstanceOf(FileSystemWallet);
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
});

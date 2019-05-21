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

const sinon = require('sinon');
const chai = require('chai');
const fs = require('fs');
const chaiAsPromised = require('chai-as-promised');
const { FileSystemWallet } = require('fabric-network');
const config = require('config');
const rimraf = require('rimraf');

const walletHelper = require('../../server/helpers/wallet');

const { expect } = chai;
const should = chai.should();
chai.use(chaiAsPromised);

const cert = fs.readFileSync(`${__dirname}/../mocks/cert`, 'utf8');
const key = fs.readFileSync(`${__dirname}/../mocks/key`, 'utf8');

describe('helpers - wallet', () => {
  before(() => {
    // delete test wallet before starting
    rimraf.sync(config.fsWalletPath);
  });
  after(() => {
    // delete test wallet after tests
    rimraf.sync(config.fsWalletPath);
  });

  let wallet;
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    wallet = walletHelper.getWallet();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('#getWallet', () => {
    it('should get wallet of type FileSystemWallet', () => {
      wallet.should.be.an.instanceof(FileSystemWallet);
    });
  });

  describe('#importIdentity', () => {
    it('should handle wallet import error - invalid cert and key', async () => {
      return walletHelper.importIdentity('testuser1', 'org1', 'cert', 'key').should.be.rejectedWith(Error);
    });

    it('should import identity successfully', async () => {
      await walletHelper.importIdentity('testuser1', 'org1', cert, key).should.be.fulfilled;
    });
  });

  describe('#identityExists', () => {
    it('should return true if identity exists in wallet', async () => {
      const result = await walletHelper.identityExists('testuser1');
      expect(result).to.be.equal(true);
    });

    it('should return false if identity does not exist in wallet', async () => {
      const result = await walletHelper.identityExists('testuser2');
      expect(result).to.be.equal(false);
    });
  });
});

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

// tslint:disable-next-line
Promise = require('bluebird');
import * as FabricCAServices from 'fabric-ca-client';
import ECDSA_KEY from 'fabric-client/lib/impl/ecdsa/key';
import * as path from 'path';
import * as util from '../../server/helpers/util';

describe('helpers - util', () => {

  describe('#sendResponse', () => {
    const res = {
      setHeader: (name, value) => {},
      json: (response) => {},
    };
    const msg = {
      result: 'success',
      statusCode: 200,
      success: true,
    };
    it('should parse message and send appropriate response', () => {
      const resSpy = jest.spyOn(util, 'sendResponse');
      util.sendResponse(res, msg);
      expect(resSpy).toHaveBeenCalledWith(res, msg);

    });
  });

  describe('#userEnroll', () => {
  test('should fail to enroll with invalid org name', async () => {
      return expect(util.userEnroll('invalidorg', 'app1', 'app1pw')).rejects.toThrow(Error);
    });

  test('should throw error when fabric ca enroll fails', async () => {
      jest.fn(FabricCAServices.prototype.enroll).mockImplementation(() => Promise.reject(new Error ('error from fabric ca'))); // mock call to FabricCA)
      return expect(util.userEnroll('org1', 'app1', 'app1pw')).rejects.toThrow(Error);
    });

  test('should successfully enroll user and return credentials', async () => {
      const keyStub: any = jest.fn(ECDSA_KEY);
      jest.fn(FabricCAServices.prototype.enroll).mockImplementation(() => Promise.resolve({certificate: 'cert', key: keyStub, rootCertificate: 'rCert'})); // mock out call to FabricCA

      let ccpPath: string = '';
      Object.defineProperty(util, 'ccpPath', { get: () => ccpPath });
      ccpPath = path.join(`${__dirname}`, '/../mocks/config/fabric-connection-profile.json');
      const response: any = await util.userEnroll('org1', 'app1', 'app1pw');

      expect(response.certificate).toBe('cert');
    });
  });
});

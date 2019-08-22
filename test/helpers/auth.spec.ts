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
import * as jwt from 'jsonwebtoken';
import * as auth from '../../server/helpers/auth';

describe('helpers - auth', () => {
  let next;
  let res;
  let req: { headers: { authorization: string; } | { authorization: string; } | { authorization: string; } | { authorization: string; } | {} | { authorization: string; }; };
  let token: string;
  let whitelist: string[];

  describe('#filter', () => {
    test('should fail if client is not in whitelist', () => {
      whitelist = ['client1'];
      token = jwt.sign({ aud: 'client2' }, 'secret');
      req = { headers: { authorization: `Bearer ${token}` } };
      res = {
        json: (response) => {}
      };

      const filterSpy = jest.spyOn(auth, 'filter');
      auth.filter(whitelist)(req, res, next);

      expect(filterSpy).toBeCalledWith(whitelist);
      expect(Promise.resolve(res.json)).resolves.toBe({error: 'invalid_grant', message: 'This token does not have the appropriate access rights (aud)'});
    });

    test('should find client (array) in whitelist and call next middleware', () => {
      whitelist = ['client1'];
      token = jwt.sign({ aud: ['client1'] }, 'secret');
      req = { headers: { authorization: `Bearer ${token}` } };
      next = jest.fn();

      auth.filter(whitelist)(req, res, next);

      expect(next).toBeCalled();
    });

    it('should find client (string) in whitelist and call next middleware', () => {
      whitelist = ['client1'];
      token = jwt.sign({ aud: 'client1' }, 'secret');
      req = { headers: { authorization: `Bearer ${token}` } };
      next = jest.fn();

      auth.filter(whitelist)(req, res, next);

      expect(next).toBeCalled();
    });
  });

  describe('#getAccessToken', () => {
    test('should fail with malformed auth header', () => {
      token = jwt.sign({ aud: 'client1' }, 'secret');
      req = { headers: { authorization: `${token}` } };
      next = jest.fn();

      const spyGetAccessToken = jest.spyOn(auth, 'getAccessToken');
      auth.getAccessToken(req, next);
      expect(next).toBeCalled();
      expect(spyGetAccessToken).toThrowError(Error);
    });

    test('should fail with no auth header', () => {
      req = { headers: { } };
      next = jest.fn();

      const spyGetAccessToken = jest.spyOn(auth, 'getAccessToken');
      auth.getAccessToken(req, next);
      expect(next).toBeCalled();
      expect(spyGetAccessToken).toThrowError(Error);
    });

    test('should get token successfully', () => {
      token = jwt.sign({ aud: 'client1' }, 'secret');
      req = { headers: { authorization: `Bearer ${token}` } };

      const accessToken = auth.getAccessToken(req, next);
      expect(accessToken).toBe(token);
    });
  });
});

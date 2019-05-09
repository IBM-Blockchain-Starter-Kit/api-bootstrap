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

const Promise = require('bluebird');
const sinon = require('sinon');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const jwt = require('jsonwebtoken');

const auth = require('../../server/helpers/auth');

const { expect } = chai;
const should = chai.should();
chai.use(chaiAsPromised);

describe('helpers - auth', () => {
  let sandbox, next, res, req, token, whitelist;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    next = sandbox.spy();
    res = sandbox.spy();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('#filter', () => {
    it('should fail if client is not in whitelist', () => {
      whitelist = ['client1'];
      token = jwt.sign({ aud: 'client2' }, 'secret');
      req = { headers: { authorization: `Bearer ${token}` } };
      res = {
        json: (response) => {}
      };

      sandbox.stub(res);
      auth.filter(whitelist)(req, res, next);

      sinon.assert.calledWith(res.json, {error: 'invalid_grant', message: 'This token does not have the appropriate access rights (aud)'});
    });

    it('should find client (array) in whitelist and call next middleware', () => {
      whitelist = ['client1'];
      token = jwt.sign({ aud: ['client1'] }, 'secret');
      req = { headers: { authorization: `Bearer ${token}` } };

      auth.filter(whitelist)(req, res, next);

      expect(next.calledWithExactly()).to.equal(true);
    });

    it('should find client (string) in whitelist and call next middleware', () => {
      whitelist = ['client1'];
      token = jwt.sign({ aud: 'client1' }, 'secret');
      req = { headers: { authorization: `Bearer ${token}` } };

      auth.filter(whitelist)(req, res, next);

      expect(next.calledWithExactly()).to.equal(true);
    });
  });

  describe('#getAccessToken', () => {
    it('should fail with malformed auth header', () => {
      token = jwt.sign({ aud: 'client1' }, 'secret');
      req = { headers: { authorization: `${token}` } };

      auth.getAccessToken(req, next);
      expect(next.calledOnce).to.equal(true);
      sinon.assert.calledWith(next, sinon.match.instanceOf(Error));
    });

    it('should fail with no auth header', () => {
      req = { headers: { } };

      auth.getAccessToken(req, next);
      expect(next.calledOnce).to.equal(true);
      sinon.assert.calledWith(next, sinon.match.instanceOf(Error));
    });

    it('should get token successfully', () => {
      token = jwt.sign({ aud: 'client1' }, 'secret');
      req = { headers: { authorization: `Bearer ${token}` } };

      const accessToken = auth.getAccessToken(req, next);
      expect(accessToken).to.equal(token);
    });
  });
});

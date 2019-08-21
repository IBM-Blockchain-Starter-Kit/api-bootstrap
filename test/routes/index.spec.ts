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
const rewire = require('rewire');
const express = require('express');
const request = require('supertest');

const setUpRoutes = rewire('../../server/routes/index');

const expect = chai.expect;
const should = chai.should();
chai.use(chaiAsPromised);

// mock out calls to FabricRoutes
const FabricRoutes = setUpRoutes.__get__('FabricRoutes');

describe('routes - index', () => {

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('setupRoutes', () => {
    it('should set up routes successfully', async() => {
      sandbox.stub(FabricRoutes.prototype, 'setup').returns(Promise.resolve());
      const router = await setUpRoutes();
      expect(Object.getPrototypeOf(router) === express.Router).to.equal(true);

      // test actual router with supertest server
      const app = express();
      app.use(router);
      await request(app)
        .get('/')
        .expect(302); //test redirect route
    });

    it('should fail to setup routes', async() => {
      sandbox.stub(FabricRoutes.prototype, 'setup').returns(Promise.reject(new Error('error setting up routes')));
      return setUpRoutes().should.be.rejectedWith(Error);
    });
  });
});

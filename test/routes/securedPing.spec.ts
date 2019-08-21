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

const express = require('express');
const request = require('supertest');
const proxyquire = require('proxyquire').noPreserveCache();

describe('routes - securedPing', () => {

  // mock route handler since it requires a call out to blockchain network
  const FakeSecuredCtrl = {
    getSecured: (req, res) => {
      res.statusCode = 200;
      res.json({success: true, result: 'Success'});
    }
  };

  const securedPing = proxyquire('../../server/routes/securedPing', {
    '../controllers/securedPing': FakeSecuredCtrl
  });

  it('should add securedPing route successfully', async() => {
    // test actual router with supertest server
    const app = express();
    app.use(securedPing);
    await request(app)
      .get('/')
      .expect(200, {success: true, result: 'Success'});
  });
});

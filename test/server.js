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
const chaiHttp = require('chai-http');
const proxyquire = require('proxyquire').noPreserveCache();
const express = require('express');
const config = require('config');

const host = process.env.HOST || config.host;
const port = process.env.PORT || config.port;
const url = `http://${host}:${port}`;

const expect = chai.expect;
chai.use(chaiHttp);

// set up fake router to return for setupRoutes()
const router = express.Router();
router.get('/', (req, res) => {
  res.redirect('/api-docs');
});

describe('server start up', () => {

  describe('startup fail', () => {
    it('should gracefully handle error', () => {
      const server = proxyquire('../server/server', {
        './routes/index': sinon.stub().returns(Promise.reject(new Error('failed to set up routes')))
      });
    });
  });

  describe('startup success', () => {
    const server = proxyquire('../server/server', {
      './routes/index': sinon.stub().returns(Promise.resolve(router))
    });

    describe('/doesnotexist', () => {
      it('should return 404', async () => {
        const res = await chai.request(url).get('/doesnotexist');
        expect(res.status).to.equal(404);
        expect(res.body).to.be.a('object');
        expect(res.body.success).to.equal(false);
      });
    });
  
    describe('/', () => {
      it('should redirect to /api-docs', async () => {
        const res = await chai.request(url).get('/');
        expect(res).to.redirectTo(`${url}/api-docs`);
        expect(res.status).to.equal(200);
      });
    });
  });
});

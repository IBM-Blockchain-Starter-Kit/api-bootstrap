/**
 * Copyright 2018 IBM Corp. All Rights Reserved.
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

const log4js = require('log4js');
const config = require('config');
const { Gateway } = require('fabric-network');
const passport = require('passport');
const { APIStrategy } = require('ibmcloud-appid');

const util = require('../helpers/util');
const walletHelper = require('../helpers/wallet');

const ccp = require(`${__dirname}/../config/fabric-connection-profile.json`); // common connection profile
const fabricConfig = require(`${__dirname}/../config/fabric-connections.json`); // fabric connections configuration

const auth = require('../middlewares/auth'); // whitelist of clientId's


/**
 * Set up logging
 */
const logger = log4js.getLogger('middlewares - fabric-routes');
logger.setLevel(config.logLevel);

/**
 * Load the exported router at the path given
 */
function loadRouter(routerPath) {
  return require(`${__basedir}/${routerPath}`);
}

/**
 * FabricRoutes class that handles creating routes that need to connect to the
 * fabric network. Parses the fabric-connections.json file to create the routes
 * with the appropriate middleware to connect to the fabric network and get access
 * to the specified channels and smart contracts - removing the logic from the route
 * controllers.
 */
class FabricRoutes {
  /**
   * @param {*} router: Router object to add the routes to
   */
  constructor(router) {
    this.router = router;
    this.middlewares = {};
  }

  /**
   * After creating the middlewares, it will create the routes with the
   * connection middleware, the existing router with controllers and other midddlwares,
   * and the disconnect middleware
   */
  setup() {
    logger.debug('entering >>> setup()');

    // parse json file and create middleware functions
    this.createMiddlewares();

    // iterate through routes and set corresponding fabric-connection specified
    logger.debug('Mounting middleware functions to routes');
    fabricConfig.routes.forEach((route) => {
      logger.debug(`${route.path}: ${route['fabric-connection']} => route controller => disconnect`);


      // if route is protected, add authentication middleware to each protected method
      if (route.protected && route.protected.enabled) {
        logger.debug(`${route.path}: ${route.protected.methods} => add auth`);
        route.protected.methods.forEach((method) => {
          // Add protected route
          // pass a 'whitelist' array of clientIds read from config
          this.router[method](route.path,
            passport.authenticate(APIStrategy.STRATEGY_NAME, { session: false }),
            auth.filter(route.protected.whitelist));
        });
      }

      this.router.use(route.path,
        this.middlewares[route['fabric-connection']],
        loadRouter(route.modulePath),
        this.middlewares.disconnect);
    });

    logger.debug('exiting <<< setup()');
  }

  /**
   * Parse fabric-connections json file to create the middleware function for each
   * fabric-connection. Each fabric connection will be a middleware function where
   * a fabric-network gateway instance is created. The gateway instance is connected
   * and all of the channels and chaincodes specified in this fabric connection are
   * retrieved and stored in a map for use in the route controllers.
   *
   * Add the gateway instance disconnect middleware.
   */
  createMiddlewares() {
    logger.debug('entering >>> createMiddlewares()');

    // iterate through connections in config file and create middleware function for each
    logger.debug('Creating fabric connection middleware functions');
    const connections = fabricConfig['fabric-connections'];
    Object.entries(connections).forEach(([conn, networkConfigs]) => {
      logger.debug(`Creating ${conn} middleware`);
      // create the middleware function to be mounted
      this.middlewares[conn] = async (req, res, next) => {
        logger.debug(`${conn} middleware function to connect to gateway`);
        const org = config.orgName;
        const user = process.env.FABRIC_ENROLL_ID;
        const pw = process.env.FABRIC_ENROLL_SECRET;
        const gateway = new Gateway();

        try {
          // user enroll and import if identity not found in wallet
          const idExists = await walletHelper.identityExists(user);
          if (!idExists) {
            logger.debug(`Enrolling and importing ${user} into wallet`);
            const enrollInfo = await util.userEnroll(org, user, pw);
            await walletHelper.importIdentity(user, org, enrollInfo.certificate, enrollInfo.key);
          }

          // gateway and contract connection
          logger.debug('Connecting to gateway');
          await gateway.connect(ccp, {
            identity: user,
            wallet: walletHelper.getWallet(),
            discovery: { // https://fabric-sdk-node.github.io/release-1.4/module-fabric-network.Gateway.html#~DiscoveryOptions
              enabled: connections.serviceDiscovery.enabled,
              asLocalhost: connections.serviceDiscovery.asLocalhost,
            },
          });
          logger.debug('Connected to gateway');

          // store gateway in res.locals for use in next function on the stack
          // see: https://stackoverflow.com/questions/18875292/passing-variables-to-the-next-middleware-using-next-in-express-js
          res.locals.gateway = gateway;

          // get each specified channel/network instance in connection and store in res.locals
          await Promise.all(networkConfigs.map(async (networkConfig) => {
            logger.debug(`Getting network: ${networkConfig.channel}`);
            res.locals[networkConfig.channel] = {};
            const network = await gateway.getNetwork(networkConfig.channel);
            res.locals[networkConfig.channel].network = network;

            // get each specified chaincode/contract instance in channel and store in res.locals
            await Promise.all(networkConfig.chaincodes.map(async (chaincode) => {
              logger.debug(`Getting contract: ${chaincode}`);
              const contract = await network.getContract(chaincode);
              res.locals[networkConfig.channel][chaincode] = contract;
            }));
          }));

          next();
        } catch (err) {
          logger.error(err.message);
          gateway.disconnect();
          const jsonRes = {
            statusCode: 500,
            success: false,
            message: `${err.message}`,
          };
          util.sendResponse(res, jsonRes);
        }
      };
      logger.debug(`Done creating ${conn} middleware`);
    });
    logger.debug('Done creating fabric connection middleware functions');

    // the gateway disconnect middleware
    logger.debug('Creating fabric disconnect middleware function');
    this.middlewares.disconnect = (req, res) => {
      logger.debug('Disconnecting from gateway');
      res.locals.gateway.disconnect();
      logger.debug('Disconnected from gateway');
    };
    logger.debug('Done creating fabric disconnect middleware function');

    logger.debug('exiting <<< createMiddlewares()');
  }
}

module.exports.FabricRoutes = FabricRoutes;

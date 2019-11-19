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

import * as config from 'config';
import { Gateway } from 'fabric-network';
import { APIStrategy } from 'ibmcloud-appid';
import { getLogger } from 'log4js';
import * as passport from 'passport';

// eslint-disable-next-line no-unused-vars
import { Router } from 'express';
import * as auth from '../helpers/auth';
import * as util from '../helpers/util';
import * as walletHelper from '../helpers/wallet';

import * as ccp from '../config/fabric-connection-profile.json'; // common connection profile;
import * as fabricConfig from '../config/fabric-connections.json'; // fabric connections configuration

import * as IBMCloudEnv from 'ibm-cloud-env';

/**
 * Set up logging
 */
const logger = getLogger('middlewares - fabric-routes');
logger.level = config.get('logLevel');

/**
 * FabricRoutes class that handles creating routes that need to connect to the
 * fabric network. Parses the fabric-connections.json file to create the routes
 * with the appropriate middleware to connect to the fabric network and get access
 * to the specified channels and smart contracts - removing the logic from the route
 * controllers.
 */
export default class FabricRoutes {
  /**
   * @param {*} router: Router object to add the routes to
   * @param {*} gateway: Hyperledger class
   * @param {*} middlewares: Middlewares object
   */
  public middlewares: object;

  public gateway: Gateway;

  public router: Router;

  constructor(router: Router) {
    this.router = router;
    this.middlewares = {};
    this.gateway = new Gateway();
  }

  /**
   * Connect the gateway instance. After creating the middlewares, it will create the routes with
   * the connection middleware and the existing router with controllers and other midddlwares
   */
  public async setup(): Promise<void> {
    logger.debug('entering >>> setup()');

    // create and connect gateway
    await this.setupGateway();

    // parse json file and create middleware functions
    this.createMiddlewares();

    // iterate through routes and set corresponding fabric connection specified
    logger.debug('Mounting middleware functions to routes');
    const configPromises: Array<Promise<void>> = [];
    fabricConfig.routes.forEach((route) => {
      logger.debug(`${route.path}: ${route.fabricConnection} => route controller`);

      // If route is protected, add authentication middleware to each protected method
      if (route.protected && route.protected.enabled) {
        logger.debug(`${route.path} => add auth`);
        passport.use(new APIStrategy({ oauthServerUrl: config.get('appid.oauthServerUrl') })); // to change passport strategy, modify this line
        // Add protected route
        // pass a 'allowedClients' array of clientIds read from config
        this.router.use(route.path,
          passport.authenticate(APIStrategy.STRATEGY_NAME, { session: false }),
          auth.filter(route.protected.allowedClients));
      }

      configPromises.push((async (): Promise<void> => {
        // Load the router for module at the path given
        const moduleRouter: Router = await import(`${__dirname}/../${route.modulePath}`);
        // Configure overall router
        this.router.use(route.path, this.middlewares[route.fabricConnection], moduleRouter);
      })());
    });

    // Wait until all configuration promises are resolved
    await Promise.all(configPromises);

    logger.debug('exiting <<< setup()');
  }

  /**
   * Connect the gateway instance
   */
  public async setupGateway(): Promise<void> {
    logger.debug('entering >>> setupGateway()');

    try {
      const org: string = config.get('orgName');
      IBMCloudEnv.init('/server/config/mappings.json');
      const user: string = IBMCloudEnv.getString('fabric-enroll-id');
      const pw: string = IBMCloudEnv.getString('fabric-enroll-secret');
      const { serviceDiscovery } = fabricConfig;

      // initialize the wallet
      walletHelper.initWallet(config.get('activeWallet'));

      // user enroll and import if identity not found in wallet
      const idExists = await walletHelper.identityExists(user);
      if (!idExists) {
        logger.debug(`Enrolling and importing ${user} into wallet`);
        const enrollInfo: any = await util.userEnroll(org, user, pw);
        await walletHelper.importIdentity(user, enrollInfo.mspid,
          enrollInfo.certificate, enrollInfo.key);
      }

      // gateway and contract connection
      logger.debug('Connecting to gateway');
      await this.gateway.connect(ccp, {
        discovery: { // https://fabric-sdk-node.github.io/release-1.4/module-fabric-network.Gateway.html#~DiscoveryOptions
          asLocalhost: serviceDiscovery.asLocalhost,
          enabled: serviceDiscovery.enabled,
        },
        identity: user,
        wallet: walletHelper.getWallet(),
      });
      logger.debug('Connected to gateway');
    } catch (err) {
      logger.error(err.message);
      throw new Error(err.message);
    }

    logger.debug('exiting <<< setupGateway()');
  }

  /**
   * Parse fabric-connections json file to create the middleware function for each
   * fabric connection. Each fabric connection will be a middleware function where
   * the gateway and all of the channels and chaincodes specified in this fabric
   * connection are retrieved and stored in a map for use in the route controllers.
   */
  public createMiddlewares(): void {
    logger.debug('entering >>> createMiddlewares()');

    // iterate through connections in config file and create middleware function for each
    logger.debug('Creating fabric connection middleware functions');
    const connections = fabricConfig.fabricConnections;
    Object.entries(connections).forEach(([conn, networkConfigs]) => {
      logger.debug(`Creating ${conn} middleware`);
      const configs: any = networkConfigs;
      // create the middleware function to be mounted
      this.middlewares[conn] = async (req, res, next) => {
        logger.debug(`${conn} middleware function to connect to gateway`);
        try {
          // store gateway in res.locals for use in next function on the stack
          // see: https://stackoverflow.com/questions/18875292/passing-variables-to-the-next-middleware-using-next-in-express-js
          res.locals.gateway = this.gateway;

          // get each specified channel/network instance in connection and store in res.locals
          await Promise.all(configs.map(async (networkConfig) => {
            logger.debug(`Getting network: ${networkConfig.channel}`);
            res.locals[networkConfig.channel] = {};
            const network = await this.gateway.getNetwork(networkConfig.channel);
            res.locals[networkConfig.channel].network = network;

            // get each specified chaincode/contract instance in channel and store in res.locals
            await Promise.all(Object.entries(networkConfig.chaincodes).map(async (chaincode: [string, string[]]) => {
              const chaincodeName: string = chaincode[0];
              const smartContracts: string[] = chaincode[1];
              logger.debug(`Getting chaincode: ${chaincodeName}`);
              if (smartContracts.length === 0) { // if the chaincode array contains no contracts
                const contract = await network.getContract(chaincodeName);
                res.locals[networkConfig.channel][chaincodeName] = contract;
              } else {
                res.locals[networkConfig.channel][chaincodeName] = {};
                for (const smartContract of smartContracts) {
                  logger.debug(`Getting contract: ${smartContract}`);
                  const contract = await network.getContract(chaincodeName, smartContract);
                  res.locals[networkConfig.channel][chaincodeName][smartContract] = contract;
                }
              }
            }));
          }));

          next();
        } catch (err) {
          logger.error(err.message);
          const jsonRes = {
            message: `${err.message}`,
            statusCode: 500,
            success: false,
          };
          util.sendResponse(res, jsonRes);
        }
      };
      logger.debug(`Done creating ${conn} middleware`);
    });
    logger.debug('Done creating fabric connection middleware functions');

    logger.debug('exiting <<< createMiddlewares()');
  }
}

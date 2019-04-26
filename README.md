[![Build Status](https://travis-ci.org/IBM-Blockchain-Starter-Kit/api-bootstrap.svg?branch=master)](https://travis-ci.org/IBM-Blockchain-Starter-Kit/api-bootstrap)

# REST API Scaffold for use in Blockchain Starter Kit

## Running the server
```
$ npm install
$ npm start
```

Navigate to http://localhost:3000/health/ to ensure server is up and running

Navigate to the Swagger UI at: http://localhost:3000/api-docs/

## Running tests
```
$ npm run test
```

## Fabric Network Getting Started
The app has boilerplate code to make a call out to a chaincode running on a Fabric network. It uses the new [fabric-network](https://www.npmjs.com/package/fabric-network) package. Some changes to default config files and values need to be made in order to hook up to **your** Fabric network.

- Download one of your 'common connection profile' json files and copy it into the *server/config* directory, naming it *fabric-connection-profile.json*. For instructions on how to do that on the IBM Blockchain Platform, see [here](https://cloud.ibm.com/docs/services/blockchain/howto?topic=blockchain-ibp-console-app#ibp-console-app-profile).

- In *server/config/fabric-connections.json*, you will need to update your channel names and chaincode names configuration. For more details on how to configure this file for your needs, [see below](https://github.com/IBM-Blockchain-Starter-Kit/api-bootstrap#fabric-routes-custom-middleware).

- In *server/config/default.json*, you will need to update the `orgName` field to your org. Ensure that the *FABRIC_ENROLL_ID* and *FABRIC_ENROLL_SECRET* environment variables are set with a user that has been registered to that org. **Hint:** For instructions on how to register an application user/identity on the IBM Blockchain Platform, see [here](https://cloud.ibm.com/docs/services/blockchain/howto?topic=blockchain-ibp-console-app#ibp-console-app-identities).

- *server/controllers/ping.js* also has a line to retrieve the contract instance set in the fabric-routes middleware. More details on that can be found in [a later section](https://github.com/IBM-Blockchain-Starter-Kit/api-bootstrap#fabric-routes-custom-middleware), but for now, set the line to `const contract = res.locals.<channel name>.<chaincode name>`. Then there are two calls out to the chaincode. There are two calls for demonstrative purposes. The first is to invoke a transaction that will actually be endorsed and committed to the ledger (submitTransaction). The second is to do a simple query to the ledger (evaluateTransaction). You can find more information for those two calls [here](https://fabric-sdk-node.github.io/Contract.html).
<br>There is a change required to call out to your specific chaincode: Update `Health` in `const queryResponse = await contract.evaluateTransaction('Health');` to whatever your chaincode function name is, and add any additional parameters needed.

After making those changes, you can `GET http://localhost:3000/ping` to see the result.

### Under the covers
You should have a good understanding of how a Hyperledger Fabric network and its SDK to interact with it works, but there are some high level concepts outlined here to understand the flow.

A *FileSystemWallet* is used to manage identities for interacting with the network. More information can be found in the [Hyperledger Fabric SDK for node.js doc](https://fabric-sdk-node.github.io/FileSystemWallet.html). Look in *server/helpers/wallet.js* for some wallet helper functions.

A gateway to talk to the network is established with the [*Gateway*](https://fabric-sdk-node.github.io/Gateway.html) class, by passing the common connection profile, a specified identity, and the wallet that contains that identity.
```
// gateway and contract connection
await gateway.connect(ccp, {
  identity: user,
  wallet: walletHelper.getWallet(),
});
```

Once the gateway is established, you connect to the channel by a [*getNetwork*](https://fabric-sdk-node.github.io/Gateway.html#getNetwork__anchor) call to the gateway.
```
const network = await gateway.getNetwork(config.channelName);
```

Then make a call to get the chaincode with a [*getContract*](https://fabric-sdk-node.github.io/Network.html#getContract__anchor) call.
```
const contract = await network.getContract(config.chaincodeName);
```

Once you have the contract object, you can start invoking and querying the chaincode!
```
// invoke transaction
const invokeResponse = await contract.submitTransaction('Health');

// query
const queryResponse = await contract.evaluateTransaction('Health');
```

**NOTE:** This application uses a custom module to dynamically create and mount middleware functions that connect to a Fabric gateway. See the [Fabric Routes Custom Middleware section](https://github.com/IBM-Blockchain-Starter-Kit/api-bootstrap#fabric-routes-custom-middleware) for more details.

## Development
This app is built using node.js and the [express.js framework](https://expressjs.com/). The entire backend application is found within the *server* directory. The *public* directory contains the swagger.yaml used by the Swagger UI to display API definitions. Note that we use the [swagger-ui-express](https://github.com/scottie1984/swagger-ui-express) npm package to serve and render the Swagger UI, instead of directly including the ui source code.

To start the server in development mode, run `npm run dev`. This will start the server with [nodemon](https://github.com/remy/nodemon), which automatically restarts the node app when you make file changes. It simplifies testing when making changes and adding functionality.

The server is configured and started from the *server/server.js* file. Routers that contain all the routes of your app are added in the *routes* directory. The corresponding controllers/handlers (the logic performed when those apis are called) of those routes are found in the *controllers* directory. When adding a new route to the api, you will first create a new router (or add to an existing router) in the *routes* directory, and also include it in *routes/index.js*. Then you will add the logic function in the *controllers* directory. For example, if I wanted to add a new `/ping` route, you would create a *routes/ping.js* file. The file's contents would look like this:

```
const express = require('express');
const log4js = require('log4js');
const config = require('config');

// controller logic for this route
const pingCtrl = require('../controllers/ping');

const router = express.Router(); // create new router

/**
 * Set up logging
 */
const logger = log4js.getLogger('routes - ping');
logger.setLevel(config.logLevel);

logger.debug('setting up /ping route');

/**
 * Add routes
 */
router.get('/', ping.pingCC); // specify path and controller function for this route

module.exports = router; // export router
```

Routes are registered to the server by taking the exported router in *routes/index.js*, which basically takes all of the routers in the directory and combines them to pass to the express.js app. At this point, we've created the new router, but it won't be registered with the express app. To do that, we need to open *routes/index.js* and add the following lines:

```
const ping = require('./ping');
router.use('/ping', ping);
```

Now all we need to add is the logic. Create a *controllers/ping.js* file. Remember our function name needs to match what we specified when adding the route to the router. The file's contents would look something like this:

```
const log4js = require('log4js');
const config = require('config');

const util = require('../helpers/util');

const logger = log4js.getLogger('controllers - ping');
logger.setLevel(config.logLevel);

/**
 * Controller object
 */
const ping = {};

ping.pingCC = (req, res) => {
  logger.debug('inside pingCC()...');
  
  // ping chaincode

  const jsonRes = {
    statusCode: 200,
    success: true,
    message: 'Pinged chaincode successfully!',
  };

  util.sendResponse(res, jsonRes);
};

module.exports = ping;
```

That's it, you now have a new route in your server! Remember it's important to keep your *swagger.yaml* up to date when you add new endpoints or make changes to existing ones.

The *middlewares* directory contains any middleware that is used in the app, such as error handling in *error-handler.js*.

The *helpers* directory contains any helper functions used in the app, such as a send response helper in *util.js* to send a request response back.

For full API Reference and Documentation, start the server and navigate to http://localhost:3000/api-docs/.

## Fabric Routes Custom Middleware

Full documentation [here](https://github.com/IBM-Blockchain-Starter-Kit/api-bootstrap/blob/master/fabric-routes.md)

## Security Middleware - REST API Auth

This api-bootstrap contains an example route `/securedPing ` that leverages [IBM App ID](https://cloud.ibm.com/docs/services/appid?topic=appid-about#about) (API Strategy). It's recommended to use this pattern to secure new endpoints. The following steps are required to create **your** own App ID instance on the IBM Cloud:

- Log onto IBM Cloud and start a new [App ID Lite service](https://cloud.ibm.com/catalog/services/app-id)
- Once the service is up, navigate on the left and click on `Service credential`
- Click on `View credentials` in the list under the `Service credentials` list. If there are none listed under `Service credentials`, click on `New credential`
- Copy the `oauthServerUrl` into the `default.json` configuration file (which is found in the `server/config` directory)


When performing the request for this endpoint, the client applications will need to include an authorization token. Check the App ID docs [here](https://cloud.ibm.com/docs/services/appid?topic=appid-backend#backend) for more information on how to attain an auth token from the service. The `auth.js` helper has a method that will filter through a list of `clientID's` to assure that the applications calling the endpoint are authorized to do so. Be sure to modify the `fabric-connections.json` for your custom route to enable the authentication. Please see the [Fabric Routes Custom Middleware section](https://github.com/IBM-Blockchain-Starter-Kit/api-bootstrap#fabric-routes-custom-middleware) for more details (there you will find instructions on how to specify the client IDs that should be allowed to access your secured endpoints).

## Testing
The [mocha framework](https://mochajs.org/) along with the [chai library](http://www.chaijs.com/) is used for testing in this project. [nyc (istanbul)](https://github.com/istanbuljs/nyc) is used to display test coverage. All test files are found in the *test* directory. Ensure you update and add tests as you make changes to the app. Always aim for 100% test coverage. There are, of course, other test options that can be used. [Postman](http://blog.getpostman.com/2017/10/25/writing-tests-in-postman/) is another popular choice.

## Deploy application on IBM Cloud

### Create a new Toolchain

*  Create a new Devops toolchain:
    1.  Go to the Dashboard >> DevOps and click on `Create a Toolchain`.
    2.  If deplyoing a **Kubernetes** based application create a toolchain by selecting `Develop a Kubernetes app with Helm`.
    3.  If deplyoing a **Cloud Foundry** based application create a toolchain by selecting `Develop a Cloud Foundry app`.
    4.  Follow prompts and provide the required information such as toolchain name, git repository, api key, etc..

### Edit the required source files and deploy
*  Running as a Kubernetes based application:
    1.  Rename the directory from `App-nameXYZ` under the **./chart** directory to the correct name of the application.
    2.  Edit the `Chart.yaml` file under `chart\<renamed application directory name>` from step 1 and change the value of the `name` field to the same name as specified in step 1.
    3.  Edit the `values.yaml` file under `chart\<renamed application directory name>` from step 1 and change the value of the `repository` field placeholder from `<registry.ng.bluemix.net>/<namespace>/App-nameXYZ` to the appropriate values including the application name from step 1.

*  Running as a Cloud Foundry application:    
    * Update the `name` field in `manifest.yml` file to reflect the correct **name** of the application that will be deployed.

*  Once the required file(s) have been changed for the Kubernetes or Cloud Foundry deployment, the toolchain will detect the change and the delivery service will deploy the application appropriately.

## Troubleshooting

### Fix for possible Kubernetes deployment failure(s)
1.  When deploying the application on the Kubernetes cluster, the toolchain might fail after running a few times.  The reson for this can be due to the fact that Kubernetes cluster has run out of resources when storing the application image.  To fix the problem, follow the steps below to delete the oldest deloyed image by updating the  Kubernetes deployment `build` stage. 

Go to toolchain Delivery Pipline >> Build stage >> Configure stage >> Jobs(tab).  Locate and edit the build script section
and insert the following lines just before `echo "source the container_build script to run in current shell"`.

```
image2Remove=$(echo $(ibmcloud cr image-list -q) | awk '{print $ 1}' )
ibmcloud cr image-rm $image2Remove 
``` 

2.  In the final `PROD` stage, `Deploy Helm Chart` job might fail with the following error:
`Error: UPGRADE FAILED: "<APPNAME>" has no deployed releases`.  To resolve this error check the status of the deployed application and then delete it.

    1.  Get a list of all the deployed applications by running the command : `helm init`.
    2.  Delete the deployed Helm chart for this application by running the command : `helm del --purge <APPNAME>`.  
    3.  Restart the delivery pipeline from the very beginning.

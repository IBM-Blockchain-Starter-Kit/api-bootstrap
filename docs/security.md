# Securing the endpoints

This api-bootstrap contains an example route `/securedPing ` that leverages [IBM App ID](https://cloud.ibm.com/docs/services/appid?topic=appid-about#about) (`APIStrategy`). It's recommended to use this pattern to secure new endpoints. The following steps are required to create **your** own App ID instance on the IBM Cloud:

- Log onto IBM Cloud and start a new [App ID Lite service](https://cloud.ibm.com/catalog/services/app-id)
- Once the service is up, navigate on the left and click on `Service credential`
- Click on `View credentials` in the list under the `Service credentials` list. If there are none listed under `Service credentials`, click on `New credential`
- Copy the `oauthServerUrl` into the `default.json` configuration file (which is found in the `server/config` directory)

When performing the request for this endpoint, the client applications will need to include an authorization token. Check the App ID docs [here](https://cloud.ibm.com/docs/services/appid?topic=appid-backend#backend) for more information on how to attain an auth token from the service. The `auth.js` helper has a method that will filter through a list of `clientID's` to assure that the applications calling the endpoint are authorized to do so. Be sure to modify the `fabric-connections.json` for your custom route to enable the authentication. Please see the [Fabric Routes Custom Middleware](fabric-routes.md) section for more details (there you will find instructions on how to specify the client IDs that should be allowed to access your secured endpoints).

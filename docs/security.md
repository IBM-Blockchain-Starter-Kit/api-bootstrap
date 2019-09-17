# Securing the endpoints

This api-bootstrap contains an example route `/securedPing` that leverages [IBM App ID](https://cloud.ibm.com/docs/services/appid?topic=appid-about#about). It's recommended to use App ID's `APIStrategy` pattern for securing endpoints on this component. The following steps are required to create **your** own App ID instance on the IBM Cloud:

- Log onto IBM Cloud and create a new [App ID](https://cloud.ibm.com/catalog/services/app-id) instance.
- Once the service is up, navigate on the left and click on `Service credentials`.
- Click on `View credentials` in the list under the `Service credentials` list. If there are no credentials listed under `Service credentials`, click on `New credential`.
- Copy the `oauthServerUrl` into the `default.json` configuration file (which is found in the `server/config` directory).

When sending a request to a secured endpoint on this component, the client application(s) will need to include an authorization token in its request. Please review the following App ID docs for for more information on how to attain an authorization token from the service:

* [Back-end apps](https://cloud.ibm.com/docs/services/appid?topic=appid-backend#backend)
* [Application identity and authorization](https://cloud.ibm.com/docs/services/appid?topic=appid-app#app)

Please note that the `auth.ts` helper file in this repository has a method that will filter through a list of `clientID's` to assure that the applications calling the endpoint are authorized to do so. Be sure to modify the `fabric-connections.json` for your custom route to enable the authentication. This method simply inspects the `audience` field in the authorization token and compares it against a white list to determine whether or not the caller is allowed to make the invocation. Please see the [Fabric Routes Custom Middleware](fabric-routes.md) section for more details (there you will find instructions on how to specify the client IDs that should be allowed to access your secured endpoints).

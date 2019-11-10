# Using IBM Certificate Manager as wallet

This api-bootstrap supports using the [IBM Certificate Manager](https://cloud.ibm.com/docs/services/certificate-manager?topic=certificate-manager-about-certificate-manager) service on IBM Cloud as the wallet for identities. The IBM Certificate Manager service allows developers to store and manage public certificates and associated private keys. This makes it a great candidate to use for storing Fabric identities for different components that need to submit transactions to the blockchain network. This api-bootstrap application makes use of the `npm` library [@blockchainlabs/ibm-certificate-manager-wallet](https://www.npmjs.com/package/@blockchainlabs/ibm-certificate-manager-wallet) for connecting to an instance of the IBM Certificate Manager service on the IBM Cloud.

## Create the IBM Certificate Manager service
First, you should create an instance of the IBM Certificate Manager service on IBM Cloud:
1. Login on [IBM Cloud](https://cloud.ibm.com/).
2. Navigate to the [catalog](https://cloud.ibm.com/catalog) and choose the `Security and Identity` option on the left side.  
3. Select the `Certificate Manager` service.
4. Give the service a name and choose the appropriate resource group.
5. Click the `Create` button.

## Set up credentials file
Once your service is created on the IBM Cloud, you should provide its credentials to this application:
1. Create a `cert-manager-credentials.json` file in the `server/config` directory.
2. The `cert-manager-credentials.json` file should look like the following:

```
{
    "url": "https://us-south.certificate-manager.cloud.ibm.com",
    "instanceId": "<instance ID>"
    "apiKey": "<api key>"
}
```

3. To get the `instanceId`, open the Certificate Manager service on the IBM Cloud. In the `Settings` tab you can find the `Service Instance CRN`.
4. To get the `apiKey`, follow these steps:
    1. Log into IBM Cloud, go to Manage -> Access (IAM), and select Service IDs.
    1. Click the Create button on the right.
    1. Give your service ID a name and description and click Create.
    1. Go to the API keys tab of your Service ID and click Create.
    1. Give your API key a name and description and click Create.
    1. IMPORTANT: Copy or download the API key. This will be the only time you can see it.

5. Assign an access policy to the API key:
    1. Go to the *Access policies* tab and click *Assign Access*.
    1. Select *Assign access to resources*.
    1. Select *Certificate Manager* from the drop down list.
    1. Select the corresponding IBM Certificate Manager instance and assign the following access roles: `Manager`, `Writer` and `Reader`. For more information on assigning access policies, please refer to [Managing service access roles](https://console.bluemix.net/docs/services/certificate-manager/access-management.html#managing-service-access-roles).

6. Ensure `cert-manager-credentials.json` is added to the `.gitignore` as it should not be checked in the Git repository.

These steps will set up the application to use the Certificate Manger credentials when running the application locally. This api-bootstrap application also provides an option to read the Certificate Manager credentials as an environment variable. The `cert-manager-mappings.json` in the `server/config` directory states where the credentials for the Certificate Manger service should be read from:

```
{
    "cert-manager-credentials": {
        "searchPatterns": [
            "env:CERTIFICATE_MANAGER_CREDENTIALS",
            "file:/server/config/cert-manager-credentials.json"
        ]
    }
}
```

As reference, these credentials are read in the `server/helpers/wallet.ts` file as:

```
IBMCloudEnv.init('/server/config/cert-manager-mappings.json');
const certManagerCredentials = IBMCloudEnv.getDictionary('cert-manager-credentials');
```

This methodology allows to read the `cert-manager-credentials` from an environment variable when deploying the application to the IBM Cloud (e.g. IBM Kubernetes Service) and from a local file (`cert-manager-credentials.json`) when running locally.

# Using Certificate Manager as Wallet

This api-bootstrap provides option to setup the Hyperledger Fabric [wallet](https://hyperledger-fabric.readthedocs.io/en/release-1.4/developapps/wallet.html) using the [Certificate Manager](https://cloud.ibm.com/docs/services/certificate-manager?topic=certificate-manager-about-certificate-manager) service on IBM Cloud.  The Certificate Manager services allows developers to store and manage SSL/TLS certificates and associcated private keys. This makes it a great candidate to use for storing user identities for the blockcahin application users, who will need certificate with private key to connect to a blockchain network.  This api-bootstap makes use of the npm library [@blockchainlabs/ibm-certificate-manager-wallet](https://www.npmjs.com/package/@blockchainlabs/ibm-certificate-manager-wallet) to setup the Certifcate Manager service for use as Hyperledger Fabric wallet. 

## Create the Certificate Manager service

First step would be to create the Certificate Manager service on IBM Cloud:
1. Login on [IBM Cloud](https://cloud.ibm.com/)
2. Navigate to the [catalog](https://cloud.ibm.com/catalog) and choose the `Security and Identity` option on the left side.  
3. Select the `Certificate Manager` service
4. Give the service a name and choose the appropriate resource group
5. Click the `Create` button

## Setup credentials file
Once your service is created in IBM Cloud, you will need to add the credentials for the service to this application:
1. Create a `cert-manager-credentials.json` file in the `server/config` directory 
2. The `cert-manager-credentials.json` file should look like the following:
```
{
    "url": "https://us-south.certificate-manager.cloud.ibm.com",
    "instanceId": ""
    "apiKey": ""
}
```
3. To get the `instanceId`, open the Certificate Manager service on IBM Cloud. In the `Settings` tab you can find the `Service Instance CRN`.
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
    1. Select the corresponding IBM Certificate Manager instance and assign the following access roles: `Manager`,`Writer` and `Reader`. For more information on assigning access policies, please refer to [Managing service access roles](https://console.bluemix.net/docs/services/certificate-manager/access-management.html#managing-service-access-roles).

6. Ensure `cert-manager-credentials.json` is added to the `.gitignore` as it should not be checked in the Git repository.

These steps will setup the application to use the certificate manger credentials when running the bootstap locally.  This bootstrap provides an option to read the particular certificate manager credentials json as environment variable as well.  This is done by using the npm library [ibm-cloud-env](https://www.npmjs.com/package/ibm-cloud-env), which dictates the credentials to be read from a `mappings.json` file. The `mappings.json` in the `server/config` directory can then provide options to read credentials as environment variable or a file:
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

These credentials are then read in the `server/helpers/wallet.ts` file as:
```
IBMCloudEnv.init('/server/config/mappings.json');
const certManagerCredentials = IBMCloudEnv.getDictionary('cert-manager-credentials');
```

This methodology allows to read the `cert-manager-credentials` as environment variables when deploying the application to the cloud, while reading from the `cert-manager-credentials.json` file when working locally.

## Update config

Once the certificate manager service is setup and the credentials are provided to this app, the application can be configured to use the Certificate Manager service by updating the `server/config/default.json` file. This config json contains the `supportedWallets` field which presents the currently supported options to use as the wallet.  This options will have to be provided in the `activeWallet` field in the same config json.  To use the Certifcate Manager service, you need to update the `activeWallet` field to `CertificateManagerWallet`.  

** Note: once you are using the `CertificateManagerWallet` option, the following field `fsWalletPath` is ignored.  This is required when setting the `activeWallet` field to `FileSystemWallet`

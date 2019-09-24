# Wallet settings

The Hyperledger Fabric [wallet](https://hyperledger-fabric.readthedocs.io/en/release-1.4/developapps/wallet.html) requires a storage for certificates and private key to store user identities.  They can use file system as wallet or external databases as storage for storing user identities.  A file system wallet is preferable during development of the blockchain application while an external storage would suit a production environment.  This bootstrap provides two options which can be configured within the application:
* File system wallet
* IBM Certificate Manager

## Configure wallet

The default setting for this application is to use file system as wallet.  The wallet type can be configured through the `server/config/default.json` file.  This config json contains the `supportedWallets` field which presents the currently supported options to use as the wallet.  The wallet type option will have to be provided in the `activeWallet` field in the same config json.  To use the file system as wallet, you would need to set the `activeWallet` field to `FileSystemWallet` and then set `fsWalletPath` field to the file path location.  This will start storing and managing user identities in that defined file path.  

To use the IBM Certifcate Manager service, you would need to update the `activeWallet` field to `CertificateManagerWallet`. Once you are using the `CertificateManagerWallet` option, the following field `fsWalletPath` is ignored. 
Please see this document for creating and setting up the IBM Certificate Manager to use as wallet for this application:
* [Using IBM Certificate Manager as wallet](docs/cert-manager.md)

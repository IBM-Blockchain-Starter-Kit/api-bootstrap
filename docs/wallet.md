# Wallet settings

A [wallet](https://hyperledger-fabric.readthedocs.io/en/release-1.4/developapps/wallet.html) serves as the storage for public certificates and their corresponding private keys. The file system and external databases are examples of storages that can function as wallets for storing user identities (i.e. certificates and private keys). While a file system wallet is convenient for a quick prototype of a blockchain application, an external storage is appropriate for other development efforts. The api-bootstrap codebase provides two configurable wallet options:

* File system
* IBM Certificate Manager

## Configure wallet

The default setting for the api-bootstrap application is to use the file system as the wallet. The wallet type is configured in the [`server/config/default.json`](../server/config/default.json) file. The `supportedWallets` field in this configuration file states the currently supported wallet type options. In this same configuration file, the `activeWallet` field specifies which wallet option the application should use. For instance to use the file system as the wallet, you should set the `activeWallet` field to `FileSystemWallet` and then also set the `fsWalletPath` field to the desired folder path location. Done this, user identities will be stored and managed in that folder.  

To use the IBM Certificate Manager service as the wallet, you should update the `activeWallet` field to `CertificateManagerWallet` (please note that when using IBM Certificate Manager as the wallet, the `fsWalletPath` field is ignored). For further details on creating and setting up the IBM Certificate Manager as the wallet, please see [Using IBM Certificate Manager as wallet](cert-manager.md).

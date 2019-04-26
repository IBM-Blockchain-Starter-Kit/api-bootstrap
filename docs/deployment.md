# Deploy application to the IBM Cloud

## Create a new toolchain

*  Create a new DevOps toolchain:
    1.  Go to the Dashboard >> DevOps and click on `Create a Toolchain`.
    2.  If deploying a **Kubernetes** based application create a toolchain by selecting `Develop a Kubernetes app with Helm`.
    3.  If deploying a **Cloud Foundry** based application create a toolchain by selecting `Develop a Cloud Foundry app`.
    4.  Follow prompts and provide the required information such as toolchain name, git repository, api key, etc..

## Edit the required source files and deploy
*  Running as a Kubernetes based application:
    1.  Rename the directory from `app-name` under the **./chart** directory to the correct name of the application.
    2.  Edit the `Chart.yaml` file under `chart\<app-name>` and update the value of the `name` field to the application name (as specified in step 1).
    3.  Edit the `values.yaml` file under `chart\<app-name>` and update the value of the `repository` field accordingly (update domain, namespace and application name).

*  Running as a Cloud Foundry application:    
    1. Update the `name` field in `manifest.yml` file to reflect the correct **name** of the application that will be deployed.

*  Once the required file(s) have been changed for the Kubernetes or Cloud Foundry deployment, the toolchain will detect the change and the delivery service will deploy the application appropriately.

## Troubleshooting

## Fix for possible Kubernetes deployment failure(s)
1.  Depending on the resources available under your Kubernetes cluster, you may see the following error `Status: denied: You have exceeded your storage quota. Delete one or more images, or review your storage quota and pricing plan`.  To work around this limitation, delete the oldest deployed image by updating the Kubernetes deployment `build` stage:

    Go to toolchain Delivery Pipeline >> Build stage >> Configure stage >> Jobs(tab) >> Pre-build check.  Locate and edit the build script section and uncomment the lines beginning with the following:
    ```
    # echo "=========================================================="
    # KEEP=1
    # echo -e "PURGING REGISTRY, only keeping last ${KEEP} image(s) based on image digests"
    # COUNT=0 

    ...

    #fi
    ```

2.  If the `Deploy Helm Chart` job in the final `PROD` stage fails with the `Error: UPGRADE FAILED: "<app-name>" has no deployed releases` error, follow the steps below:

    1.  Delete the deployed Helm chart for this application by running the command: `helm del --purge <app-name>`.  
    1.  Restart the delivery pipeline from the very beginning.


# Set up Ingress

This api-bootstrap provides an Ingress template to configure an `HTTPs` URL for the application deployed on Kubernetes. This can be expanded to expose multiple apps in your Kubernetes cluster.  The Ingress resource is found in the `misc/https-enablement` folder.

### 1. Update Ingress metadata

*  In the [Ingress resource](../misc/https-enablement/ingress-app-name.yaml) file, provide a `name` for your ingress resource, replacing the `<ingress-resource-name>` field.
*  Please note that under `annotations`, the `ingress.bluemix.net/redirect-to-https` field is set to `"True"`.  This provides the `HTTPs` enablement to the application's URL.

### 2. Get `<subdomain>` and `<tls_secret_name>`

After your Kubernetes cluster is configured, run the following command to get the `<subdomain>` and `<tls_secret_name>` values:

```
ibmcloud ks cluster get --cluster <cluster_name_or_ID> | grep Ingress
```

Executing the above command should result in output similar to:

```
Ingress Subdomain:      <subdomain>
Ingress Secret:         <tls_secret_name>
```

Using the above values, you can now update the [Ingress resource](../misc/https-enablement/ingress-app-name.yaml) file accordingly. For instance, the `<domain>` element in the [Ingress resource](../misc/https-enablement/ingress-app-name.yaml) can have the same value as `<subdomain>` or your own custom domain. For more details, please see [Create the Ingress resource](https://cloud.ibm.com/docs/containers?topic=containers-ingress#public_inside_4).

### 3. Add service

The Ingress resource in this api-bootstrap supports the default service (provided in this repository) on the default domain path.  This can be expanded to support different services on different URL paths (for more details, please see [Create the Ingress resource](https://cloud.ibm.com/docs/containers?topic=containers-ingress#public_inside_4)). The current example uses the path of `/`, which points to the default service. Update the `<app_service>` field to the service you have deployed on the Kubernetes cluster.

### 4. Apply the Ingress resource

Once your Ingress resource file is ready, you can apply it to your Kubernetes cluster with the following command:

```
kubectl apply -f <ingress-app-name.yaml> -n <namespace>
```

Replace `<ingress-app-name.yaml>` with the name of your Ingress resource file and `<namespace>` with the namespace in the Kubernetes cluster where your application is deployed. 

Verify that the Ingress resource was created successfully:

```
kubectl describe ingress <ingress-resource-name>
```

Now try navigating to your application using the URL set up by the Ingress resource:

```
https://<domain>/
```

## References
* [Setting up Ingress on IBM cloud](https://cloud.ibm.com/docs/containers?topic=containers-ingress)
* [Customizing Ingress routing](https://cloud.ibm.com/docs/containers?topic=containers-ingress_annotation)

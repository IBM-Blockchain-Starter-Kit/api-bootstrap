# Set up Ingress

This bootstrap provides an Ingress template to configure an `https` url for the application deployed on Kubernetes. This can be expanded to expose multiple apps in your Kubernetes cluster.  The Ingress resource is present here `misc/https-enablement`.

### Update Ingress metadata

*  On the Ingress YAML file, provide a `name` for your ingress resource, replacing the <<ingress-resource-name>>
*  Note that under `annotations`, the `ingress.bluemix.net/redirect-to-https` field is set to `"True"`.  This provides the `https` enablement to the application;s url.

### Get <subdomain> and <tls_secret_name>

After your cluster is setup, you can run the following command to get the `<subdomain>` and `<tls_secret_name>`:
```
ibmcloud ks cluster get --cluster <cluster_name_or_ID> | grep Ingress
```
This will give the output of:
```
Ingress Subdomain:      <subdomain>
Ingress Secret:         <tls_secret_name>
```

The `<domain>` mentioned in the Ingress resource could be the `<subdomain>`, or can be appended by a custom addition to the beginning of the `<subdomain>` followed by a period `.`.

### Add service

The Ingress YAML in this bootstrap provides a particular service on the default domain path.  This can be expanded to provide different services on different url paths. These <paths> are added on the <domain> to navigate to the particular service.  The current example provides the path of `/`, which points to a particular service. Here, update the `<app_service>` to the service you have deployed on the Kubernetes cluster.


### Apply the Ingress resource

Once your Ingress YAML file is ready, you can apply it to your cluster with the following command:
```
kubectl apply -f <ingress-app-name.yaml> -n <namespace>
```
Replace `<ingress-app-name.yaml>` with your Ingress YAML file and `<namespace>` with the namespace on the Kubernetes cluster where your application is deployed. 

Verify that the Ingress resource was created successfully.
```
kubectl describe ingress <ingress-resource-name>
```
Now try navigating to your application using the url set up by the Ingress resource:
```
https://<domain>/
```

## Additional Resource
* [Setting up Ingress on IBM cloud](https://cloud.ibm.com/docs/containers?topic=containers-ingress)
* [Customizing Ingress routing](https://cloud.ibm.com/docs/containers?topic=containers-ingress_annotation)
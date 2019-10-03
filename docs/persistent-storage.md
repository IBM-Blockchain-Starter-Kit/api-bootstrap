# Set up Persistent Volume Claim for file storage

Persistent storage allows data to be available even if the container, pod, or the worker node is removed.  This data can be stored in either a file system or a database.  This guide walks through setting up a persistent storage for a file system, using Persistent Volume Claim (PVC) on the Kubernetes cluster.  This involves creating a PVC resource, and mounting volume storage on the deployment to the cluster.  We will first set up the PVC configuration in `values.yaml` file for the Helm PVC and deployment template to use values from.  Next we'll define the PVC template and modification to the deployment template.

## 1. Define PVC configuration in `values.yaml`

In the `values.yaml` file, located in the folder `chart/app-name`, add a section for `pvc` containing the configuration of PVC for the cluster:

```
pvc:
  volName: <volume name>
  pvcName: <pvc name>
  mountPath: <mount path>
  labels:
    billingType: <billing type>
    region: <region>
    zone: <zone>
  spec:
    accessModes:
      - <access modes>
    resources:
      requests:
        storage: <storage>
    storageClassName: <storage class name>
```

See the fields definition defined here: [Adding file storage to apps](https://cloud.ibm.com/docs/containers?topic=containers-file_storage#add_file). Make sure the `mountPath` is directed to the absolute path of the data directory intended to be persisted in the file storage. This path includes the prefix as defined by the `WORKDIR` in the `Dockerfile`. As the current `Dockerfile` in this api-bootstrap has a `WORKDIR` set to `/app`, so any `mountPath` defined here should have a `/app` prefix defined here.

Here is an example::
```
pvc:
  volName: sample-app-static-data
  pvcName: sample-app-pvc
  mountPath: "/app/data"
  labels:
    billingType: "monthly"
    region: us-south
    zone: dal10
  spec:
    accessModes:
      - ReadWriteMany
    resources:
      requests:
        storage: 20Gi
    storageClassName: ibmc-file-bronze    
```

## 2. Create the PVC template

Next, create a PVC template called `pvc.yaml` in the `chart/app-name/templates` folder.  This will define your PVC resource making use of the values provided in the `values.yaml` file. The `pvc.yaml` would be like the following:
```
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: "{{  .Values.pvc.pvcName  }}"
  labels:
    billingType: "{{  .Values.pvc.labels.billingType  }}"
    region: "{{  .Values.pvc.labels.region  }}"
    zone: "{{  .Values.pvc.labels.zone  }}"
spec:
  accessModes: {{  .Values.pvc.spec.accessModes  }}
  resources:
    requests:
      storage: "{{  .Values.pvc.spec.resources.requests.storage  }}"
  storageClassName: "{{  .Values.pvc.spec.storageClassName  }}"
```

## 3. Update `deployment.yaml`

Next, mount the volume to your deployment, by updating `deployment.yaml` in `chart/app-name/templates` folder.  Under the `containers` section, where the container is defined, add a `volumeMounts` section as shown below:
```
    spec:
      containers:
      - name: "{{  .Chart.Name  }}"
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        imagePullPolicy: {{ .Values.image.pullPolicy }}
        volumeMounts:
        - name: "{{  .Values.pvc.volName  }}"
          mountPath: "{{  .Values.pvc.mountPath  }}"
```

Further at the bottom, after your containers are defined, add the `volumes` definition at the same indentation level as `containers`:
```
      volumes:
      - name: "{{  .Values.pvc.volName  }}"
        persistentVolumeClaim:
          claimName: "{{  .Values.pvc.pvcName  }}"
```

This defines your PV and PVC for deployment of the application.  

## 4. Verify PVC and File Storage

Once you have deployed the application to Kubernetes using the Helm charts with the PVC addition, verify that the PVC and PV resources have been created and the persistent file storage path persists even after the pod has been removed.

To verify whether the PVC is created, use the following command:
```
kubectl describe pvc <pvc name>
```

To verify that the PV is successfully mounted:
```
kubectl describe deployment <deployment_name>
```

You can verify the file storage, by updating the data in your `<mount path>` by adding or removing a file. Next, delete the application's pod (using either the Kubernetes console or CLI), this will trigger Kubernetes to create a new pod for this application. If the persistent volume for the path is operational, then you should still see the updated data in that `<mount path>` as compared to being reset without the persistent volume.

## References
* [Planning highly available persistent storage](https://cloud.ibm.com/docs/containers?topic=containers-storage_planning#choose_storage_solution)
* [Understanding Kubernetes storage basics](https://cloud.ibm.com/docs/containers?topic=containers-kube_concepts)
* [Storing data on classic IBM Cloud File Storage](https://cloud.ibm.com/docs/containers?topic=containers-file_storage)

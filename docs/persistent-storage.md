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

Update these fields as the following:
* `<volume name>`:  The name of the volume to mount to your pod.
* `<pvc name>`:  The name of the PVC resource.
* `<mount path>`:  The absolute path of the directory to persist as file storage.
* `<billing type>`:  The frequency for which your storage bill is calculated, either `monthly` or `hourly`.
* `<region>`:  The region where you want to provision your file storage.
* `<zone>`:  The zone where you want to provision your file storage.
* `<access modes>`:  This should be one of the following options: `ReadWriteMany`, `ReadOnlyMany`, `ReadWriteOnce`.
* `<storage>`:  The size of the file storage, in gigabytes (Gi).
* `<storage class name>`:  The name of the volume to mount to your pod. You can choose to use one of the [IBM-provided storage classes](https://cloud.ibm.com/docs/containers?topic=containers-file_storage#file_storageclass_reference) or [create your own storage class](https://cloud.ibm.com/docs/containers?topic=containers-file_storage#file_custom_storageclass). This creates an instance of IBM Cloud File Storage to be used by the Kubernetes PV.

Here is an example from an actual MVP:
```
pvc:
  volName: social-platform-static-data
  pvcName: social-platform-pvc
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

You can verify the file storage, by updaing the data in your `<mount path>`.  Next, delete the pod with the application, which will trigger Kubernetes to create a new pod with the application.  If the persistent volume for the path is operational, then you should still see the updated data in that `<mount path>` as compared to being reset without the persistent volume.

## References
* [Planning highly available persistent storage](https://cloud.ibm.com/docs/containers?topic=containers-storage_planning#choose_storage_solution)
* [Understanding Kubernetes storage basics](https://cloud.ibm.com/docs/containers?topic=containers-kube_concepts)
* [Storing data on classic IBM Cloud File Storage](https://cloud.ibm.com/docs/containers?topic=containers-file_storage)

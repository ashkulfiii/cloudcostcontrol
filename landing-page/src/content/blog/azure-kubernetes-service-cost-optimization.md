---
title: "Azure Kubernetes Service Cost Optimization: Complete Guide"
description: "Master AKS cost optimization with node scaling, resource management, and advanced scheduling techniques to reduce your Kubernetes costs by up to 70%."
pubDate: 2025-02-10
hero: "/blog-placeholder-3.jpg"
tags: ["azure", "kubernetes", "cost-optimization", "containers", "aks"]
---

# Azure Kubernetes Service Cost Optimization: Complete Guide

Azure Kubernetes Service (AKS) can quickly become one of your largest cloud expenses if not properly optimized. This comprehensive guide will show you how to reduce your AKS costs by up to 70% through proven optimization strategies.

## Understanding AKS Cost Components

### Primary Cost Drivers
- **Node pools**: Virtual machines running your workloads
- **Load balancers**: Standard vs Basic tier differences
- **Storage**: Persistent volumes and disk types
- **Networking**: Egress traffic and bandwidth
- **Additional services**: Container Registry, monitoring

### Hidden Cost Factors
- Over-provisioned node sizes
- Idle resources during off-hours
- Inefficient pod scheduling
- Unused persistent volumes
- Network traffic between regions

## Node Pool Optimization Strategies

### Right-Sizing Node Pools

```bash
# Analyze current node utilization
kubectl top nodes

# Check resource requests vs limits
kubectl describe nodes | grep -A 5 "Allocated resources"

# Optimize node pool configuration
az aks nodepool update \
  --resource-group myResourceGroup \
  --cluster-name myAKSCluster \
  --name nodepool1 \
  --enable-cluster-autoscaler \
  --min-count 1 \
  --max-count 10
```

### Spot Instances for Non-Critical Workloads

```yaml
# spot-nodepool.yaml
apiVersion: v1
kind: NodePool
metadata:
  name: spot-pool
spec:
  scaleSetPriority: Spot
  scaleSetEvictionPolicy: Delete
  spotMaxPrice: 0.05  # Maximum price per hour
  nodeLabels:
    workload-type: "batch"
  nodeTaints:
    - key: "spot"
      value: "true"
      effect: "NoSchedule"
```

## Resource Management Best Practices

### Setting Proper Resource Requests and Limits

```yaml
# optimized-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cost-optimized-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: cost-optimized-app
  template:
    metadata:
      labels:
        app: cost-optimized-app
    spec:
      containers:
      - name: app
        image: myapp:latest
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        env:
        - name: JAVA_OPTS
          value: "-Xmx200m -Xms128m"
```

### Horizontal Pod Autoscaler Configuration

```yaml
# hpa-config.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: cost-optimized-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: cost-optimized-app
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
```

## Advanced Scheduling Techniques

### Pod Disruption Budgets for Cost Efficiency

```yaml
# pdb-config.yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: cost-optimized-pdb
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: cost-optimized-app
```

### Node Affinity for Cost Optimization

```yaml
# node-affinity-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: batch-workload
spec:
  replicas: 5
  selector:
    matchLabels:
      app: batch-workload
  template:
    metadata:
      labels:
        app: batch-workload
    spec:
      affinity:
        nodeAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            preference:
              matchExpressions:
              - key: workload-type
                operator: In
                values:
                - "batch"
          - weight: 50
            preference:
              matchExpressions:
              - key: kubernetes.azure.com/scalesetpriority
                operator: In
                values:
                - "spot"
      tolerations:
      - key: "spot"
        operator: "Equal"
        value: "true"
        effect: "NoSchedule"
      containers:
      - name: batch-app
        image: batch-processor:latest
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
```

## Storage Cost Optimization

### Persistent Volume Management

```bash
# Clean up unused PVs
kubectl get pv | grep Released | awk '{print $1}' | xargs kubectl delete pv

# Optimize storage classes
kubectl apply -f - <<EOF
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: cost-optimized-ssd
provisioner: disk.csi.azure.com
parameters:
  storageaccounttype: Premium_LRS
  kind: Managed
  cachingmode: ReadOnly
reclaimPolicy: Delete
allowVolumeExpansion: true
volumeBindingMode: WaitForFirstConsumer
EOF
```

### Dynamic Volume Provisioning

```yaml
# pvc-optimized.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: cost-optimized-pvc
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: cost-optimized-ssd
  resources:
    requests:
      storage: 10Gi
```

## Monitoring and Cost Tracking

### Kubernetes Resource Recommender

```bash
# Install Vertical Pod Autoscaler
git clone https://github.com/kubernetes/autoscaler.git
cd autoscaler/vertical-pod-autoscaler
./hack/vpa-up.sh

# Create VPA for recommendations
kubectl apply -f - <<EOF
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: cost-optimization-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: cost-optimized-app
  updatePolicy:
    updateMode: "Off"  # Only provide recommendations
EOF
```

### Cost Monitoring with Kubecost

```bash
# Install Kubecost
helm repo add kubecost https://kubecost.github.io/cost-model/
helm install kubecost kubecost/cost-analyzer \
  --namespace kubecost \
  --create-namespace \
  --set kubecostToken="your-token-here"

# Access Kubecost dashboard
kubectl port-forward -n kubecost svc/kubecost-cost-analyzer 9090:9090
```

## Automation Scripts

### Automatic Cluster Scaling

```bash
#!/bin/bash
# auto-scale-cluster.sh

# Get current time (24-hour format)
CURRENT_HOUR=$(date +%H)

# Scale down during off-hours (6 PM to 6 AM)
if [ $CURRENT_HOUR -ge 18 ] || [ $CURRENT_HOUR -lt 6 ]; then
    echo "Scaling down for off-hours..."
    az aks nodepool scale \
        --resource-group myResourceGroup \
        --cluster-name myAKSCluster \
        --name nodepool1 \
        --node-count 1
else
    echo "Scaling up for business hours..."
    az aks nodepool scale \
        --resource-group myResourceGroup \
        --cluster-name myAKSCluster \
        --name nodepool1 \
        --node-count 3
fi
```

### Resource Cleanup Automation

```bash
#!/bin/bash
# cleanup-resources.sh

# Remove completed jobs older than 24 hours
kubectl delete jobs --field-selector status.successful=1 \
  --all-namespaces \
  --dry-run=client -o yaml | \
  grep 'creationTimestamp:' | \
  awk '{print $2}' | \
  while read timestamp; do
    if [ $(date -d "$timestamp" +%s) -lt $(date -d "24 hours ago" +%s) ]; then
      kubectl delete job --field-selector status.successful=1 --all-namespaces
      break
    fi
  done

# Clean up evicted pods
kubectl get pods --all-namespaces --field-selector=status.phase=Failed \
  -o json | \
  kubectl delete -f -

# Remove unused config maps and secrets
kubectl get configmaps --all-namespaces -o json | \
  jq -r '.items[] | select(.metadata.ownerReferences == null) | "\(.metadata.namespace)/\(.metadata.name)"' | \
  while read cm; do
    echo "Consider reviewing ConfigMap: $cm"
  done
```

## Performance vs Cost Trade-offs

### Burstable vs Guaranteed QoS

```yaml
# Burstable (cost-optimized)
resources:
  requests:
    memory: "128Mi"
    cpu: "100m"
  limits:
    memory: "512Mi"
    cpu: "500m"

# Guaranteed (performance-optimized)
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

### Multi-Architecture Support

```yaml
# multi-arch-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: multi-arch-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: multi-arch-app
  template:
    metadata:
      labels:
        app: multi-arch-app
    spec:
      affinity:
        nodeAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            preference:
              matchExpressions:
              - key: kubernetes.io/arch
                operator: In
                values:
                - "arm64"  # ARM instances are often cheaper
      containers:
      - name: app
        image: myapp:latest
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
```

## Cost Optimization Checklist

### Daily Tasks
- [ ] Review cluster autoscaler events
- [ ] Check for failed/evicted pods
- [ ] Monitor resource utilization metrics
- [ ] Verify HPA scaling behavior

### Weekly Tasks
- [ ] Analyze cost trends in Azure Cost Management
- [ ] Review VPA recommendations
- [ ] Audit unused persistent volumes
- [ ] Check for zombie resources

### Monthly Tasks
- [ ] Evaluate node pool configurations
- [ ] Review and update resource requests/limits
- [ ] Assess storage class usage
- [ ] Plan for Reserved Instance purchases

## Real-World Case Study

**Challenge**: A fintech company running 15 microservices on AKS with costs of $8,000/month.

**Optimizations Applied**:
1. Implemented cluster autoscaling: -30% cost
2. Added spot instances for batch workloads: -25% cost
3. Optimized resource requests/limits: -20% cost
4. Scheduled scaling for off-hours: -15% cost

**Result**: Monthly costs reduced to $2,400 (70% reduction) while maintaining performance SLAs.

## Next Steps

1. **Implement monitoring**: Set up Kubecost or similar tools
2. **Start with autoscaling**: Enable cluster and pod autoscaling
3. **Optimize gradually**: Don't change everything at once
4. **Monitor impact**: Track both costs and performance metrics

AKS cost optimization is an ongoing process. Start with the biggest impact items (autoscaling and resource optimization) and gradually implement more advanced techniques as your team becomes comfortable with the changes.

Remember: The goal is to optimize costs without sacrificing application performance or reliability. Always test changes in a non-production environment first.

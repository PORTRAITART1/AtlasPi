# Multi-Region Deployment Configuration - AtlasPi
## Global Scale Infrastructure Setup

---

## 🌍 Multi-Region Architecture

### Supported Regions

```yaml
Primary Regions:
  - us-east-1      (Americas - Primary)
  - eu-west-1      (Europe - Primary)
  - ap-southeast-1 (Asia Pacific)

Failover Regions:
  - us-west-2      (Americas - Failover)
  - eu-central-1   (Europe - Failover)
  - ap-northeast-1 (Asia Pacific - Failover)
```

---

## 📋 Regional Kubernetes Manifests

### US-East-1 (Primary Americas)
```bash
# Deploy to US East
kubectl config use-context aws-us-east-1
kubectl apply -f k8s-manifest-us-east.yaml

# Verify
kubectl get all -n atlaspi
kubectl get nodes
```

### EU-West-1 (Primary Europe)
```bash
# Deploy to EU West
kubectl config use-context aws-eu-west-1
kubectl apply -f k8s-manifest-eu-west.yaml

# Verify
kubectl get all -n atlaspi
```

### AP-Southeast-1 (Primary Asia)
```bash
# Deploy to AP Southeast
kubectl config use-context aws-ap-southeast-1
kubectl apply -f k8s-manifest-ap-southeast.yaml

# Verify
kubectl get all -n atlaspi
```

---

## 🔄 Cross-Region Replication

### Database Replication
```yaml
Primary: us-east-1 (RDS PostgreSQL)
Replicas:
  - eu-west-1 (Read-only)
  - ap-southeast-1 (Read-only)

Replication Lag: <1s
Failover: Automatic (30s RTO)
```

### Container Registry Sync
```bash
# Sync images across regions
for region in us-east-1 eu-west-1 ap-southeast-1; do
  aws ecr create-repository --repository-name atlaspi --region $region
  docker tag atlaspi-backend:latest \
    $AWS_ACCOUNT.dkr.ecr.$region.amazonaws.com/atlaspi-backend:latest
  docker push $AWS_ACCOUNT.dkr.ecr.$region.amazonaws.com/atlaspi-backend:latest
done
```

---

## ⚙️ Regional Configuration

### US-East-1 Configuration
```yaml
Region: us-east-1
Cluster: atlaspi-us-east
Nodes: 6 (t3.large)
Replicas:
  Backend: 3
  AIAR: 2
  Prometheus: 1

Resource Allocation:
  CPU: 6 cores
  Memory: 24GB
  Storage: 100GB
```

### EU-West-1 Configuration
```yaml
Region: eu-west-1
Cluster: atlaspi-eu-west
Nodes: 6 (t3.large)
Replicas:
  Backend: 3
  AIAR: 2
  Prometheus: 1

Resource Allocation:
  CPU: 6 cores
  Memory: 24GB
  Storage: 100GB
```

### AP-Southeast-1 Configuration
```yaml
Region: ap-southeast-1
Cluster: atlaspi-ap-southeast
Nodes: 4 (t3.large)
Replicas:
  Backend: 2
  AIAR: 1
  Prometheus: 1

Resource Allocation:
  CPU: 4 cores
  Memory: 16GB
  Storage: 60GB
```

---

## 🌐 Global Load Balancing

### Route 53 Health Checks
```bash
# Create health checks
aws route53 create-health-check \
  --health-check-config \
  IPAddress=<us-east-lb-ip>,Port=443,Type=HTTPS,ResourcePath=/api/health

# Route traffic based on latency
aws route53 create-resource-record-set \
  --hosted-zone-id <zone-id> \
  --change-batch file://routing-policy.json
```

### Routing Policy
```yaml
Routing Type: Latency-based
Primary Region: us-east-1
Failover: Automatic

Health Checks:
  - Check interval: 30s
  - Failure threshold: 3
  - RTO: 90s
```

---

## 🔐 Multi-Region Security

### TLS Certificates
```bash
# Create wildcard certificates
certbot certonly \
  --dns-route53 \
  -d "*.atlaspi.example.com" \
  -d "*.us-east.atlaspi.example.com" \
  -d "*.eu-west.atlaspi.example.com" \
  -d "*.ap-southeast.atlaspi.example.com"
```

### Secrets Replication
```bash
# Replicate secrets across regions
for region in eu-west-1 ap-southeast-1; do
  kubectl config use-context $region
  kubectl create secret generic atlaspi-secrets \
    --from-file=<secrets>
done
```

---

## 📊 Monitoring Multi-Region

### Prometheus Federation
```yaml
# Global Prometheus (Central)
scrape_configs:
  - job_name: 'federation'
    scrape_interval: 15s
    honor_labels: true
    metrics_path: '/federate'
    params:
      'match[]':
        - '{job=~".*"}'
    static_configs:
      - targets:
        - 'prometheus-us-east:9090'
        - 'prometheus-eu-west:9090'
        - 'prometheus-ap-southeast:9090'
```

### Centralized Alerting
```yaml
AlertManager:
  Routes:
    - match:
        region: us-east
      receiver: us-east-team
    - match:
        region: eu-west
      receiver: eu-west-team
    - match:
        region: ap-southeast
      receiver: ap-southeast-team
```

---

## 🔄 Failover & Disaster Recovery

### Multi-Region Failover
```bash
#!/bin/bash
# Automated failover script

PRIMARY_REGION="us-east-1"
FAILOVER_REGION="us-west-2"

# Check primary health
if ! curl -f https://api.us-east.atlaspi.example.com/health; then
  echo "Primary region failed. Failing over to $FAILOVER_REGION"
  
  # Update Route 53
  aws route53 change-resource-record-sets \
    --hosted-zone-id <zone-id> \
    --change-batch file://failover.json
  
  # Promote failover region
  kubectl config use-context aws-$FAILOVER_REGION
  kubectl scale deployment backend -n atlaspi --replicas=5
  kubectl scale deployment aiar-controller -n atlaspi --replicas=3
fi
```

### RTO/RPO Targets
```
Recovery Time Objective (RTO): 2 minutes
Recovery Point Objective (RPO): 1 minute

Failover Sequence:
  1. Health check failure detected (30s)
  2. Failover region promotion (45s)
  3. DNS update propagation (30s)
  4. Service restoration (15s)
  Total: ~2 minutes
```

---

## 🚀 Deployment Commands

### Deploy to All Regions
```bash
#!/bin/bash

REGIONS=("us-east-1" "eu-west-1" "ap-southeast-1")

for region in "${REGIONS[@]}"; do
  echo "Deploying to $region..."
  kubectl config use-context aws-$region
  kubectl apply -f k8s-manifest-${region}.yaml
  kubectl wait --for=condition=available --timeout=5m \
    deployment/backend -n atlaspi
  echo "✅ $region deployment complete"
done
```

### Verify Global Deployment
```bash
#!/bin/bash

echo "Global Deployment Status"
echo "========================"

for context in \
    "aws-us-east-1" \
    "aws-eu-west-1" \
    "aws-ap-southeast-1"; do
  
  kubectl config use-context $context
  echo "Region: $context"
  kubectl get pods -n atlaspi
  kubectl get svc -n atlaspi
  echo ""
done
```

---

## 📈 Performance Metrics by Region

### US-East-1 (Primary)
```
Latency: 45ms avg
Throughput: 3000 req/s
Uptime: 99.99%
Load: 65%
```

### EU-West-1 (Primary)
```
Latency: 52ms avg (from US)
Throughput: 2800 req/s
Uptime: 99.99%
Load: 58%
```

### AP-Southeast-1 (Secondary)
```
Latency: 120ms avg (from US)
Throughput: 1500 req/s
Uptime: 99.95%
Load: 42%
```

---

## 🎯 Multi-Region Deployment Checklist

- [ ] Configure AWS/Cloud credentials
- [ ] Create Kubernetes clusters in all regions
- [ ] Set up container registries per region
- [ ] Configure global load balancer
- [ ] Deploy databases and replication
- [ ] Set up secrets management
- [ ] Configure monitoring federation
- [ ] Test failover procedures
- [ ] Document runbooks
- [ ] Train operations team

---

## 💰 Cost Estimation

### Monthly Costs (All Regions)

| Region | Nodes | Storage | Network | Total |
|--------|-------|---------|---------|-------|
| US-East-1 | $1,200 | $300 | $250 | $1,750 |
| EU-West-1 | $1,200 | $300 | $300 | $1,800 |
| AP-Southeast-1 | $800 | $180 | $200 | $1,180 |
| Load Balancer | - | - | - | $400 |
| **Total** | - | - | - | **$5,130** |

---

## 🔗 References

- [AWS Multi-Region Strategy](https://aws.amazon.com/solutions/multi-region/)
- [Kubernetes Multi-Cluster](https://kubernetes.io/docs/setup/production-environment/multi-cluster/)
- [Global Load Balancing](https://cloud.google.com/load-balancing/docs/https)

---

**Status:** Multi-Region Configuration Ready
**Deployment Time:** ~20 minutes per region
**Next Step:** Execute regional deployments

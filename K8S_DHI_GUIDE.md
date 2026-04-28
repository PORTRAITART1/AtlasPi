# Kubernetes Deployment & DHI Migration Guide - AtlasPi

## 🚀 Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (1.24+)
- kubectl configured
- Docker registry access

### Quick Deploy

```bash
# Apply all manifests
kubectl apply -f k8s-manifest.yaml

# Verify deployment
kubectl get all -n atlaspi

# Check pod status
kubectl get pods -n atlaspi -w

# View logs
kubectl logs -n atlaspi -f deployment/backend
kubectl logs -n atlaspi -f deployment/aiar-controller
```

### Accessing Services

```bash
# Port forward Backend
kubectl port-forward -n atlaspi svc/backend 3000:3000

# Port forward Prometheus
kubectl port-forward -n atlaspi svc/prometheus 9090:9090

# Check service endpoints
kubectl get endpoints -n atlaspi
```

### Scaling

```bash
# Manual scaling
kubectl scale deployment backend -n atlaspi --replicas=5
kubectl scale deployment aiar-controller -n atlaspi --replicas=3

# View HPA status
kubectl get hpa -n atlaspi
kubectl describe hpa backend-hpa -n atlaspi
```

### Updates & Rollouts

```bash
# Update image
kubectl set image deployment/backend backend=atlaspi-backend:1.1.0 -n atlaspi

# Check rollout status
kubectl rollout status deployment/backend -n atlaspi

# Rollback if needed
kubectl rollout undo deployment/backend -n atlaspi
```

---

## 🔐 Docker Hardened Images (DHI) Migration

### What is DHI?

Docker Hardened Images are pre-hardened base images with:
- ✅ Security patching applied
- ✅ Minimal attack surface
- ✅ Compliance with CIS benchmarks
- ✅ Regular updates

### Migration Steps

#### Step 1: Update Backend Dockerfile

**Before:**
```dockerfile
FROM node:18-alpine AS runtime
```

**After (DHI):**
```dockerfile
FROM docker.io/library/node:18-hardened AS runtime
```

#### Step 2: Update AIAR Dockerfile

**Before:**
```dockerfile
FROM python:3.11-slim AS runtime
```

**After (DHI):**
```dockerfile
FROM docker.io/library/python:3.11-hardened AS runtime
```

#### Step 3: Rebuild & Test

```bash
# Local test build
docker buildx bake -f docker-bake.hcl dev

# Push multi-arch to registry
docker buildx bake -f docker-bake.hcl --push
```

#### Step 4: Deploy Updated Images

```bash
kubectl set image deployment/backend backend=atlaspi-backend:1.0.0-dhi -n atlaspi
kubectl set image deployment/aiar-controller aiar=atlaspi-aiar:1.0.0-dhi -n atlaspi

# Monitor rollout
kubectl rollout status deployment/backend -n atlaspi
```

### DHI Benefits

| Aspect | Standard | DHI |
|--------|----------|-----|
| Security Patches | Manual | Auto |
| Base Image Size | ~150MB | ~140MB |
| CVE Fixes | Optional | Included |
| Compliance | None | CIS Level 2 |
| Support | Community | Docker Inc. |

---

## 📊 CI/CD Pipeline

### GitHub Actions Workflow

The pipeline (``.github/workflows/ci-cd.yml``) includes:

1. **Build & Push (Multi-Arch)**
   - Builds for amd64, arm64, arm/v7
   - Pushes to Docker registry
   - Caches layers for speed

2. **Security Scanning**
   - Trivy vulnerability scan
   - SARIF report upload
   - Block on critical issues

3. **Testing**
   - Unit tests
   - Integration tests
   - Health checks

4. **Deploy to Kubernetes**
   - kubectl apply manifests
   - Wait for rollout
   - Verify pods running

5. **Smoke Tests**
   - Endpoint health checks
   - Metrics verification
   - Error detection

### Setting Up CI/CD

#### 1. Add Docker Credentials to GitHub

```bash
# Go to: Settings → Secrets and variables → Actions
# Add:
DOCKER_USERNAME = your-username
DOCKER_PASSWORD = your-password-or-token
```

#### 2. Add Kubernetes Config

```bash
# Encode your kubeconfig
cat ~/.kube/config | base64 -w 0

# Add to GitHub Secrets as: KUBE_CONFIG
```

#### 3. Push to Trigger Pipeline

```bash
git add .
git commit -m "Deploy AtlasPi to production"
git push origin main
```

---

## 🎯 Monitoring & Observability

### Prometheus Metrics

```bash
# Port forward Prometheus
kubectl port-forward -n atlaspi svc/prometheus 9090:9090

# Visit: http://localhost:9090
```

### Key Metrics to Monitor

```
# Backend metrics
backend_requests_total
backend_request_duration_seconds
backend_errors_total

# AIAR metrics
aiar_decisions_total
aiar_autonomy_score
aiar_execution_time_seconds

# Pod metrics
pod_memory_usage_bytes
pod_cpu_usage_seconds_total
```

### Set Up Alerting

Create AlertManager rules (example):

```yaml
groups:
  - name: atlaspi
    rules:
      - alert: HighErrorRate
        expr: rate(backend_errors_total[5m]) > 0.05
        for: 5m
        
      - alert: PodCrashLooping
        expr: rate(kube_pod_container_status_restarts_total[1h]) > 5
        for: 5m
```

---

## 🔄 Disaster Recovery

### Backup Strategy

```bash
# Backup persistent data
kubectl get pvc -n atlaspi
kubectl create -f - <<EOF
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshot
metadata:
  name: aiar-backup
  namespace: atlaspi
spec:
  volumeSnapshotClassName: csi-hostpath-snapclass
  source:
    persistentVolumeClaimName: aiar-decisions
EOF
```

### Failover Testing

```bash
# Delete a pod and verify self-healing
kubectl delete pod -n atlaspi -l app=backend

# Watch pods restart
kubectl get pods -n atlaspi -w
```

### Multi-Region Deployment

```bash
# Apply same manifests to multiple clusters
for cluster in us-east us-west eu-west; do
  kubectl config use-context $cluster
  kubectl apply -f k8s-manifest.yaml
done
```

---

## 📈 Performance Tuning

### Resource Optimization

Update ``k8s-manifest.yaml``:

```yaml
resources:
  requests:
    memory: "256Mi"      # Min guaranteed
    cpu: "250m"          # Min CPU
  limits:
    memory: "512Mi"      # Max allowed
    cpu: "500m"          # Max CPU
```

### Horizontal Scaling

```bash
# Edit HPA for auto-scaling
kubectl edit hpa backend-hpa -n atlaspi

# Trigger scale test
kubectl apply -f - <<EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: load-test
spec:
  template:
    spec:
      containers:
      - name: load
        image: apache/ab
        command: ["ab", "-n", "10000", "-c", "100", "http://backend:3000/api/health"]
      restartPolicy: Never
EOF
```

---

## 🐛 Troubleshooting

### Pod Not Starting

```bash
# Check events
kubectl describe pod -n atlaspi <pod-name>

# View logs
kubectl logs -n atlaspi <pod-name>
kubectl logs -n atlaspi <pod-name> --previous  # If crashed
```

### Service Not Accessible

```bash
# Check service
kubectl get svc -n atlaspi backend

# Check endpoints
kubectl get endpoints -n atlaspi backend

# Test DNS
kubectl run -it --rm debug --image=alpine --restart=Never -- nslookup backend.atlaspi
```

### High Memory Usage

```bash
# Check pod memory
kubectl top pods -n atlaspi

# Increase limits if needed
kubectl set resources deployment backend -n atlaspi --limits=memory=1Gi
```

---

## 📚 References

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Hardened Images](https://docs.docker.com/trusted-content/hardened-images/)
- [GitHub Actions Docker](https://docs.docker.com/build/ci/github-actions/)
- [Prometheus Monitoring](https://prometheus.io/docs/)

---

**Status:** Production Ready for K8s Deployment

# Docker Bake Configuration - Multi-Arch Build Cloud Optimization
# Supports: linux/amd64, linux/arm64, linux/arm/v7 (Pi, M1, cloud)
# Deploy with: docker buildx bake -f docker-bake.hcl --push

variable "REGISTRY" {
  default = "docker.io"
}

variable "DOCKER_ORG" {
  default = "abdelouhhab"  # Replace with your Docker org
}

variable "VERSION" {
  default = "1.0.0"
}

variable "BUILD_DATE" {
  default = timestamp()
}

variable "VCS_REF" {
  default = "unknown"
}

# Backend Service Target
target "backend" {
  dockerfile = "backend/Dockerfile.optimized"
  tags = [
    "${REGISTRY}/${DOCKER_ORG}/atlaspi-backend:${VERSION}",
    "${REGISTRY}/${DOCKER_ORG}/atlaspi-backend:latest",
  ]
  platforms = ["linux/amd64", "linux/arm64", "linux/arm/v7"]
  args = {
    BUILD_DATE = BUILD_DATE
    VCS_REF    = VCS_REF
    VERSION    = VERSION
  }
  cache-from = ["type=registry,ref=${REGISTRY}/${DOCKER_ORG}/atlaspi-backend:buildcache"]
  cache-to   = ["type=registry,ref=${REGISTRY}/${DOCKER_ORG}/atlaspi-backend:buildcache,mode=max"]
  output     = ["type=registry"]
}

# AIAR Controller Target
target "aiar" {
  dockerfile = "aiar/Dockerfile"
  tags = [
    "${REGISTRY}/${DOCKER_ORG}/atlaspi-aiar:${VERSION}",
    "${REGISTRY}/${DOCKER_ORG}/atlaspi-aiar:latest",
  ]
  platforms = ["linux/amd64", "linux/arm64", "linux/arm/v7"]
  args = {
    BUILD_DATE = BUILD_DATE
    VCS_REF    = VCS_REF
    VERSION    = VERSION
  }
  cache-from = ["type=registry,ref=${REGISTRY}/${DOCKER_ORG}/atlaspi-aiar:buildcache"]
  cache-to   = ["type=registry,ref=${REGISTRY}/${DOCKER_ORG}/atlaspi-aiar:buildcache,mode=max"]
  output     = ["type=registry"]
}

# Prometheus Configuration (optional, for reference)
target "prometheus" {
  image = "prom/prometheus:latest"
  tags = [
    "${REGISTRY}/${DOCKER_ORG}/atlaspi-prometheus:${VERSION}",
  ]
}

# Combined multi-arch build (all services)
group "default" {
  targets = ["backend", "aiar"]
}

group "all" {
  targets = ["backend", "aiar", "prometheus"]
}

# Dev build (local, single platform)
target "backend-dev" {
  dockerfile = "backend/Dockerfile.optimized"
  tags = ["atlaspi-backend:dev"]
  platforms = ["linux/amd64"]
  cache-from = ["type=local"]
  cache-to   = ["type=local,dest=/tmp/buildcache"]
}

target "aiar-dev" {
  dockerfile = "aiar/Dockerfile"
  tags = ["atlaspi-aiar:dev"]
  platforms = ["linux/amd64"]
  cache-from = ["type=local"]
  cache-to   = ["type=local,dest=/tmp/buildcache"]
}

group "dev" {
  targets = ["backend-dev", "aiar-dev"]
}

# Multi-Stage Build: AIAR Controller (Agent IA Autonome Responsable)
# Optimized for Docker Build Cloud with DHI principles

FROM python:3.11-slim AS base
WORKDIR /app

# Security: create non-root user early
RUN groupadd -r aiar && useradd -r -g aiar aiar

# Install build dependencies (will be removed in final stage)
FROM base AS builder
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# ---

FROM base AS runtime

# Metadata
LABEL maintainer="aiar-agent"
LABEL org.opencontainers.image.description="AtlasPi AIAR - Agent IA Autonome Responsable"
LABEL org.opencontainers.image.source="https://github.com/your-repo"

# Copy only the compiled Python dependencies (no build tools)
COPY --from=builder /root/.local /home/aiar/.local

# Copy application code
COPY --chown=aiar:aiar agent.py config.yaml /app/

# Set Python path
ENV PATH=/home/aiar/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Agent Configuration
ENV AGENT_ID=aiar-prod-001
ENV AGENT_TYPE=ABA|AMB|ADAV|ASI
ENV AUTONOMY_LEVEL=80
ENV AGENT_MODE=autonomous
ENV BACKEND_URL=http://backend:3000
ENV PROMETHEUS_URL=http://prometheus:9090
ENV LOG_LEVEL=info
ENV LOG_FORMAT=json

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD python -c "import sys; sys.exit(0)" || exit 1

# Security: Drop all capabilities
RUN setcap -r /usr/bin/python3.11 2>/dev/null || true

# Use non-root user
USER aiar

EXPOSE 8000

CMD ["python", "agent.py"]

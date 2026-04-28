#!/usr/bin/env python3
"""
AIAR Agent Monitoring & Observability Module
Tracks build performance, deployment decisions, and resource metrics
"""

import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any
import subprocess
import os

class AIARMonitor:
    """Agent IA Autonome Responsable - Monitoring System"""
    
    def __init__(self, prometheus_url: str = "http://prometheus:9090", log_path: str = "/var/log/aiar"):
        self.prometheus_url = prometheus_url
        self.log_path = log_path
        self.metrics = {
            "builds": [],
            "deployments": [],
            "scaling_events": [],
            "decisions": []
        }
        os.makedirs(log_path, exist_ok=True)
    
    def log_decision(self, decision_type: str, reasoning: Dict, confidence: float, 
                    approval_required: bool, result: str = None) -> Dict:
        """Log autonomous decision with full audit trail"""
        decision = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "decision_id": f"dec_{int(time.time()*1000)}",
            "type": decision_type,
            "reasoning": reasoning,
            "confidence": confidence,
            "approval_required": approval_required,
            "approval_status": "escalated" if approval_required else "auto_approved",
            "result": result
        }
        self.metrics["decisions"].append(decision)
        self._write_audit_log(decision)
        return decision
    
    def log_build(self, image: str, platforms: List[str], duration_ms: int, 
                 cache_hit_rate: float, status: str, size_bytes: int = None) -> Dict:
        """Log build execution metrics"""
        build = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "build_id": f"bld_{int(time.time()*1000)}",
            "image": image,
            "platforms": platforms,
            "duration_ms": duration_ms,
            "cache_hit_rate": cache_hit_rate,
            "status": status,
            "size_bytes": size_bytes,
            "layer_count": None  # Will be populated from docker inspect
        }
        self.metrics["builds"].append(build)
        self._write_audit_log(build)
        return build
    
    def log_deployment(self, image: str, environment: str, deployment_id: str,
                      canary_duration_sec: int, canary_result: str, 
                      rollout_duration_sec: int, final_status: str) -> Dict:
        """Log autonomous deployment with canary validation"""
        deployment = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "deployment_id": deployment_id,
            "image": image,
            "environment": environment,
            "canary": {
                "duration_sec": canary_duration_sec,
                "result": canary_result,
                "metrics_delta": {
                    "p50_latency_percent": None,
                    "p99_latency_percent": None,
                    "error_rate_percent": None
                }
            },
            "rollout": {
                "duration_sec": rollout_duration_sec,
                "status": "success" if final_status == "success" else "failed"
            },
            "final_status": final_status
        }
        self.metrics["deployments"].append(deployment)
        self._write_audit_log(deployment)
        return deployment
    
    def log_scaling(self, service: str, replicas_before: int, replicas_after: int,
                   trigger: str, confidence: float, duration_ms: int) -> Dict:
        """Log auto-scaling decision and execution"""
        scaling = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "scaling_id": f"scl_{int(time.time()*1000)}",
            "service": service,
            "replicas_before": replicas_before,
            "replicas_after": replicas_after,
            "trigger": trigger,
            "confidence": confidence,
            "duration_ms": duration_ms
        }
        self.metrics["scaling_events"].append(scaling)
        self._write_audit_log(scaling)
        return scaling
    
    def get_build_stats(self, hours: int = 24) -> Dict:
        """Calculate build performance statistics"""
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        recent_builds = [b for b in self.metrics["builds"] 
                        if datetime.fromisoformat(b["timestamp"].replace("Z", "+00:00")) > cutoff]
        
        if not recent_builds:
            return {}
        
        durations = [b["duration_ms"] for b in recent_builds]
        cache_rates = [b["cache_hit_rate"] for b in recent_builds]
        
        return {
            "total_builds": len(recent_builds),
            "success_rate": len([b for b in recent_builds if b["status"] == "success"]) / len(recent_builds),
            "avg_duration_ms": sum(durations) / len(durations),
            "min_duration_ms": min(durations),
            "max_duration_ms": max(durations),
            "avg_cache_hit_rate": sum(cache_rates) / len(cache_rates),
            "total_data_transferred_gb": sum([b.get("size_bytes", 0) for b in recent_builds]) / (1024**3)
        }
    
    def get_decision_stats(self, hours: int = 24) -> Dict:
        """Calculate decision autonomy statistics"""
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        recent_decisions = [d for d in self.metrics["decisions"] 
                           if datetime.fromisoformat(d["timestamp"].replace("Z", "+00:00")) > cutoff]
        
        if not recent_decisions:
            return {}
        
        auto_approved = [d for d in recent_decisions if not d["approval_required"]]
        escalated = [d for d in recent_decisions if d["approval_required"]]
        
        return {
            "total_decisions": len(recent_decisions),
            "auto_approved_count": len(auto_approved),
            "escalated_count": len(escalated),
            "approval_rate_percent": (len(escalated) / len(recent_decisions)) * 100,
            "avg_confidence": sum([d["confidence"] for d in recent_decisions]) / len(recent_decisions),
            "decision_types": {t: len([d for d in recent_decisions if d["type"] == t]) 
                              for t in set(d["type"] for d in recent_decisions)}
        }
    
    def _write_audit_log(self, entry: Dict):
        """Write audit log entry to immutable log file"""
        log_file = os.path.join(self.log_path, "audit.log")
        with open(log_file, "a") as f:
            f.write(json.dumps(entry) + "\n")
    
    def generate_report(self) -> Dict:
        """Generate comprehensive AIAR performance report"""
        return {
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "agent_id": os.getenv("AGENT_ID", "aiar-prod-001"),
            "build_statistics": self.get_build_stats(24),
            "decision_statistics": self.get_decision_stats(24),
            "total_metrics_tracked": {
                "decisions": len(self.metrics["decisions"]),
                "builds": len(self.metrics["builds"]),
                "deployments": len(self.metrics["deployments"]),
                "scaling_events": len(self.metrics["scaling_events"])
            }
        }


if __name__ == "__main__":
    monitor = AIARMonitor()
    
    # Example: Log a parallel build decision
    monitor.log_decision(
        decision_type="PARALLEL_BUILD",
        reasoning={
            "queue_length": 2,
            "cache_hit_rate": 0.68,
            "platforms": ["amd64", "arm64", "armv7"],
            "estimated_time_parallel_min": 12,
            "estimated_time_sequential_min": 18
        },
        confidence=0.94,
        approval_required=False,
        result="success"
    )
    
    # Example: Log build execution
    monitor.log_build(
        image="atlaspi-backend:1.0.0",
        platforms=["linux/amd64", "linux/arm64"],
        duration_ms=21830,
        cache_hit_rate=0.72,
        status="success",
        size_bytes=218_000_000
    )
    
    # Generate report
    report = monitor.generate_report()
    print(json.dumps(report, indent=2))

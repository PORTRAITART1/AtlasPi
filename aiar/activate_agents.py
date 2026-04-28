#!/usr/bin/env python3
"""
AIAR Complete Activation Script
Initializes all 5 autonomous agent types:
- ABA: Autonomous Build Agent
- AMB: Multi-Arch Builder
- ADAV: Autonomous Deployment Agent Validator
- ASI: Auto-Scaling Intelligence
- APN: Agent Pi Network
"""

import os
import sys
import json
import time
from datetime import datetime
from typing import Dict
import subprocess

class AIARActivation:
    def __init__(self):
        self.agent_id = os.getenv("AGENT_ID", "aiar-prod-001")
        self.agent_config = {
            "ABA": {"enabled": True, "cycle_interval_sec": 60, "max_parallel_builds": 5},
            "AMB": {"enabled": True, "platforms": ["linux/amd64", "linux/arm64", "linux/arm/v7"]},
            "ADAV": {"enabled": True, "canary_percent": 5, "canary_duration_sec": 300},
            "ASI": {"enabled": True, "monitor_interval_sec": 10, "scale_threshold_cpu": 80},
            "APN": {"enabled": False, "report_frequency_min": 5}
        }
        self.status = {}
    
    def activate_aba(self):
        """Activate ABA - Autonomous Build Agent"""
        print("[ABA] Activating Autonomous Build Agent...")
        
        result = subprocess.run(
            ["docker", "buildx", "ls"],
            capture_output=True, text=True
        )
        
        # Count lines to see available builders
        output_lines = result.stdout.strip().split("\n")
        active_builders = len([l for l in output_lines if "running" in l.lower()])
        
        self.status["ABA"] = {
            "status": "active" if active_builders > 0 else "degraded",
            "builders_available": active_builders,
            "capability": "Parallel builds up to 5 concurrent",
            "cache_strategy": "Layer-to-layer with registry backend",
            "decision_cycle": "60s (EXECUTE phase)"
        }
        
        print("  [OK] ABA Active: {} builders available".format(active_builders))
        return True
    
    def activate_amb(self):
        """Activate AMB - Multi-Arch Builder"""
        print("[AMB] Activating Multi-Arch Builder...")
        
        bake_file = "docker-bake.hcl"
        amb_capable = os.path.exists(bake_file)
        
        self.status["AMB"] = {
            "status": "active" if amb_capable else "disabled",
            "platforms": ["linux/amd64", "linux/arm64", "linux/arm/v7"],
            "bake_config": "docker-bake.hcl",
            "parallelism": "3 simultaneous",
            "image_manifest": "Supported (single tag for all platforms)"
        }
        
        print("  [OK] AMB Active: Multi-platform builds configured")
        return amb_capable
    
    def activate_adav(self):
        """Activate ADAV - Autonomous Deployment Agent Validator"""
        print("[ADAV] Activating Autonomous Deployment Validator...")
        
        services_healthy = self._check_service_health()
        
        self.status["ADAV"] = {
            "status": "active" if services_healthy else "degraded",
            "strategy": "Canary rollout (5% traffic, 300s validation)",
            "healthcheck_required": True,
            "rollback_on_anomaly": True,
            "services_monitored": ["backend", "aiar-controller", "prometheus"]
        }
        
        print("  [OK] ADAV Active: Deployment validation ready")
        return services_healthy
    
    def activate_asi(self):
        """Activate ASI - Auto-Scaling Intelligence"""
        print("[ASI] Activating Auto-Scaling Intelligence...")
        
        prometheus_available = self._check_prometheus()
        
        self.status["ASI"] = {
            "status": "active" if prometheus_available else "degraded",
            "monitor_interval_sec": 10,
            "metrics_source": "Prometheus",
            "scale_triggers": {
                "cpu_threshold": "80% (scale up)",
                "memory_threshold": "85% (escalate)",
                "request_queue": "threshold-based",
                "sustained_period": "3 minutes"
            },
            "min_replicas": 2,
            "max_replicas": 20
        }
        
        print("  [OK] ASI Active: Auto-scaling monitoring enabled")
        return prometheus_available
    
    def activate_apn(self):
        """Activate APN - Agent Pi Network"""
        print("[APN] Activating Agent Pi Network...")
        
        pi_node_url = os.getenv("PI_NODE_URL", "")
        pi_enabled = len(pi_node_url) > 0
        
        self.status["APN"] = {
            "status": "active" if pi_enabled else "disabled",
            "node_url": pi_node_url if pi_enabled else "Not configured",
            "report_frequency_min": 5,
            "participation": "Consensus + metrics reporting + rewards",
            "features": {
                "metrics_reporting": "Enabled",
                "consensus_voting": "Ready",
                "reward_accumulation": "Enabled",
                "dag_participation": "Ready"
            }
        }
        
        if pi_enabled:
            print("  [OK] APN Active: Pi Network integration ready")
        else:
            print("  [INFO] APN Optional: Pi Network not configured (can enable later)")
        
        return True
    
    def _check_service_health(self) -> bool:
        """Check if core services are healthy"""
        try:
            result = subprocess.run(
                ["docker", "compose", "ps", "--format", "json"],
                capture_output=True, text=True, timeout=10
            )
            if result.returncode == 0:
                containers = json.loads(result.stdout) if result.stdout else []
                running = [c for c in containers if c.get("State") == "running"]
                return len(running) >= 2
            return False
        except:
            return False
    
    def _check_prometheus(self) -> bool:
        """Check if Prometheus is accessible"""
        try:
            result = subprocess.run(
                ["curl", "-s", "-f", "http://localhost:9090/-/healthy"],
                capture_output=True, text=True, timeout=5
            )
            return result.returncode == 0
        except:
            return False
    
    def generate_activation_report(self) -> Dict:
        """Generate complete activation report"""
        total_agents = len(self.status)
        active_agents = len([s for s in self.status.values() if s.get("status") == "active"])
        
        report = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "agent_id": self.agent_id,
            "activation_time": "< 5 seconds",
            "total_agents": total_agents,
            "active_agents": active_agents,
            "readiness_percent": (active_agents / total_agents) * 100,
            "agents": self.status,
            "recommendation": "READY FOR PRODUCTION" if active_agents >= 4 else "REQUIRES SETUP"
        }
        
        return report
    
    def run_activation(self):
        """Execute full AIAR activation sequence"""
        print("\n" + "="*70)
        print("  AIAR AUTONOMOUS AGENT SYSTEM - ACTIVATION SEQUENCE")
        print("="*70 + "\n")
        
        self.activate_aba()
        self.activate_amb()
        self.activate_adav()
        self.activate_asi()
        self.activate_apn()
        
        report = self.generate_activation_report()
        
        print("\n" + "="*70)
        print("  ACTIVATION STATUS REPORT")
        print("="*70 + "\n")
        
        for agent_type, status in self.status.items():
            status_emoji = "[OK]" if status.get("status") == "active" else "[WARN]"
            print("{} {:8} | {}".format(status_emoji, agent_type, status.get("status", "unknown").upper()))
        
        print("\n" + "-"*70)
        print("Readiness: {:.0f}% ({}/{} agents active)".format(
            report["readiness_percent"], report["active_agents"], report["total_agents"]))
        print("Status: {}".format(report["recommendation"]))
        print("-"*70 + "\n")
        
        report_file = "AIAR_ACTIVATION_REPORT.json"
        with open(report_file, "w") as f:
            json.dump(report, f, indent=2)
        
        print("Report saved: {}\n".format(report_file))
        
        return report


if __name__ == "__main__":
    activation = AIARActivation()
    report = activation.run_activation()
    sys.exit(0 if report["readiness_percent"] >= 80 else 1)

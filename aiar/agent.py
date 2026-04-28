#!/usr/bin/env python3
"""
AIAR - Agent IA Autonome Responsable
Main orchestrator for autonomous decisions
"""

import os
import sys
import json
import time
import logging
from datetime import datetime
from typing import Dict, Any
import requests
import subprocess

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("AIAR")

class AIARAgent:
    """Autonomous Intelligent Agent - Responsible"""
    
    def __init__(self):
        self.agent_id = os.getenv('AGENT_ID', 'aiar-prod-001')
        self.autonomy_level = int(os.getenv('AUTONOMY_LEVEL', '80'))
        self.backend_url = os.getenv('BACKEND_URL', 'http://backend:3000')
        self.prometheus_url = os.getenv('PROMETHEUS_URL', 'http://prometheus:9090')
        
        # Decision tracking
        self.decisions = []
        self.metrics = {}
        
        logger.info(f"AIAR Agent initialized: {self.agent_id} (autonomy: {self.autonomy_level}%)")
    
    def perceive(self) -> Dict[str, Any]:
        """
        PERCEPTION LOOP (10s interval)
        Monitor: backend health, resources, metrics
        """
        logger.info("=== PERCEIVE CYCLE ===")
        
        perception = {
            "timestamp": datetime.utcnow().isoformat(),
            "backend_health": None,
            "docker_stats": None,
            "anomalies": []
        }
        
        # Check backend health
        try:
            resp = requests.get(f"{self.backend_url}/api/health", timeout=5)
            perception["backend_health"] = resp.json() if resp.status_code == 200 else "UNHEALTHY"
            logger.info(f"✓ Backend health: OK")
        except Exception as e:
            perception["backend_health"] = "UNREACHABLE"
            perception["anomalies"].append(f"Backend unreachable: {str(e)}")
            logger.warning(f"✗ Backend unreachable: {e}")
        
        # Check Docker stats
        try:
            result = subprocess.run(
                ['docker', 'stats', '--no-stream', '--format', 'json'],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                stats = json.loads(result.stdout)
                perception["docker_stats"] = stats
                logger.info(f"✓ Docker stats: {len(stats)} containers")
        except Exception as e:
            logger.warning(f"Docker stats unavailable: {e}")
        
        logger.info(f"Perception complete. Anomalies: {len(perception['anomalies'])}")
        return perception
    
    def decide(self, perception: Dict[str, Any]) -> Dict[str, Any]:
        """
        DECISION LOOP (30s interval)
        Analyze: conditions, rules, confidence
        """
        logger.info("=== DECIDE CYCLE ===")
        
        decision = {
            "decision_id": f"dec_{int(time.time())}",
            "timestamp": datetime.utcnow().isoformat(),
            "type": "MONITOR",
            "action": "CONTINUE",
            "confidence": 0.95,
            "risk_level": "LOW",
            "approval_required": False,
            "reasoning": ""
        }
        
        # Rule 1: Backend health check
        if perception["backend_health"] == "UNHEALTHY":
            decision["type"] = "HEALTH_ALERT"
            decision["action"] = "ESCALATE"
            decision["risk_level"] = "CRITICAL"
            decision["approval_required"] = True
            decision["reasoning"] = "Backend is unhealthy"
            decision["confidence"] = 1.0
            logger.warning(f"⚠ CRITICAL: Backend unhealthy")
        
        # Rule 2: Anomalies detected
        elif len(perception["anomalies"]) > 0:
            decision["type"] = "ANOMALY_DETECTED"
            decision["action"] = "MONITOR"
            decision["risk_level"] = "MEDIUM"
            decision["approval_required"] = False
            decision["reasoning"] = f"Detected {len(perception['anomalies'])} anomalies"
            decision["confidence"] = 0.85
            logger.info(f"ℹ MEDIUM: Anomalies detected: {perception['anomalies']}")
        
        # Default: Everything normal
        else:
            decision["type"] = "NORMAL_OPERATION"
            decision["action"] = "CONTINUE"
            decision["risk_level"] = "LOW"
            decision["approval_required"] = False
            decision["reasoning"] = "System operating normally"
            decision["confidence"] = 0.99
            logger.info("✓ LOW: System normal")
        
        # Auto-approve if low risk and autonomy allows
        if decision["risk_level"] == "LOW" and self.autonomy_level >= 80:
            decision["auto_approved"] = True
            logger.info(f"✓ Auto-approved (confidence: {decision['confidence']})")
        
        self.decisions.append(decision)
        return decision
    
    def execute(self, decision: Dict[str, Any]) -> Dict[str, Any]:
        """
        EXECUTION LOOP (60s interval)
        Execute: approved actions, validate, audit
        """
        logger.info("=== EXECUTE CYCLE ===")
        
        execution = {
            "decision_id": decision["decision_id"],
            "timestamp": datetime.utcnow().isoformat(),
            "status": "SUCCESS",
            "duration_ms": 0,
            "result": None
        }
        
        start = time.time()
        
        if decision["action"] == "CONTINUE":
            execution["result"] = "Monitoring continues"
            execution["status"] = "SUCCESS"
            logger.info("✓ Execution: CONTINUE")
        
        elif decision["action"] == "MONITOR":
            execution["result"] = "Enhanced monitoring active"
            execution["status"] = "SUCCESS"
            logger.info("✓ Execution: MONITOR")
        
        elif decision["action"] == "ESCALATE":
            execution["result"] = "Alert escalated to human"
            execution["status"] = "ESCALATED"
            logger.error("✗ Execution: ESCALATED to human")
        
        else:
            execution["result"] = "Unknown action"
            execution["status"] = "FAILED"
            logger.warning("✗ Execution: FAILED")
        
        execution["duration_ms"] = int((time.time() - start) * 1000)
        
        # Audit log
        self.audit_log(execution)
        
        return execution
    
    def audit_log(self, execution: Dict[str, Any]):
        """Log execution to audit trail"""
        audit_entry = {
            "agent_id": self.agent_id,
            "timestamp": datetime.utcnow().isoformat(),
            "execution": execution
        }
        
        logger.info(f"AUDIT: {json.dumps(audit_entry)}")
    
    def run_cycle(self):
        """Run one complete PERCEIVE -> DECIDE -> EXECUTE cycle"""
        try:
            # Perception (10s)
            perception = self.perceive()
            time.sleep(1)
            
            # Decision (30s)
            decision = self.decide(perception)
            time.sleep(1)
            
            # Execution (60s)
            if decision["auto_approved"] or not decision["approval_required"]:
                execution = self.execute(decision)
            else:
                logger.warning(f"Decision {decision['decision_id']} requires human approval")
        
        except Exception as e:
            logger.error(f"Cycle failed: {e}")
    
    def run_forever(self):
        """Run agent continuously"""
        logger.info(f"Starting AIAR infinite loop...")
        
        cycle_count = 0
        while True:
            cycle_count += 1
            logger.info(f"\n{'='*60}")
            logger.info(f"CYCLE {cycle_count} - {datetime.utcnow().isoformat()}")
            logger.info(f"{'='*60}")
            
            self.run_cycle()
            
            # Wait 60 seconds before next cycle
            logger.info("Sleeping 60 seconds...")
            time.sleep(60)

def main():
    agent = AIARAgent()
    
    # Health endpoint for Docker
    logger.info("AIAR Agent ready. Starting autonomous loops...")
    
    try:
        agent.run_forever()
    except KeyboardInterrupt:
        logger.info("AIAR Agent shutting down...")
        sys.exit(0)

if __name__ == "__main__":
    main()

<div align="center">

# 🛡️ IncidentMind-AI
### Autonomous SRE War Room & Cyber Range Incident Simulator

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-IncidentMind--AI-0ea5e9?style=for-the-badge&logo=google-cloud&logoColor=white)](https://ais-pre-fhbb4gxczzq4wpiu6qo5xc-216312400098.us-east1.run.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![AI Engine](https://img.shields.io/badge/AI_Engine-Gemini_3.8_Flash-8b5cf6?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Stack](https://img.shields.io/badge/Stack-React_19_|_TypeScript_|_Tailwind_v4-f43f5e?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)

<p align="center">
  <b>A Gamified, High-Stakes SRE Cockpit & Cyber Range testing engineers against cascading production outages, zero-day exploits, and distributed system failures under real-time financial penalties.</b>
</p>

[🌐 Launch Live Simulator](https://ais-pre-fhbb4gxczzq4wpiu6qo5xc-216312400098.us-east1.run.app/) • [📑 Technical Whitepaper](https://ais-pre-fhbb4gxczzq4wpiu6qo5xc-216312400098.us-east1.run.app/whitepaper.pdf) • [🎯 Key Features](#-key-features) • [🏗️ Architecture](#️-system-architecture)

---

</div>

## 📌 Executive Summary

In enterprise cloud infrastructures, a single **Sev-1 outage or cybersecurity breach costs upwards of $300,000/hour** in lost transactions, regulatory fines, and SLA breaches. Traditional incident runbooks are dry and passive, failing to prepare engineers for the cognitive pressure of live triage.

**IncidentMind-AI** bridges this gap by immersing engineering teams in a real-time **SOC War Room**. Powered by **Google Gemini 3.8 Flash**, the simulator generates cascading telemetry, authentic bash/k8s terminal diagnostics, cross-team bridge reactions, and publication-ready **Blameless Root Cause Analyses (RCA)**.

---

## ⚡ Core Operational Features

### 1. 📊 Live SRE Telemetry & Golden Signals
- **Composite System Health Gauge:** Dynamic health percentage factoring latency, saturation, and error rates.
- **Resource Saturation:** Real-time tracking of CPU %, RAM %, and DB Connection Pool capacity (1000/1000).
- **Latency & Error Tracking:** Tail `p99` latency spikes (ms) and HTTP `5xx` error rates.
- **Live SLA Financial Burn Rate:** Ticking dollar counter calculating real-time financial loss ($/min).

### 2. 🗺️ Dynamic Architecture Topology Map
- Real-time visual network graph displaying node statuses across:
  - `Edge CDN & WAF` ➔ `ALB Ingress Controller` ➔ `Core API Microservices` ➔ `Database Cluster` ➔ `Redis Cache`.
  - Visual pulsing states: `Healthy (Green)`, `Degraded (Amber)`, and `Failing (Rose)`.

### 3. 🎯 Multi-Stage Tactical Decision Matrix
- Branching dilemmas with concrete risk badges (`Low`, `Medium`, `High`) and expected operational trade-offs.
- **Free-Text Custom Action Evaluator:** Engineers can enter custom bash commands or architecture strategies for real-time Gemini evaluation of blast radius and collateral damage.

### 4. 💻 Interactive Bastion CLI & Live Syslog Stream
- Dedicated Linux/Kubernetes terminal supporting instant execution of:
  - `kubectl get pods -A`, `kubectl top pods`, `netstat -tulpn`, `dmesg | grep oom`, `curl -Iv /healthz`, `free -m`, `tail -n 20 error.log`.
- Colorized syslog stream filtering across `[CRIT]`, `[ERROR]`, `[WARN]`, and `[INFO]`.

### 5. 👥 Simulated Incident Bridge (#war-room-incident)
- Realistic communication stream with synthetic operational roles:
  - **Sarah (SRE Lead):** Telemetry verification and runbook execution.
  - **Alex (SecOps):** Perimeter containment and threat intelligence.
  - **DevOps Engineer & VP of Engineering:** Stakeholder escalations and customer comms.

### 6. 📑 Publication-Grade Blameless Post-Mortem (RCA)
- **Incident Scorecard:** Automatic computation of MTTD, MTTA, MTTR, and SLA breach indicators.
- **The 5 Whys Methodology:** Deep traversal from immediate symptoms to architectural root causes.
- **Action Items Matrix:** Auto-generated `P0` (24h hotfix), `P1` (architecture hardening), and `P2` (chaos testing) tasks with assigned owners.
- **Markdown & PDF Export:** One-click clipboard copy or high-resolution PDF download.

---

## 🗂️ Built-In Production Incident Library

| Code | Incident Title | Severity | Impacted Architecture | Tactical Dilemma |
| :--- | :--- | :---: | :--- | :--- |
| **SC-01** | **DDoS & Ingress Saturation** | `Sev-1` | K8s, NGINX Ingress, ALB | 480k req/s HTTP/2 flood overwhelming edge ingress controllers. |
| **SC-02** | **SQL Injection & Data Exfiltration** | `Sev-1` | PostgreSQL 16, Spring Boot | UNION SELECT exfiltration dumping customer vaults via exposed API. |
| **SC-03** | **DB Connection Pool Exhaustion** | `Sev-1` | PostgreSQL Aurora, PgBouncer | Deadlocks on inventory tables exhausting pool and cascading pod crashes. |
| **SC-04** | **Compromised IAM Keys & Mining** | `Sev-2` | AWS IAM, EKS, GuardDuty | Leaked Root key launching rogue GPU instances across foreign regions. |
| **SC-05** | **Cascading Circuit Breaker Collapse** | `Sev-1` | Go Microservices, Envoy, Kafka | Third-party Stripe gateway timeout hanging thread pools across 18 services. |
| **SC-06** | **Ransomware Lateral Movement in VPC** | `Sev-1` | Ubuntu Linux, AWS EFS, SIEM | Attacker hopping through staging bastion to encrypt shared EFS volumes. |

---

## 🏗️ System Architecture

```mermaid
graph TD
    Client["💻 Client Frontend (React 19 + Vite 8)"] -->|Sub-16ms Telemetry| HUD["📊 Telemetry & HUD State Machine"]
    Client -->|Tactical Actions| Server["⚙️ Node.js / Express Backend"]
    
    subgraph "Dual-Layer AI Engine"
        Server -->|Primary| M1["🧠 Gemini 3.8 Flash"]
        M1 -.->|Failover 429| M2["⚡ Gemini Flash Latest"]
        M2 -.->|Failover 429| M3["🔹 Gemini 3.1 Flash Lite"]
        M3 -.->|Offline/Quota Exhausted| M4["🛡️ Deterministic SRE Engine"]
    end
    
    Server -->|Instant Terminal| CLI["💻 Deterministic Bastion CLI Emulator"]
    Server -->|RCA Extraction| RCA["📑 5 Whys & Blameless Post-Mortem"]
    Client -->|Tactical Sound Synth| Audio["🔊 Web Audio API Synthesizer"]

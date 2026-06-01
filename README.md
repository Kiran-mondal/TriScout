# 🛰️ TriScout (v2.0.0)

TriScout is a powerful, modular, and polyglot cybersecurity framework built for comprehensive network reconnaissance. By combining the raw speed of **Go**, the analytical power of **Python**, and the real-time visualization capabilities of **Node.js**, TriScout offers a seamless pipeline from low-level packet scanning to high-level security insights.

Whether you are a security researcher, penetration tester, or DevOps engineer, TriScout provides an open-source, developer-friendly ecosystem to discover assets and map attack surfaces instantly.

---

## 🚀 New in v2.0.0 (Latest Update)

We have graduated from local-only scanning to an enterprise-grade recon suite!

* **Unified Automation:** Run the entire scanner-to-dashboard pipeline using a single root script (`run_all.sh`).
* **Centralized Profile Infrastructure:** Moved pipeline configurations into a decoupled root `config.json`.
* **Remote Target Scanning:** Scan domains, CIDR blocks, and remote IP ranges directly from the CLI.
* **Multi-Format Export Engine:** Python processor now generates clean **CSV** and **PDF** reports alongside JSON.
* **Secure Middleware Architecture:** Integrated JWT-based authentication via dedicated middleware layers to lock down the real-time web console.
* **Live WebSockets Display:** Replaced polling with active, asynchronous WebSocket streams rendering an updated, high-fidelity SOC dashboard view.

---

## 📌 Core Features

* **⚡ Blazing Fast Concurrency:** Leverages Go’s native goroutines and sync pools to scan thousands of ports per second safely.
* **🧠 Intelligent Data Enrichment:** Python backend automatically correlates open ports with known service definitions and local signature risks.
* **🌐 Real-Time Web Dashboard:** A sleek, responsive Node.js/Express interface featuring dynamic charts, live scan logs, and credential-secured views.
* **🧩 Language-Agnostic Modularity:** Every component communicates via standardized JSON contracts, allowing you to swap out any layer (e.g., swapping the Go scanner for a Rust scanner) effortlessly.

---

## 📁 Project Structure

```text
TriScout/
├── go_scanner/             # Go concurrent port scanner (CLI tool)
│   ├── scanner.go          # Main scanning logic
│   └── results.json        # Raw intermediate scan buffer
├── python_processor/       # Python vulnerability & data enrichment engine
│   ├── processor.py        # Enrichment & reporting script
│   └── processed.json      # Enriched JSON data contract
├── web_dashboard/          # Node.js + Express web dashboard
│   ├── middleware/
│   │   └── auth.js         # JWT Route & WebSocket protection middleware
│   ├── views/
│   │   └── index.html      # Dark-themed real-time SOC interface
│   ├── server.js           # Express & WebSockets server backend
│   └── processed.json      # Synced dashboard data file
├── config.json             # Decoupled project profile settings
├── run_all.sh              # Orchestration shell script to run the whole stack
├── LICENSE                 # MIT License file
└── README.md               # Documentation

```
## 🛠️ Quick Setup & Execution
### Prerequisites
Ensure your local system has the following runtimes installed:
 * Go Engine (1.18+)
 * Python Runtime (3.8+)
 * Node.js Environment (16+)
### 1. Clone the Repository
```bash
git clone https://github.com/Kiran-mondal/TriScout.git
cd TriScout

```
### 2. Automated Run (Recommended)
You can spin up the Go scanner, compile the Python enrichment layer, and initialize the Node.js backend using the automated orchestration script:
```bash
chmod +x run_all.sh
./run_all.sh -target 192.168.1.1 -ports 1-1024 -format pdf

```
*Available export formats include:* json | csv | pdf *(Requires reportlab for advanced styling; defaults gracefully to clean TXT formatting if missing).* 
### 3. Manual Step-by-Step Execution
#### Step A: Run the Go Scanner
```bash
cd go_scanner
go build -o triscout-scan scanner.go
./triscout-scan -target 192.168.1.1 -ports 1-1024

```
#### Step B: Enrich Data with Python
```bash
cd ../python_processor
python3 processor.py ../go_scanner/results.json pdf

```
#### Step C: Launch the Authenticated Web Dashboard
```bash
cd ../web_dashboard
npm install
node server.js

```
 * **View Results:** Open your browser to http://localhost:3000
 * **Default Credentials:** admin / triscout2026 *(Change this inside server.js or configure environment variables for deployment).*
## 📄 Data Pipeline Schema
TriScout relies on strict JSON integrity contracts between individual language modules:
### results.json (Go Output)
```json
{
  "target": "192.168.1.1",
  "scan_time": "2026-06-01T11:09:31Z",
  "open_ports": [22, 80]
}

```
### processed.json (Python Enriched Output)
```json
{
  "target": "192.168.1.1",
  "scan_time": "2026-06-01T11:09:31Z",
  "vulnerabilities_found": true,
  "ports": [
    { "port": 22, "service": "SSH", "severity": "Low", "notes": "Ensure key-based auth is enforced." },
    { "port": 80, "service": "HTTP", "severity": "Medium", "notes": "Unencrypted traffic. Consider upgrading to SSL." }
  ]
}

```
## 🔍 Technology Stack & Dependencies
 * **Go Engine:** Native net, fmt, os, sync, flag, encoding/json
 * **Python Engine:** Native json, sys, os, csv *(Optional: reportlab for PDF canvas parsing)*
 * **Node.js Dashboard:** express, ws (WebSockets), jsonwebtoken (Security Isolation)
## 🧑‍💻 Core Contributor
**Kiran “Babai” Mondal**
 * **GitHub:** https://github.com/Kiran-mondal
 * **Role:** Lead Full-Stack Security Tools Developer
 * **Expertise:** Python | Go | Node.js | Defensive Cyber Architecture | Recon Frameworks
## 🎯 Next on the Roadmap
 * [ ] Integration with active banner grabbing (grabbing SSH/HTTP headers directly from Go).
 * [ ] Webhook integrations (Slack/Discord alerts upon scan completion).
 * [ ] Dockerized deployment via a single docker-compose up flow.
## ⚖️ License & Legal Disclaimer
TriScout is open-source software licensed under the **MIT License**. Use it, tweak it, commercialize it—just keep the original copyright notice.
> ⚠️ **Disclaimer:** This framework is designed for educational purposes, authorized penetration testing, and legitimate network defense audits only. Scanning targets without prior explicit written consent is illegal in most jurisdictions. The contributors assume no liability for misuse or damage caused by this utility.

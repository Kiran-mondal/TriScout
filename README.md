<div align="center">
  <img src="public/logo.svg" alt="TriScout Logo" width="250" hight="250" />
  
  <h1>🛰️ TriScout</h1>

  <img src="https://img.shields.io/badge/Go-1.18+-00ADD8?style=flat&logo=go" alt="Go Version">
  <img src="https://img.shields.io/badge/Python-3.8+-3776AB?style=flat&logo=python" alt="Python Version">
  <img src="https://img.shields.io/badge/Node.js-16+-339933?style=flat&logo=nodedotjs" alt="Node.js Version">
  <img src="https://img.shields.io/badge/Status-Active-success.svg" alt="Status">
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License">
</div>

<br>

<p align="center">
  A fast, modular cybersecurity framework for network reconnaissance built with <strong>Go</strong>, <strong>Python</strong>, and <strong>Node.js</strong>.
</p>

---

## 🚀 Features

- **⚡ Fast Port Scanning:** Concurrent scanning with Go goroutines
- **🧠 Smart Data Enrichment:** Python-powered vulnerability detection
- **🌐 Real-Time Dashboard:** Node.js web interface with live results
- **📊 Multi-Format Reports:** Export as JSON, CSV, or PDF
- **🔒 Secure Access:** JWT-based authentication

## 📁 Project Structure

```
TriScout/
├── go_scanner/        # Port scanner (Go)
├── python_processor/  # Data enrichment (Python)
├── web_dashboard/     # Web interface (Node.js)
├── config.json        # Configuration file
├── run_all.sh         # Orchestration script
└── README.md          # Documentation
```

## ⚙️ Prerequisites

- **Go** 1.18+
- **Python** 3.8+
- **Node.js** 16+

## 🏃 Quick Start

### Clone the Repository
```bash
git clone https://github.com/Kiran-mondal/TriScout.git
cd TriScout
```

### Run Everything at Once
```bash
chmod +x run_all.sh
./run_all.sh -target 192.168.1.1 -ports 1-1024 -format pdf
```
## 🔧 Technology Stack

- **Go:** Concurrent scanning, networking
- **Python:** Data enrichment, reporting
- **Node.js:** Express server, WebSockets, JWT auth

## 📄 Data Flow

1. **Go Scanner** → `results.json` (raw ports)
2. **Python Processor** → `processed.json` (enriched data)
3. **Web Dashboard** → Display and export reports

## 👨‍💻 Author

**Kiran Mondal**  
GitHub: https://github.com/Kiran-mondal

## 📋 Roadmap

- [ ] Banner grabbing
- [ ] Slack/Discord alerts
- [ ] Docker support

## ⚖️ License

MIT License - See LICENSE file for details

---

**⚠️ Disclaimer:** This tool is for authorized testing and educational purposes only. Always obtain explicit permission before scanning networks.

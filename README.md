<div align="center">
  <img src="public/logo.svg" alt="TriScout Logo" width="250" hight="250" />
  
  <h1>TriScout</h1>

  <img src="https://img.shields.io/badge/Go-1.18+-00ADD8?style=flat&logo=go" alt="Go Version" style="width: 200px;"/>
  <img src="https://img.shields.io/badge/Python-3.8+-3776AB?style=flat&logo=python" alt="Python Version" style="width: 200px;"/>
  <img src="https://img.shields.io/badge/Node.js-16+-339933?style=flat&logo=nodedotjs" alt="Node.js Version" style="width: 200px;"/>
  <img src="https://img.shields.io/badge/Status-Active-success.svg" alt="Status" style="width: 200px;"/>
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License" style="width: 200px;" />

  
<a href="https://www.uneed.best/tool/triscout" target="_blank" rel="noopener">
  <img src="https://www.uneed.best/EMBED3.png" alt="Launching Soon on Uneed" style="width: 250px;" />
</a>

</div>

<br>

<p align="center">
  A fast, modular cybersecurity framework for network reconnaissance built with <strong>Go</strong>, <strong>Python</strong>, and <strong>Node.js</strong>.
</p>

<p align="center">
  <strong>Live Website:</strong> <a href="https://triscout.quarry.dpdns.org/dashboard#recon">https://triscout.quarry.dpdns.org/dashboard#recon</a>
</p>

---

## 🚀 Features

- **⚡ Fast Port Scanning:** Concurrent scanning with Go goroutines
- **🧠 Smart Data Enrichment:** Python-powered vulnerability detection
- **🌐 Real-Time Dashboard:** Node.js web interface with live results
- **📊 Multi-Format Reports:** Export as JSON, CSV, or PDF
- **🔒 Secure Access:** JWT-based authentication

## 📁 Project Structure

```text
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

## 🌐 Project Website

This project is available as a live website at:

https://triscout.quarry.dpdns.org/dashboard#recon

This repository is intended for authorized security testing, research, and learning only. It is not a public offensive toolkit and must not be used for unauthorized scanning, intrusion, or malicious activity.

## ⚠️ Responsible Use Notice

This project is provided for legitimate security research, defensive testing, and educational purposes only. It must only be used on systems and networks where you have explicit authorization to test.

By installing, running, or modifying this project, you acknowledge that you are solely responsible for ensuring lawful and ethical use. The creator and contributors are not liable for misuse, abuse, or any harmful activity conducted with this code or any deployed instance of the project.

Any use that violates local laws, network policies, privacy expectations, or third-party rights is strictly prohibited.

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

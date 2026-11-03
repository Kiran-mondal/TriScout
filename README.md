<div align="center">
  <img src="public/logo.svg" alt="TriScout Logo" width="220" height="220" />
  <h1>TriScout</h1>
  <p>
    <strong>Defensive reconnaissance and security auditing toolkit</strong>
  </p>
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?style=flat&logo=nodedotjs" alt="Node.js 18+" />
  <img src="https://img.shields.io/badge/Go-1.20%2B-00ADD8?style=flat&logo=go" alt="Go 1.20+" />
  <img src="https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat&logo=python" alt="Python 3.10+" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License" />
</div>

TriScout is a defensive cybersecurity reconnaissance project designed to audit public-facing web assets, detect common security misconfigurations, and surface risky exposures in a structured, developer-friendly workflow. It combines a web dashboard, Go-powered scanning engine, and Python-based enrichment pipeline to help security teams assess HTTP security posture, leaked secrets, and visible infrastructure information.

This repository is intended for legitimate security research, defensive testing, and educational use on systems you are explicitly authorized to assess.

---

## Overview

TriScout helps identify:

- security header issues such as HSTS, CSP, X-Frame-Options, and related browser protections
- exposed credentials or secrets in public source output or obvious leak points
- basic infrastructure exposure through port and service reconnaissance
- risky information in scan results that can be reviewed from a browser dashboard or exported for reporting

The project is split into multiple coordinated components:

- `web_dashboard/` — Node.js/Express dashboard and application logic
- `api/` — backend processing services written in Go and Python
- `go_scanner/` — scanner implementation for port and surface discovery
- `python_processor/` — result enrichment and output formatting
- `public/` — frontend/static assets and branding
- `run_all.sh` — end-to-end runner for the scanning pipeline

---

## Features

- Passive web reconnaissance workflow for public targets
- Security posture evaluation against common browser and HTTP controls
- Leak detection checks for obvious credential and token patterns
- Multi-step scanning pipeline with Go-based collection and Python-based post-processing
- Browser-based dashboard for reviewing findings
- Export-friendly workflow for JSON, CSV, and similar report formats
- Ethical guardrails to prevent scanning of restricted private or loopback ranges

---

## Repository Structure

```text
TriScout/
├── api/                  # Go/Python-backed processing services
├── go_scanner/           # Scanner logic and results generation
├── python_processor/     # Enrichment and processing pipeline
├── public/               # Static UI assets, branding, and front-end resources
├── web_dashboard/        # Express dashboard and application flow
├── .gitignore
├── LICENSE
├── README.md
├── SECURITY.md
├── config.json
├── joke-generator.js
├── package.json
├── run_all.sh
├── vercel.json
├── pnpm-lock.yaml
└── ...
```

---

## Prerequisites

Before running the project, ensure you have:

- Node.js 18+
- Go 1.20+
- Python 3.10+
- npm (for the dashboard)
- a target that you are explicitly authorized to assess

---

## Quick Start

### 1) Install dashboard dependencies

```bash
npm install
```

### 2) Start the dashboard

```bash
npm start
```

The app is configured to serve the dashboard through the Node.js server defined in `web_dashboard/server.js`.

### 3) Run the full scanning pipeline

```bash
chmod +x run_all.sh
./run_all.sh -target example.com -ports 1-1024 -format json
```

This script performs the pipeline flow:

1. run the Go scanner
2. process results with Python
3. copy the processed data into the dashboard
4. launch the web dashboard locally

---

## Local Dashboard Access

The included automation script notes a local dashboard endpoint:

```text
http://localhost:3000
```

The project configuration also identifies the dashboard port as `3000` and default local credentials are documented in the pipeline helper as:

```text
admin / triscout2026
```

Use those values only in a local development or lab environment.

---

## Configuration

The repository includes `config.json`, which drives default pipeline settings such as:

- default target selection
- port range defaults
- temporary and enriched result paths
- dashboard port and refresh rate
- scanner and processor behavior

Review `config.json` to adapt defaults for your environment.

---

## Ethical Use Notice

TriScout is provided for legitimate security research, defensive testing, and educational purposes only.

By using this project, you agree to:

- only assess systems you are authorized to test
- avoid scanning private addresses or internal infrastructure without permission
- respect applicable laws, service policies, and organizational requirements

This project includes built-in guardrails to reduce accidental scanning of restricted or private network ranges.

---

## License

This project is licensed under the MIT License. See `LICENSE` for details.

---

## Maintainer

- Kiran Mondal
- GitHub: https://github.com/Kiran-mondal

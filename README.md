<div align="center">
  <img src="public/logo.svg" alt="TriScout logo" width="180" />
  <h1>TriScout</h1>
  <p><strong>An open-source defensive reconnaissance and security-auditing toolkit.</strong></p>
  <p>
    <img src="https://img.shields.io/badge/Node.js-18%2B-339933?logo=nodedotjs&logoColor=white" alt="Node.js 18+" />
    <img src="https://img.shields.io/badge/Go-1.20%2B-00ADD8?logo=go&logoColor=white" alt="Go 1.20+" />
    <img src="https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white" alt="Python 3.10+" />
    <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License" />
  </p>
  <p>
    <a href="https://www.uneed.best/tool/triscout" target="_blank" rel="noopener">
      <img src="https://www.uneed.best/EMBED3.png" alt="Featured on Uneed" width="220" />
    </a>
    <a href="https://www.producthunt.com/products/triscout?embed=true&amp;utm_source=badge-featured&amp;utm_medium=badge&amp;utm_campaign=badge-triscout-2" target="_blank" rel="noopener noreferrer">
      <img src="https://img.shields.io/badge/Product%20Hunt-TriScout-DA552F?logo=producthunt&logoColor=white" alt="TriScout on Product Hunt" />
    </a>
  </p>
</div>

TriScout brings together a web dashboard, a Go-based scanning component, and Python result processing to help users review security posture and reconnaissance results. The project is intended for defensive work, authorized assessments, and learning.

> **Authorized use only:** Only assess systems and networks that you own or have explicit permission to test. You are responsible for complying with applicable laws and service policies.

## Contents

- [What it does](#what-it-does)
- [Project layout](#project-layout)
- [Requirements](#requirements)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Responsible use](#responsible-use)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

## What it does

TriScout provides components for:

- Reviewing common HTTP security-header and web configuration findings
- Identifying potential sensitive-data exposures in public-facing content
- Collecting and processing reconnaissance results through a multi-component pipeline
- Viewing results through a browser-based dashboard

The exact checks and behavior are defined by the project code and configuration. Findings should be validated by a qualified reviewer; automated results can be incomplete or incorrect.

## Project layout

```text
TriScout/
├── api/                 # API-side Go and Python components
├── go_scanner/          # Go scanning component
├── python_processor/    # Python result processing
├── public/              # Static assets and frontend resources
├── web_dashboard/       # Node.js/Express dashboard
├── config.json          # Pipeline and service defaults
├── run_all.sh           # Pipeline orchestration script
├── package.json         # Node.js dependencies and scripts
├── SECURITY.md          # Security reporting guidance
└── LICENSE              # MIT License
```

## Requirements

- Node.js 18 or newer and npm
- Go toolchain for the Go component
- Python 3 for the processing component
- Explicit authorization for any system you assess

## Getting started

Clone the repository and install the Node.js dependencies:

```bash
git clone https://github.com/Kiran-mondal/TriScout.git
cd TriScout
npm install
```

Start the dashboard:

```bash
npm start
```

The server is configured to use port `3000` by default. To run the full pipeline, review `config.json` and `run_all.sh` first, then follow the script's usage instructions and only use it within an authorized lab or assessment scope. The pipeline requires the Go and Python components to be installed and available in your environment.

## Configuration

`config.json` contains defaults for pipeline inputs and output paths, scanner behavior, processing, and dashboard settings. Review and adjust these values for your environment before use. Do not commit credentials, tokens, or other secrets to the repository; use an environment-based secret-management approach where applicable.

## Responsible use

TriScout is provided for defensive security research, authorized testing, and educational use. Do not use it to access, scan, or test systems without permission. Built-in safeguards are not a substitute for authorization or careful scope management.

## Contributing

Contributions, bug reports, and documentation improvements are welcome. Before opening a pull request:

1. Check existing issues and pull requests to avoid duplicate work.
2. Describe the problem or motivation and explain the proposed change.
3. Keep changes focused and include relevant testing or reproduction details.
4. Never include real credentials, private data, or unauthorized target information.

Please use GitHub Issues for general questions and bug reports. For potential security vulnerabilities, follow the private reporting guidance in [SECURITY.md](SECURITY.md) rather than posting sensitive details publicly.

## Security

Please review [SECURITY.md](SECURITY.md) for the project's security reporting instructions.

## License

TriScout is distributed under the MIT License. See [LICENSE](LICENSE) for details.

## Maintainer

Created and maintained by [Kiran Mondal](https://github.com/Kiran-mondal).

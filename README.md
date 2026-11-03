<div align="center">
  <img src="public/logo.svg" alt="TriScout Logo" width="220" height="220" />
  
  <h1>TriScout v2.4 TAC-OPS</h1>

  <img src="https://img.shields.io/badge/Node.js-20+-339933?style=flat&logo=nodedotjs" alt="Node.js Version"/>
  <img src="https://img.shields.io/badge/Database-Neon_PostgreSQL_%28RLS%29-336791?style=flat&logo=postgresql" alt="Neon RLS"/>
  <img src="https://img.shields.io/badge/Security-2FA_OTP_%26_Rate_Limit-39ff88?style=flat&logo=securityscorecard" alt="Security"/>
  <img src="https://img.shields.io/badge/Status-Active_Production-success.svg" alt="Status"/>
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License"/>

  <br><br>

  <a href="https://www.uneed.best/tool/triscout" target="_blank" rel="noopener">
    <img src="https://www.uneed.best/EMBED3.png" alt="Featured on Uneed" style="width: 220px;" />
  </a>

  <a href="https://www.producthunt.com/products/triscout?embed=true&amp;utm_source=badge-featured&amp;utm_medium=badge&amp;utm_campaign=badge-triscout-2" target="_blank" rel="noopener noreferrer"><img alt="TriScout - Ethical Passive Reconnaissance &amp; Security Posture Console | Product Hunt" width="220" height="48" src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1303112&amp;theme=dark&amp;t=1793724143663"></a>
</div>

<br>

<p align="center">
  <strong>TriScout v2.4 TAC-OPS</strong> is an on-demand, ethical passive cybersecurity reconnaissance console and global NPM CLI toolkit engineered for auditing HTTP security headers, DNS topology, and credential/source leaks without intrusive payload generation.
</p>

---

## 🚀 Core Features (v2.4 TAC-OPS)

- **🛡️ 12-Point Passive Security & DOM Audit:** Evaluates HTTP security headers (`HSTS`, `CSP`, `X-Frame-Options`, `MIME Sniffing`, `Referrer-Policy`, `Permissions-Policy`), cookie security flags (`HttpOnly`, `Secure`), and inspects scraped DOM surface for insecure form actions and server fingerprinting.
- **🔍 Credential & Stack Trace Leak Detection:** Automatically scans public page sources for exposed API keys (OpenAI, AWS, GitHub PATs, Google Cloud, Stripe, Private RSA keys) and raw SQL/stack trace errors.
- **🔒 Multi-Tenant Neon PostgreSQL RLS:** Powered by serverless PostgreSQL with **Row-Level Security (RLS)** policies enabled across `users`, `auth_otps`, and `scan_logs` tables so every operator's reconnaissance history is cryptographically isolated at the database layer.
- **⚡ Token Bucket & OTP Rate Limiting:** Built-in Token Bucket rate limiter (max 5 OTP requests per minute per identifier) to prevent spam and brute-force attacks on sign-in, sign-up, and password reset flows.
- **✉️ 2FA Email OTP Verification:** Secure authentication workflow backed by Gmail SMTP relay for sign-up activation, 2FA sign-in verification, and passkey recovery.
- **💻 Web HUD & Global CLI:** Access the interactive TAC-OPS command center via browser or run audits directly in your terminal/CI/CD pipelines via `npx @kiran-mondal/triscout`.
- **📊 Multi-Format Reporting:** Generate and export security posture grades (`0–100`) and vulnerability ledgers as PDF, JSON, CSV, or dispatch alerts via SMTP.

---

## 📁 Project Structure

```text
TriScout/
├── web_dashboard/     # Express server, RLS controllers, auth & scanner engine (Node.js)
├── public/            # TAC-OPS animated dark HUD frontend, logos, sitemap.xml & robots.txt
├── api/               # Go & Python microservices for backend telemetry
├── vercel.json        # Edge routing, static asset caching, and serverless config
└── package.json       # Dependencies (@neondatabase/serverless, nodemailer, jwt, axios)
```

## ⚙️ Prerequisites

- Node.js v18 or newer
- Go and Python 3 for the scanner and processing components
- Neon PostgreSQL database URL and Gmail SMTP credentials if you are configuring those services
- Authorization to test any target systems

## 🌐 Live Web Console & NPM Package

- Live Command Center: https://triscout.quarry.dpdns.org
- Global NPM CLI Package:

  ```bash
  npx @kiran-mondal/triscout
  ```

## 🚀 Getting Started

Clone the repository and install dependencies:

```bash
git clone https://github.com/Kiran-mondal/TriScout.git
cd TriScout
npm install
```

Start the dashboard:

```bash
npm start
```

To run the full pipeline, review `config.json` and `run_all.sh` first, then use the script only within an authorized lab or assessment scope. The pipeline requires Go and Python to be installed and available in your environment.

## ⚙️ Configuration

`config.json` contains default pipeline paths, scanner settings, processing options, and dashboard configuration. Review and adapt the settings for your environment. Keep credentials and tokens out of source control; configure secrets through your deployment environment.

## 🤝 Contributing

Contributions, bug reports, and documentation improvements are welcome. Before opening a pull request:

1. Check existing issues and pull requests for related work.
2. Explain the problem or motivation and describe your proposed change.
3. Keep the change focused and include relevant testing or reproduction details.
4. Do not include credentials, private data, or information from unauthorized targets.

Use GitHub Issues for general questions and bug reports. For potential security vulnerabilities, follow the private reporting guidance in [SECURITY.md](SECURITY.md) instead of posting sensitive details publicly.

## 🔐 Security & Responsible Use

TriScout is provided for legitimate security research, defensive testing, and educational purposes. Only use it on systems and networks that you own or have explicit permission to assess. Built-in safeguards are not a substitute for authorization, careful scope management, or compliance with applicable laws and service policies.

Please review [SECURITY.md](SECURITY.md) for security reporting instructions.

## ⚖️ License

TriScout is distributed under the MIT License. See [LICENSE](LICENSE) for details.

## 👨‍💻 Maintainer

Created and maintained by [Kiran Mondal](https://github.com/Kiran-mondal).

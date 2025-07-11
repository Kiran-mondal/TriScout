TriScout
TriScout is a powerful and modular cybersecurity tool designed for comprehensive reconnaissance. It seamlessly integrates Go for lightning-fast port scanning, Python for intelligent data processing, and Node.js for an interactive, real-time web dashboard. Whether you're a student, researcher, or penetration tester, TriScout provides an open-source, developer-friendly platform to gain insights into network vulnerabilities.
📌 Features
 * 🔍 Fast TCP Port Scanning: Leverage Go's concurrency for high-speed and efficient port scanning.
 * 📊 Enriched Result Analysis: Utilize Python to process raw scan data, adding valuable context and insights.
 * 🌐 Real-time Browser Dashboard: Visualize your scan results instantly with a dynamic and responsive web interface built with Node.js.
 * 🧩 Modular Cross-Language Design: Easily extend or modify individual components thanks to its well-defined, language-specific architecture.
---
📁 Project Structure
TriScout/
├── go_scanner/             # Go-based port scanner
├── python_processor/       # Python data processor
├── web_dashboard/          # Node.js web server & UI
├── shared_data/            # Output storage (JSON results)
└── README.md

---
🛠️ Quick Setup
Getting TriScout up and running is straightforward:
 * Clone the repository:
   git clone https://github.com/yourusername/triscout.git
cd triscout

 * Run the Go Scanner:
   Navigate to the go_scanner directory, build, and execute. This will generate results.json in shared_data/.
   cd go_scanner
go build scanner.go
./scanner

 * Process with Python:
   Move to python_processor and run the script, which will enrich the raw scan data into processed.json.
   cd ../python_processor
python3 processor.py ../shared_data/results.json

 * Launch the Web Dashboard:
   From web_dashboard, install dependencies and start the Node.js server.
   cd ../web_dashboard
npm install
node server.js

 * View Results:
   Open your web browser and visit http://localhost:3000 to see your scan results in real-time.
---
🔍 Dependencies
 * Go: net, fmt, os, sync, encoding/json, time
 * Python: json, sys, os (no external libraries needed)
 * Node.js: express, ejs (install via npm install express ejs)
---
📄 Output Format
 * results.json: Raw scan data from the Go scanner.
 * processed.json: Enriched scan data from the Python processor.
---
🧑‍💻 Developer
Kiran “Babai” Mondal
 * GitHub: github.com/yourusername
 * Role: Full-stack security tools developer
 * Focus: Python | Go | Node.js | Cybersecurity | Recon tools
---
📝 License
TriScout is released under the MIT License. This means it's completely free for both personal and commercial use.
---
📬 Contribute
We welcome contributions! If you encounter issues, have feature ideas, or want to improve the codebase, please open an issue or submit a pull request. Feel free to contact the developer or fork the repository to build your custom version.
---
📌 Roadmap
 * Support for remote targets
 * Export results to CSV or PDF
 * Advanced dashboard filters
 * Authentication for UI access

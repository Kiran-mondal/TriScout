TriScout: A Cross-Language Reconnaissance Tool 

TriScout is a medium-level modular cybersecurity tool that combines the power of three languages:

🐹 Go for high-speed concurrent port scanning 🐍 Python for intelligent data processing and enrichment 🌐 Node.js for serving a live, interactive dashboard 

It’s designed for internal reconnaissance, education, or penetration testing scenarios where modular architecture and language versatility are key.

📌 Features 🔍 Fast TCP port scanning (1–1024) 📊 Enriched scan result analysis 🌐 Real-time browser dashboard 🧩 Clean separation of responsibilities across languages 🛠️ Fully open-source and extensible 📁 Project Structure TriScout/ ├── go_scanner/ # Port scanner (Go) │ └── scanner.go ├── python_processor/ # Data processor (Python) │ ├── processor.py │ └── requirements.txt ├── web_dashboard/ # Dashboard (Node.js) │ ├── server.js │ └── views/index.ejs ├── shared_data/ # JSON file storage │ ├── results.json │ └── processed.json └── README.md 🛠️ Installation & Usage 1. 🚀 Clone the Repository git clone https://github.com/yourusername/triscout.git cd triscout 2. ⚙️ Run the Go Port Scanner cd go_scanner go build scanner.go ./scanner # Output saved to: ../shared_data/results.json 3. 🧠 Process Results with Python cd ../python_processor python3 processor.py ../shared_data/results.json # Output saved to: ../shared_data/processed.json 4. 🌐 Launch the Node.js Dashboard cd ../web_dashboard npm install node server.js # Visit: http://localhost:3000 🔍 Example Workflow (Tutorial) Scan local network ports using Go Process the results into a readable format with Python Visualize the final results in a browser using Node.js dashboard 

You can repeat this cycle on different IP addresses or ranges.

📦 Dependencies Go net, os, encoding/json, sync, time — All standard libraries Python No external packages required Uses: json, sys, os Node.js npm install express ejs 📄 Output Files results.json — Raw port scan data (Go) processed.json — Human-readable, enriched scan results (Python) 🧪 Example Entry (processed.json) { "ip": "127.0.0.1", "port": 22, "status": "open", "description": "Port 22 is open." } 📜 License 

MIT License — free to use, modify, and distribute.

🤝 Contributing 

Pull requests and suggestions are welcome! Open an issue first to discuss any major changes.

🔮 Roadmap / Future Ideas 🌐 Scan remote IPs or CIDR ranges 🧠 Integrate with CVE databases 📦 Export results as CSV/PDF 🔐 Add user authentication for dashboard 

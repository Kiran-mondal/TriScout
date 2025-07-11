TriScout 

TriScout is a modular cybersecurity reconnaissance tool leveraging the strengths of three powerful languages:

Go for fast IP/port scanning, Python for intelligent data processing, Node.js for real-time visualization via a web dashboard. 

Designed for medium-level security projects, it provides insights into open ports and services on a target machine or local network.

🚀 Features High-speed TCP port scanning (1–1024) with Go Data enrichment and filtering using Python Live visual dashboard using Node.js + EJS Modular structure: easy to expand and maintain 📦 Libraries Used ✅ Go net — for TCP connections encoding/json — for writing JSON files os, sync, time, fmt — standard utilities ✅ Python json — to read and write JSON data sys, os — for file and CLI handling ✅ Node.js express — to create the web server ejs — for templating HTML fs, path — to read files and manage paths 

Install dependencies:

npm install express ejs 📂 Project Structure TriScout/ ├── go_scanner/ # Go scanner │ └── scanner.go ├── python_processor/ # Python data processor │ └── processor.py ├── web_dashboard/ # Node.js frontend/backend │ ├── server.js │ └── views/index.ejs ├── shared_data/ # JSON data storage │ ├── results.json │ └── processed.json └── README.md ⚙️ Setup Instructions 1. Clone the Repository git clone https://github.com/yourname/triscout.git cd triscout 2. Build & Run the Go Scanner cd go_scanner go build scanner.go ./scanner 3. Process the Results with Python cd ../python_processor python3 processor.py ../shared_data/results.json 4. Start the Node.js Dashboard cd ../web_dashboard npm install node server.js 

Then visit http://localhost:3000 in your browser to view the dashboard.

📹 Beginner-Friendly Tutorial 

Here’s a simple workflow to use the tool:

🔸 Step 1: Scan your local machine cd go_scanner ./scanner # will scan localhost ports 1–1024 🔸 Step 2: Enrich the scan data cd ../python_processor python3 processor.py ../shared_data/results.json 🔸 Step 3: View the results in a browser cd ../web_dashboard node server.js # Open http://localhost:3000 🔍 Output Files shared_data/results.json: Raw scan output (Go) shared_data/processed.json: Enriched output (Python) 📜 License 

MIT License — feel free to modify and use in your own projects.

🙋 Support / Contributing 

PRs are welcome! Open an issue for bugs or feature requests.

💡 Future Improvements Add OS fingerprinting Filter by common CVE-affected ports Add export as CSV or PDF Enable live scan visualization 

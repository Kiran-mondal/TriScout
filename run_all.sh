#!/bin/bash

# TriScout Unified Automation Script (v2.0.0)

TARGET=""
PORTS="1-1024"
EXPORT_FORMAT="json"

print_usage() {
    echo "Usage: ./run_all.sh -target <IP/Domain> [-ports <range>] [-format <json|csv|pdf>]"
    echo "Example: ./run_all.sh -target 192.168.1.1 -ports 1-1024 -format pdf"
    exit 1
}

# Parse flags
while [[ "$#" -gt 0 ]]; do
    case $1 in
        -target) TARGET="$2"; shift ;;
        -ports) PORTS="$2"; shift ;;
        -format) EXPORT_FORMAT="$2"; shift ;;
        -h|--help) print_usage ;;
        *) echo "Unknown parameter: $1"; print_usage ;;
    esac
    shift
done

if [ -z "$TARGET" ]; then
    echo "❌ Error: Target is required."
    print_usage
fi

echo "🛰️  Starting TriScout Pipeline for Target: $TARGET"
echo "--------------------------------------------------"

# Step 1: Run Go Scanner
echo "⚡ [1/3] Launching Go Port Scanner..."
cd go_scanner
go build -o triscout-scan scanner.go
./triscout-scan -target "$TARGET" -ports "$PORTS"
if [ ! -f results.json ]; then
    echo "❌ Go scanner failed to generate results.json"
    exit 1
fi

# Step 2: Run Python Processor
echo "🧠 [2/3] Launching Python Enrichment Engine (Format: $EXPORT_FORMAT)..."
cd ../python_processor
python3 processor.py ../go_scanner/results.json "$EXPORT_FORMAT"
if [ ! -f processed.json ]; then
    echo "❌ Python processor failed to generate processed.json"
    exit 1
fi

# Step 3: Spin up Node.js Dashboard
echo "🌐 [3/3] Starting Authenticated Web Dashboard..."
echo "💡 Access the dashboard at http://localhost:3000"
echo "💡 Use default credentials: admin / triscout2026"
cd ../web_dashboard
# Sync the processed data to the web dashboard directory for rendering
cp ../python_processor/processed.json ./processed.json
npm install
node server.js
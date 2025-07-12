#!/bin/bash

echo "🔍 Step 1: Running Go Scanner..."
cd go_scanner
go build scanner.go && ./scanner
if [ $? -ne 0 ]; then
  echo "❌ Go scan failed!"
  exit 1
fi

echo "🧠 Step 2: Processing with Python..."
cd ../python_processor
python3 processor.py ../shared_data/scan_data.json
if [ $? -ne 0 ]; then
  echo "❌ Python processing failed!"
  exit 1
fi

echo "🌐 Step 3: Launching Node.js Dashboard..."
cd ../web_dashboard
npm install
node server.js
import json
import sys
import os
import csv

# Simple local signature database for demonstration
SERVICE_DB = {
    22: {"service": "SSH", "severity": "Low", "notes": "Ensure key-based auth is enforced. Check for OpenSSH exploits."},
    80: {"service": "HTTP", "severity": "Medium", "notes": "Unencrypted web traffic. Missing TLS/SSL headers."},
    443: {"service": "HTTPS", "severity": "None", "notes": "Encrypted web traffic. Verify SSL certificate validity."},
    8080: {"service": "HTTP-Proxy / Tomcat", "severity": "Medium", "notes": "Potential administrative console exposed."}
}

def enrich_data(input_file, export_format):
    if not os.path.exists(input_file):
        print(f"[-] Error: Input file {input_file} not found.")
        sys.exit(1)

    with open(input_file, 'r') as f:
        raw_data = json.load(f)

    target = raw_data.get("target")
    scan_time = raw_data.get("scan_time")
    open_ports = raw_data.get("open_ports", [])

    enriched_ports = []
    vulnerabilities_found = False

    for port in open_ports:
        info = SERVICE_DB.get(port, {"service": "Unknown", "severity": "Info", "notes": "Unknown service. Consider banner grabbing."})
        if info["severity"] in ["Medium", "High", "Critical"]:
            vulnerabilities_found = True
        
        enriched_ports.append({
            "port": port,
            "service": info["service"],
            "severity": info["severity"],
            "notes": info["notes"]
        })

    output_data = {
        "target": target,
        "scan_time": scan_time,
        "vulnerabilities_found": vulnerabilities_found,
        "ports": enriched_ports
    }

    # Always write primary processed.json for the dashboard UI contract
    with open("processed.json", "w") as f:
        json.dump(output_data, f, indent=2)

    # Handle alternative exports requested via automation pipeline
    if export_format == "csv":
        export_to_csv(output_data)
    elif export_format == "pdf":
        export_to_pdf(output_data)
    
    print("[+] Enrichment complete. Structured data written to processed.json")

def export_to_csv(data):
    filename = f"report_{data['target']}.csv"
    with open(filename, mode='w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["Target", data["target"], "Scan Time", data["scan_time"]])
        writer.writerow([])
        writer.writerow(["Port", "Service", "Severity", "Notes"])
        for item in data["ports"]:
            writer.writerow([item["port"], item["service"], item["severity"], item["notes"]])
    print(f"[+] Exported CSV Report: {filename}")

def export_to_pdf(data):
    # Fallback to text summary file if reportlab isn't installed natively in the user environment
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas
        
        filename = f"report_{data['target']}.pdf"
        c = canvas.Canvas(filename, pagesize=letter)
        c.drawString(100, 750, f"TriScout Security Report for {data['target']}")
        c.drawString(100, 730, f"Scan Executed: {data['scan_time']}")
        c.drawString(100, 710, f"Vulnerabilities Identified: {data['vulnerabilities_found']}")
        
        y = 670
        c.drawString(100, y, "Port details:")
        y -= 20
        for item in data["ports"]:
            text = f"Port {item['port']} ({item['service']}) - Severity: {item['severity']} - {item['notes']}"
            c.drawString(120, y, text[:80]) # simple clipping
            y -= 20
        c.save()
        print(f"[+] Exported PDF Report: {filename}")
    except ImportError:
        # Graceful degradation
        filename = f"report_{data['target']}.txt"
        with open(filename, 'w') as f:
            f.write(f"TriScout Security Report\nTarget: {data['target']}\nScan Time: {data['scan_time']}\n")
            for item in data["ports"]:
                f.write(f"- Port {item['port']}: {item['service']} [{item['severity']}] -> {item['notes']}\n")
        print(f"[!] reportlab not installed. Saved clean TXT report instead: {filename}")
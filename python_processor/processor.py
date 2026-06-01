import json
import sys
import os
import csv

# Static vulnerability look-up matrix for standard port mappings
SERVICE_MAP = {
    21: {"service": "FTP", "severity": "High", "notes": "Cleartext authentication protocols detected. Risk of credential sniffing."},
    22: {"service": "SSH", "severity": "Low", "notes": "Secure protocol. Ensure key-based authentication is enforced."},
    23: {"service": "Telnet", "severity": "Critical", "notes": "Unencrypted administration vector. Replace with SSH immediately."},
    25: {"service": "SMTP", "severity": "Medium", "notes": "Check for open relay configuration parameters."},
    53: {"service": "DNS", "severity": "Low", "notes": "Ensure zone transfers are restricted globally."},
    80: {"service": "HTTP", "severity": "Medium", "notes": "Cleartext transport web server. Migrate web assets to HTTPS/SSL."},
    443: {"service": "HTTPS", "severity": "None", "notes": "Encrypted web configuration service channel."},
    3306: {"service": "MySQL", "severity": "High", "notes": "Database listener port. Do not expose directly to public networks."}
}

def enrich_data(input_path):
    if not os.path.exists(input_path):
        print(f"[-] Input database data file not found at: {input_path}")
        sys.exit(1)

    with open(input_path, 'r') as f:
        raw_data = json.load(f)

    target = raw_data.get("target", "Unknown")
    scan_time = raw_data.get("scan_time", "Unknown")
    open_ports = raw_data.get("open_ports", [])

    enriched_ports = []
    has_vulns = False

    print(f"[+] Processing {len(open_ports)} raw discoveries from Go Scanner framework...")

    for port in open_ports:
        lookup = SERVICE_MAP.get(port, {"service": "Unknown", "severity": "Low", "notes": "Unrecognized custom service fingerprint context."})
        if lookup["severity"] in ["Medium", "High", "Critical"]:
            has_vulns = True
        
        enriched_ports.append({
            "port": port,
            "service": lookup["service"],
            "severity": lookup["severity"],
            "notes": lookup["notes"]
        })

    processed_payload = {
        "target": target,
        "scan_time": scan_time,
        "vulnerabilities_found": has_vulns,
        "ports": enriched_ports
    }

    # Output processed data for web rendering engine consumption
    with open("processed.json", "w") as f:
        json.dump(processed_payload, f, indent=2)
    print("[+] Rich analysis successfully indexed inside processed.json")

    # Generate standalone portable CSV reports
    csv_file = "scan_report.csv"
    with open(csv_file, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["Port", "Service Identified", "Severity Level", "Mitigation Notes"])
        for item in enriched_ports:
            writer.writerow([item["port"], item["service"], item["severity"], item["notes"]])
    print(f"[+] Direct CSV report successfully exported directly onto: {csv_file}")

if name == "main":
    if len(sys.argv) < 2:
        print("[-] Usage format: python3 processor.py <path_to_results.json>")
        sys.exit(1)
    enrich_data(sys.argv[1])
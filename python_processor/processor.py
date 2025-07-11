import json
import sys
import os

def enrich_data(results):
    enriched = []
    for entry in results:
        status = "open" if entry["open"] else "closed"
        enriched.append({
            "ip": entry["ip"],
            "port": entry["port"],
            "status": status,
            "description": f"Port {entry['port']} is {status}."
        })
    return enriched

def main(input_file):
    if not os.path.exists(input_file):
        print(f"File not found: {input_file}")
        return

    with open(input_file) as f:
        data = json.load(f)

    enriched_data = enrich_data(data)

    with open("../shared_data/processed.json", "w") as f:
        json.dump(enriched_data, f, indent=2)

    print("Processed data saved to processed.json")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 processor.py <results.json>")
    else:
        main(sys.argv[1])

package handler

import (
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"sync"
	"time"
)

// RequestPayload defines the expected JSON input
type RequestPayload struct {
	Target string `json:"target"`
}

// ScanResult holds the result of the port scan
type ScanResult struct {
	Port    int    `json:"port"`
	State   string `json:"state"`
	Service string `json:"service"`
}

// Common critical ports to scan (optimized for Vercel's 10s timeout)
var commonPorts = map[int]string{
	21:   "FTP",
	22:   "SSH",
	23:   "Telnet",
	25:   "SMTP",
	53:   "DNS",
	80:   "HTTP",
	110:  "POP3",
	143:  "IMAP",
	443:  "HTTPS",
	3306: "MySQL",
	5432: "PostgreSQL",
	8080: "HTTP-Proxy",
}

// scanPort attempts to connect to a specific port on the target
func scanPort(target string, port int, service string, results chan<- ScanResult, wg *sync.WaitGroup) {
	defer wg.Done()
	address := fmt.Sprintf("%s:%d", target, port)
	
	// 2-second timeout to ensure the entire function finishes quickly
	conn, err := net.DialTimeout("tcp", address, 2*time.Second)
	
	if err == nil {
		conn.Close()
		results <- ScanResult{Port: port, State: "open", Service: service}
	}
}

func Handler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var payload RequestPayload
	err := json.NewDecoder(r.Body).Decode(&payload)
	if err != nil || payload.Target == "" {
		http.Error(w, "Missing or invalid target", http.StatusBadRequest)
		return
	}

	var wg sync.WaitGroup
	resultsChan := make(chan ScanResult, len(commonPorts))

	// Launch a concurrent goroutine for each port in our list
	for port, service := range commonPorts {
		wg.Add(1)
		go scanPort(payload.Target, port, service, resultsChan, &wg)
	}

	// Wait for all port scans to finish
	wg.Wait()
	close(resultsChan)

	var openPorts []ScanResult
	for res := range resultsChan {
		openPorts = append(openPorts, res)
	}

	response := map[string]interface{}{
		"status":                "success",
		"scanned_target":        payload.Target,
		"open_ports":            openPorts,
		"vulnerabilities_found": len(openPorts), // Basic metric for now
		"message":               fmt.Sprintf("Reconnaissance complete. Scanned %d critical ports.", len(commonPorts)),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

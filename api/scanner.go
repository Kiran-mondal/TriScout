package handler

import (
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"
)

type RequestPayload struct {
	Target string `json:"target"`
}

type ScanResult struct {
	Port    int    `json:"port"`
	State   string `json:"state"`
	Service string `json:"service"`
}

type HeaderCheck struct {
	HeaderName string `json:"header_name"`
	Status     string `json:"status"`
	Details    string `json:"details"`
}

var commonPorts = map[int]string{
	21:   "FTP",
	22:   "SSH",
	80:   "HTTP",
	443:  "HTTPS",
	3306: "MySQL",
	5432: "PostgreSQL",
}

// cleanTarget extracts clean hostname from user input (removes https://, http://, and trailing slashes)
func cleanTarget(rawTarget string) string {
	rawTarget = strings.TrimSpace(rawTarget)
	if !strings.HasPrefix(rawTarget, "http://") && !strings.HasPrefix(rawTarget, "https://") {
		rawTarget = "http://" + rawTarget
	}
	parsedUrl, err := url.Parse(rawTarget)
	if err != nil {
		return strings.TrimSuffix(strings.TrimPrefix(strings.TrimPrefix(rawTarget, "https://"), "http://"), "/")
	}
	return parsedUrl.Hostname()
}

func scanPort(target string, port int, service string, results chan<- ScanResult, wg *sync.WaitGroup) {
	defer wg.Done()
	address := fmt.Sprintf("%s:%d", target, port)
	conn, err := net.DialTimeout("tcp", address, 2*time.Second)
	if err == nil {
		conn.Close()
		results <- ScanResult{Port: port, State: "open", Service: service}
	}
}

func checkSecurityHeaders(hostname string) []HeaderCheck {
	targetUrl := fmt.Sprintf("https://%s", hostname)
	client := &http.Client{Timeout: 4 * time.Second}
	
	resp, err := client.Get(targetUrl)
	if err != nil {
		targetUrl = fmt.Sprintf("http://%s", hostname)
		resp, err = client.Get(targetUrl)
		if err != nil {
			return []HeaderCheck{{HeaderName: "Connection", Status: "Failed", Details: "Could not reach target for header analysis."}}
		}
	}
	defer resp.Body.Close()

	var checks []HeaderCheck

	if resp.Header.Get("Strict-Transport-Security") != "" {
		checks = append(checks, HeaderCheck{HeaderName: "HSTS", Status: "Secure", Details: "Enforces secure HTTPS connections."})
	} else {
		checks = append(checks, HeaderCheck{HeaderName: "HSTS", Status: "Missing", Details: "Vulnerable to protocol downgrade attacks."})
	}

	if resp.Header.Get("Content-Security-Policy") != "" {
		checks = append(checks, HeaderCheck{HeaderName: "CSP", Status: "Secure", Details: "Protects against Cross-Site Scripting (XSS)."})
	} else {
		checks = append(checks, HeaderCheck{HeaderName: "CSP", Status: "Missing", Details: "No XSS protection policy defined."})
	}

	if resp.Header.Get("X-Frame-Options") != "" {
		checks = append(checks, HeaderCheck{HeaderName: "X-Frame-Options", Status: "Secure", Details: "Protected against Clickjacking."})
	} else {
		checks = append(checks, HeaderCheck{HeaderName: "X-Frame-Options", Status: "Missing", Details: "Site can be embedded in malicious iframes."})
	}

	return checks
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

	hostname := cleanTarget(payload.Target)

	var wg sync.WaitGroup
	resultsChan := make(chan ScanResult, len(commonPorts))

	for port, service := range commonPorts {
		wg.Add(1)
		go scanPort(hostname, port, service, resultsChan, &wg)
	}

	wg.Wait()
	close(resultsChan)

	var openPorts []ScanResult
	for res := range resultsChan {
		openPorts = append(openPorts, res)
	}

	headerResults := checkSecurityHeaders(hostname)

	response := map[string]interface{}{
		"status":           "success",
		"scanned_target":   hostname,
		"open_ports":       openPorts,
		"security_headers": headerResults,
		"message":          "Advanced Reconnaissance and Header check complete.",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

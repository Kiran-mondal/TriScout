package main

import (
 "encoding/json"
 "flag"
 "fmt"
 "net"
 "os"
 "sync"
 "time"
)

// ScanResult structure for JSON serialization
type ScanResult struct {
 Target    string    json:"target"
 ScanTime  string    json:"scan_time"
 OpenPorts []int     json:"open_ports"
}

func main() {
 // CLI Flags
 targetFlag := flag.String("target", "127.0.0.1", "Target IP address or domain")
 startPort := flag.Int("start", 1, "Start port")
 endPort := flag.Int("end", 1024, "End port")
 concurrency := flag.Int("workers", 100, "Number of concurrent worker goroutines")
 flag.Parse()

 fmt.Printf("[+] Starting TriScout Go Scanner on %s (%d-%d)\n", *targetFlag, *startPort, *endPort)
 startTime := time.Now()

 ports := make(chan int, *concurrency)
 results := make(chan int)
 var wg sync.WaitGroup

 // Start Workers
 for i := 0; i < *concurrency; i++ {
  wg.Add(1)
  go func() {
   defer wg.Done()
   for port := range ports {
    address := fmt.Sprintf("%s:%d", *targetFlag, port)
    conn, err := net.DialTimeout("tcp", address, 1*time.Second)
    if err == nil {
     conn.Close()
     results <- port
    }
   }
  }()
 }

 // Feed ports to channel
 go func() {
  for i := *startPort; i <= *endPort; i++ {
   ports <- i
  }
  close(ports)
 }()

 // Collect results dynamically
 var openPorts []int
 done := make(chan bool)
 go func() {
  for port := range results {
   fmt.Printf(" [!] Found open port: %d\n", port)
   openPorts = append(openPorts, port)
  }
  done <- true
 }()

 wg.Wait()
 close(results)
 <-done

 // Build payload
 output := ScanResult{
  Target:    *targetFlag,
  ScanTime:  startTime.Format(time.RFC3339),
  OpenPorts: openPorts,
 }

 // Write to file
 fileData, _ := json.MarshalIndent(output, "", "  ")
 err := os.WriteFile("results.json", fileData, 0644)
 if err != nil {
  fmt.Printf("[-] Error saving results: %v\n", err)
  return
 }

 fmt.Printf("[+] Scan complete. Saved %d open ports to results.json (Took %v)\n", len(openPorts), time.Since(startTime))
}
package main

import (
 "encoding/json"
 "flag"
 "fmt"
 "net"
 "os"
 "strconv"
 "strings"
 "sync"
 "time"
)

type ScanResult struct {
 Target    string    json:"target"
 ScanTime  string    json:"scan_time"
 OpenPorts []int     json:"open_ports"
}

func main() {
 targetFlag := flag.String("target", "", "Target IP or Domain")
 portsFlag := flag.String("ports", "1-1024", "Port range (e.g., 22-80 or 80)")
 flag.Parse()

 if *targetFlag == "" {
  fmt.Println("Error: -target flag is required")
  os.Exit(1)
 }

 startPort, endPort, err := parsePortRange(*portsFlag)
 if err != nil {
  fmt.Printf("Error parsing ports: %v\n", err)
  os.Exit(1)
 }

 fmt.Printf("[+] Scanning %s for ports %d-%d...\n", *targetFlag, startPort, endPort)

 ports := make(chan int, 100)
 results := make(chan int)
 var openPorts []int

 // Worker Pool (100 concurrent workers)
 var wg sync.WaitGroup
 for i := 0; i < 100; i++ {
  wg.Add(1)
  go worker(*targetFlag, ports, results, &wg)
 }

 // Feed ports to channel
 go func() {
  for i := startPort; i <= endPort; i++ {
   ports <- i
  }
  close(ports)
 }()

 // Gather results
 go func() {
  for p := range results {
   openPorts = append(openPorts, p)
  }
 }()

 wg.Wait()
 close(results)

 // Output structured JSON
 output := ScanResult{
  Target:    *targetFlag,
  ScanTime:  time.Now().UTC().Format(time.RFC3339),
  OpenPorts: openPorts,
 }

 file, _ := json.MarshalIndent(output, "", "  ")
 _ = os.WriteFile("results.json", file, 0644)
 fmt.Printf("[+] Scan complete. Found %d open ports. Written to results.json\n", len(openPorts))
}

func worker(target string, ports chan int, results chan int, wg *sync.WaitGroup) {
 defer wg.Done()
 for port := range ports {
  address := fmt.Sprintf("%s:%d", target, port)
  conn, err := net.DialTimeout("tcp", address, 1*time.Second)
  if err == nil {
   conn.Close()
   fmt.Printf("    [!] Port %d is OPEN\n", port)
   results <- port
  }
 }
}

func parsePortRange(portsStr string) (int, int, error) {
 parts := strings.Split(portsStr, "-")
 if len(parts) == 1 {
  p, err := strconv.Atoi(parts[0])
  return p, p, err
 }
 start, err1 := strconv.Atoi(parts[0])
 end, err2 := strconv.Atoi(parts[1])
 if err1 != nil || err2 != nil {
  return 0, 0, fmt.Errorf("invalid range")
 }
 return start, end, nil
}
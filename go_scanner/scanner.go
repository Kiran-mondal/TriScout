package main

import (
    "encoding/json"
    "fmt"
    "net"
    "os"
    "sync"
    "time"
)

type ScanResult struct {
    IP   string `json:"ip"`
    Port int    `json:"port"`
    Open bool   `json:"open"`
}

func scanPort(ip string, port int, wg *sync.WaitGroup, results *[]ScanResult, mutex *sync.Mutex) {
    defer wg.Done()
    address := fmt.Sprintf("%s:%d", ip, port)
    conn, err := net.DialTimeout("tcp", address, 1*time.Second)
    result := ScanResult{IP: ip, Port: port, Open: err == nil}
    if err == nil {
        conn.Close()
    }
    mutex.Lock()
    *results = append(*results, result)
    mutex.Unlock()
}

func main() {
    targetIP := "127.0.0.1"
    var results []ScanResult
    var wg sync.WaitGroup
    var mutex sync.Mutex

    for port := 1; port <= 1024; port++ {
        wg.Add(1)
        go scanPort(targetIP, port, &wg, &results, &mutex)
    }

    wg.Wait()

    file, _ := os.Create("../shared_data/scan_data.json")
    defer file.Close()
    json.NewEncoder(file).Encode(results)

    fmt.Println("Scan complete. Results saved to results.json")
}

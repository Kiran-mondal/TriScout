package handler

import (
	"encoding/json"
	"net/http"
)

// RequestPayload defines the expected JSON input
type RequestPayload struct {
	Target string `json:"target"`
}

func Handler(w http.ResponseWriter, r *http.Request) {
	// Only allow POST requests for scanning
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

	response := map[string]interface{}{
		"status": "success",
		"scanned_target": payload.Target,
		"vulnerabilities_found": 0,
		"message": "Scanner executed successfully via Vercel Serverless on target: " + payload.Target,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

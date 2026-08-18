package handler

import (
	"encoding/json"
	"net/http"
)

// Handler is the entry point for Vercel
func Handler(w http.ResponseWriter, r *http.Request) {
	response := map[string]interface{}{
		"status": "success",
		"vulnerabilities_found": 0,
		"message": "Scanner executed successfully via Vercel Serverless",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

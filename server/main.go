package main

import (
	"log"
	"net/http"
	"os"

	"bellbound/server/handler"
)

func main() {
	anthropicKey := os.Getenv("ANTHROPIC_API_KEY")
	if anthropicKey == "" {
		log.Fatal("ANTHROPIC_API_KEY environment variable is required")
	}

	appToken := os.Getenv("APP_TOKEN")
	if appToken == "" {
		log.Fatal("APP_TOKEN environment variable is required")
	}

	h := &handler.ProxyHandler{
		AnthropicURL: "https://api.anthropic.com/v1/messages",
		AnthropicKey: anthropicKey,
		AppToken:     appToken,
		Client:       &http.Client{},
	}

	addr := ":8080"
	log.Printf("bellbound server listening on %s", addr)
	if err := http.ListenAndServe(addr, h); err != nil {
		log.Fatalf("server error: %v", err)
	}
}

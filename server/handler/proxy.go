package handler

import (
	"io"
	"net/http"
	"strings"
)

// ProxyHandler forwards POST /api/ai to the Anthropic API after verifying the
// client-supplied Bearer token. The Anthropic API key is never sent to the client
// and never written to any log output.
type ProxyHandler struct {
	// AnthropicURL is the upstream endpoint. Override in tests to point at a mock server.
	AnthropicURL string
	// AnthropicKey is the Anthropic API key read from env ANTHROPIC_API_KEY.
	AnthropicKey string
	// AppToken is the shared secret the client must present as "Authorization: Bearer <TOKEN>".
	AppToken string
	// Client is the HTTP client used to call Anthropic. Injected so tests can control it.
	Client *http.Client
}

// ServeHTTP routes requests to the appropriate handler.
func (h *ProxyHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	switch {
	case r.Method == http.MethodGet && r.URL.Path == "/health":
		h.handleHealth(w, r)
	case r.Method == http.MethodPost && r.URL.Path == "/api/ai":
		h.handleProxy(w, r)
	default:
		http.NotFound(w, r)
	}
}

// handleHealth returns a simple JSON liveness check.
func (h *ProxyHandler) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"ok"}`)) //nolint:errcheck
}

// handleProxy verifies the client token, then forwards the request body to the
// Anthropic API, injecting the server-side API key as x-api-key. The client's
// Authorization header is never forwarded upstream, and the Anthropic key is
// never forwarded downstream.
func (h *ProxyHandler) handleProxy(w http.ResponseWriter, r *http.Request) {
	// 1. Verify client Bearer token.
	if !h.isAuthorized(r) {
		http.Error(w, `{"error":"unauthorized"}`, http.StatusUnauthorized)
		return
	}

	// 2. Read the request body from the client.
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, `{"error":"failed to read request body"}`, http.StatusBadRequest)
		return
	}

	// 3. Build the upstream request to Anthropic.
	upstream, err := http.NewRequestWithContext(r.Context(), http.MethodPost, h.AnthropicURL, strings.NewReader(string(body)))
	if err != nil {
		http.Error(w, `{"error":"failed to build upstream request"}`, http.StatusInternalServerError)
		return
	}

	// 4. Set required Anthropic headers. The client's Authorization header is
	//    intentionally omitted — we only set server-side credentials.
	upstream.Header.Set("x-api-key", h.AnthropicKey)
	upstream.Header.Set("anthropic-version", "2023-06-01")
	upstream.Header.Set("content-type", "application/json")

	// 5. Execute the upstream request.
	resp, err := h.Client.Do(upstream)
	if err != nil {
		http.Error(w, `{"error":"upstream request failed"}`, http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	// 6. Copy the upstream status and body back to the client.
	//    Response headers from Anthropic are forwarded selectively to avoid
	//    leaking internal headers. Content-Type is always forwarded.
	if ct := resp.Header.Get("Content-Type"); ct != "" {
		w.Header().Set("Content-Type", ct)
	}
	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body) //nolint:errcheck
}

// isAuthorized checks that the request carries the correct Bearer token.
// Returns false for any missing, malformed, or mismatched token.
func (h *ProxyHandler) isAuthorized(r *http.Request) bool {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return false
	}
	const prefix = "Bearer "
	if !strings.HasPrefix(authHeader, prefix) {
		return false
	}
	token := strings.TrimPrefix(authHeader, prefix)
	if token == "" {
		return false
	}
	return token == h.AppToken
}

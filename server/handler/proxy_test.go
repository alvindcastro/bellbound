package handler_test

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"bellbound/server/handler"
)

const testAppToken = "test-app-token"
const testAnthropicKey = "sk-ant-test-key"

// makeHandler creates a ProxyHandler wired to a mock Anthropic server (if provided).
func makeHandler(anthropicURL string) *handler.ProxyHandler {
	return &handler.ProxyHandler{
		AnthropicURL: anthropicURL,
		AnthropicKey: testAnthropicKey,
		AppToken:     testAppToken,
		Client:       &http.Client{},
	}
}

// --- TestHealth ---

func TestHealth(t *testing.T) {
	h := makeHandler("https://api.anthropic.com/v1/messages")

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rec := httptest.NewRecorder()

	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	body := rec.Body.String()
	var payload map[string]string
	if err := json.Unmarshal([]byte(body), &payload); err != nil {
		t.Fatalf("response body is not valid JSON: %v — body: %s", err, body)
	}
	if payload["status"] != "ok" {
		t.Fatalf("expected status=ok, got %q", payload["status"])
	}

	ct := rec.Header().Get("Content-Type")
	if !strings.Contains(ct, "application/json") {
		t.Fatalf("expected Content-Type application/json, got %q", ct)
	}
}

// --- TestProxy_RejectsUnauthorized ---

func TestProxy_RejectsUnauthorized(t *testing.T) {
	h := makeHandler("https://api.anthropic.com/v1/messages")

	cases := []struct {
		name   string
		header string
	}{
		{"no auth header", ""},
		{"wrong token", "Bearer wrong-token"},
		{"malformed bearer", "wrong-token"},
		{"empty bearer", "Bearer "},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			body := bytes.NewBufferString(`{"model":"claude-3-haiku-20240307","messages":[]}`)
			req := httptest.NewRequest(http.MethodPost, "/api/ai", body)
			req.Header.Set("Content-Type", "application/json")
			if tc.header != "" {
				req.Header.Set("Authorization", tc.header)
			}

			rec := httptest.NewRecorder()
			h.ServeHTTP(rec, req)

			if rec.Code != http.StatusUnauthorized {
				t.Fatalf("expected 401 for %q, got %d", tc.name, rec.Code)
			}
		})
	}
}

// --- TestProxy_ForwardsRequestToAnthropic ---

func TestProxy_ForwardsRequestToAnthropic(t *testing.T) {
	requestBody := `{"model":"claude-3-haiku-20240307","messages":[{"role":"user","content":"hello"}]}`
	mockResponse := `{"id":"msg_test","type":"message","role":"assistant","content":[]}`

	var capturedBody []byte

	mockAnthropic := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var err error
		capturedBody, err = io.ReadAll(r.Body)
		if err != nil {
			t.Errorf("failed to read body on mock server: %v", err)
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(mockResponse))
	}))
	defer mockAnthropic.Close()

	h := makeHandler(mockAnthropic.URL)

	req := httptest.NewRequest(http.MethodPost, "/api/ai", strings.NewReader(requestBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+testAppToken)
	rec := httptest.NewRecorder()

	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 from proxy, got %d — body: %s", rec.Code, rec.Body.String())
	}

	if string(capturedBody) != requestBody {
		t.Fatalf("mock did not receive expected body\nwant: %s\ngot:  %s", requestBody, capturedBody)
	}

	if rec.Body.String() != mockResponse {
		t.Fatalf("proxy did not forward mock response\nwant: %s\ngot:  %s", mockResponse, rec.Body.String())
	}
}

// --- TestProxy_KeyInHeaderNotBody ---

func TestProxy_KeyInHeaderNotBody(t *testing.T) {
	var capturedHeaders http.Header
	var capturedBody []byte

	mockAnthropic := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedHeaders = r.Header.Clone()
		var err error
		capturedBody, err = io.ReadAll(r.Body)
		if err != nil {
			t.Errorf("failed to read body on mock server: %v", err)
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"id":"msg_test"}`))
	}))
	defer mockAnthropic.Close()

	h := makeHandler(mockAnthropic.URL)

	payload := `{"model":"claude-3-haiku-20240307","messages":[]}`
	req := httptest.NewRequest(http.MethodPost, "/api/ai", strings.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+testAppToken)
	rec := httptest.NewRecorder()

	h.ServeHTTP(rec, req)

	// Key must be in x-api-key header
	apiKey := capturedHeaders.Get("X-Api-Key")
	if apiKey != testAnthropicKey {
		t.Fatalf("expected x-api-key=%q on forwarded request, got %q", testAnthropicKey, apiKey)
	}

	// anthropic-version header must be set
	version := capturedHeaders.Get("Anthropic-Version")
	if version == "" {
		t.Fatal("anthropic-version header not set on forwarded request")
	}

	// Key must NOT appear in forwarded body
	if strings.Contains(string(capturedBody), testAnthropicKey) {
		t.Fatal("SECURITY: Anthropic API key found in forwarded request body")
	}

	// Authorization header sent by client must NOT be forwarded to Anthropic
	forwardedAuth := capturedHeaders.Get("Authorization")
	if forwardedAuth != "" {
		t.Fatalf("client Authorization header must not be forwarded to Anthropic, got %q", forwardedAuth)
	}
}

// --- TestProxy_KeyNeverLogged ---
// Structural test: the proxy never passes h.AnthropicKey to any fmt or log function.
// The real enforcement is the code structure in proxy.go — this test documents the contract.
// We verify indirectly: run a request through and assert no leakage in the response body.
func TestProxy_KeyNeverLogged(t *testing.T) {
	mockAnthropic := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"id":"msg_test"}`))
	}))
	defer mockAnthropic.Close()

	h := makeHandler(mockAnthropic.URL)

	req := httptest.NewRequest(http.MethodPost, "/api/ai", strings.NewReader(`{"model":"test","messages":[]}`))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+testAppToken)
	rec := httptest.NewRecorder()

	h.ServeHTTP(rec, req)

	// Key must never appear in any HTTP response to the client
	if strings.Contains(rec.Body.String(), testAnthropicKey) {
		t.Fatal("SECURITY: Anthropic API key found in response body sent to client")
	}
	if strings.Contains(rec.Header().Get("X-Api-Key"), testAnthropicKey) {
		t.Fatal("SECURITY: Anthropic API key found in response header sent to client")
	}
}

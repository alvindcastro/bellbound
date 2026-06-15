import { isAiEnabled } from './aiSettings.js';
import { noOpAiClient } from './noOpAiClient.js';
import { createProxyAiClient } from './proxyAiClient.js';
import type { AiClient } from './types.js';

export function getAiClient(options?: { online?: boolean }): AiClient {
  const online =
    options?.online ?? (typeof navigator !== 'undefined' ? navigator.onLine : false);

  if (!isAiEnabled() || !online) {
    return noOpAiClient;
  }

  const proxyUrl =
    typeof import.meta !== 'undefined' && import.meta.env
      ? (import.meta.env['VITE_AI_PROXY_URL'] ?? '')
      : '';
  const authToken =
    typeof import.meta !== 'undefined' && import.meta.env
      ? (import.meta.env['VITE_AI_AUTH_TOKEN'] ?? '')
      : '';

  return createProxyAiClient(proxyUrl, authToken);
}

export { noOpAiClient } from './noOpAiClient.js';
export { validateParsedNote } from './parseValidator.js';
export { isAiEnabled, setAiEnabled, _resetAiSettings } from './aiSettings.js';
export type { AiClient, ParsedNote, LoreContext } from './types.js';

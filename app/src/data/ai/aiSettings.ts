let _enabled = false;

export function isAiEnabled(): boolean {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('bellbound-ai-enabled') === 'true';
  }
  return _enabled;
}

export function setAiEnabled(val: boolean): void {
  _enabled = val;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('bellbound-ai-enabled', val ? 'true' : 'false');
  }
}

export function _resetAiSettings(): void {
  _enabled = false;
}

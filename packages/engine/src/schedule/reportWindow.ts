export function getReportWindow(today: string): string[] {
  const result: string[] = [];
  const base = new Date(today + 'T00:00:00');
  for (let i = 6; i >= 0; i--) {
    const d = new Date(base.getTime() - i * 24 * 60 * 60 * 1000);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    result.push(`${year}-${month}-${day}`);
  }
  return result;
}

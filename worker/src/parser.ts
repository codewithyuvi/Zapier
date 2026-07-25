export function parseDynamicData(template: string, payload: any): string {
  if (!template) return "";
  return template.replace(/\{payload\.([^}]+)\}/g, (_, key) => {
    return payload[key] !== undefined ? String(payload[key]) : "";
  });
}

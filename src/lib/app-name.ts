export function getAppName(): string {
  const configured = import.meta.env.VITE_APP_NAME?.trim()
  return configured || "My App"
}

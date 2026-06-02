export function getFriendlyError(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message.toLowerCase();

  if (message.includes("failed to fetch") || message.includes("networkerror")) {
    return "No se pudo conectar con el backend. Verifica que el servicio este activo.";
  }

  if (
    message.includes("getusermedia") ||
    message.includes("microfono") ||
    message.includes("microphone") ||
    message.includes("permission denied") ||
    message.includes("notallowederror")
  ) {
    return "El navegador bloqueo el microfono. Usa HTTPS o permite acceso al microfono para usar el Voice Agent.";
  }

  return error.message || fallback;
}

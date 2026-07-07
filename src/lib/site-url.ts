function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

function configuredSiteUrl(): string | null {
  const value = process.env.SITE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return value ? trimTrailingSlash(value) : null;
}

function isLocalHost(host: string): boolean {
  const normalized = host.toLowerCase();
  return (
    normalized.startsWith("localhost") ||
    normalized.startsWith("127.0.0.1") ||
    normalized.startsWith("0.0.0.0") ||
    normalized.endsWith(".local")
  );
}

/**
 * QR·공유 링크용 공개 사이트 URL.
 * SITE_URL 환경 변수가 있으면 우선 사용하고, 없으면 프록시 헤더/요청 호스트로 추론합니다.
 */
export function getPublicSiteUrl(request: Request): string {
  const configured = configuredSiteUrl();
  if (configured) return configured;

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (forwardedHost) {
    const host = forwardedHost.split(",")[0]?.trim();
    const proto = (forwardedProto?.split(",")[0]?.trim() || "https").replace(/:$/, "");
    if (host && !isLocalHost(host)) {
      return `${proto}://${host}`;
    }
  }

  const host = request.headers.get("host");
  if (host && !isLocalHost(host)) {
    const proto =
      forwardedProto?.split(",")[0]?.trim() ||
      (process.env.NODE_ENV === "production" ? "https" : "http");
    return `${proto.replace(/:$/, "")}://${host}`;
  }

  return trimTrailingSlash(new URL(request.url).origin);
}

export function getPublicLoginUrl(request: Request): string {
  return `${getPublicSiteUrl(request)}/login`;
}

/**
 * Returns the client IP supplied by the hosting platform. On Vercel,
 * x-vercel-forwarded-for is set at the edge and cannot be supplied by the
 * browser. The other headers are only a local-development fallback.
 */
export function getClientIp(headers: Headers): string {
  const raw = headers.get('x-vercel-forwarded-for')
    || headers.get('x-real-ip')
    || (process.env.VERCEL ? null : headers.get('x-forwarded-for'))

  const ip = raw?.split(',')[0]?.trim()
  return ip && ip.length <= 64 ? ip : 'unknown'
}

export function hasOversizedBody(headers: Headers, maxBytes: number): boolean {
  const length = Number(headers.get('content-length'))
  return Number.isFinite(length) && length > maxBytes
}

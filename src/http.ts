export const MAX_BODY_BYTES = 32 * 1024;

export class BodyError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Count streamed bytes as well as Content-Length, including chunked requests. */
export async function readBoundedJson(request: Request): Promise<unknown> {
  const declared = request.headers.get("content-length");
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > MAX_BODY_BYTES)) {
    throw new BodyError(413, "Request body is too large.");
  }
  if (!request.body) throw new BodyError(400, "Invalid JSON.");

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new BodyError(413, "Request body is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(bytes));
  } catch {
    throw new BodyError(400, "Invalid JSON.");
  }
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function rpcError(status: number, code: number, message: string, id: unknown = null): Response {
  const safeId = typeof id === "string" || typeof id === "number" ? id : null;
  return Response.json({ jsonrpc: "2.0", id: safeId, error: { code, message } }, { status });
}

export function secureResponse(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("X-Robots-Tag", "noindex");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

import { McpServer, hostHeaderValidationResponse, originValidationResponse } from "@modelcontextprotocol/server";
import { createMcpHandler } from "agents/mcp/server";
import { z } from "zod";
import councilMethod from "../COUNCIL.md";
import { BodyError, isObject, readBoundedJson, rpcError, secureResponse } from "./http";

const ALLOWED_HOSTS = ["councils.middle3rd.com", "localhost", "127.0.0.1", "[::1]"];
const ALLOWED_ORIGINS = [
  "councils.middle3rd.com", "middle3rd.com", "www.middle3rd.com",
  "claude.ai", "chatgpt.com", "localhost", "127.0.0.1", "[::1]",
];
const TOOL_NAME = "get_council_method";

function createServer(): McpServer {
  const server = new McpServer(
    { name: "m3s-councils", version: "0.1.0", title: "M3S Councils" },
    {
      capabilities: { tools: { listChanged: false } },
      instructions: "Use get_council_method with no arguments to retrieve the public M3S Council method. Apply it in this conversation with the user's AI host. Do not send decision text, files, URLs, credentials, or personal information to this tool. The tool distributes instructions; it does not run a council or make decisions.",
    },
  );
  server.registerTool(TOOL_NAME, {
    title: "Get the M3S Council method",
    description: "Use this when the user wants to stress-test a business decision with the M3S Council method. Returns public instructions for five advisory seats, evidence checks, and a decision brief. Call with an empty object. No decision text or other inputs are accepted. Run the method in the user's AI host; the human owns the decision.",
    inputSchema: z.strictObject({}, { error: "This tool accepts no arguments. Keep decision text in your AI host." }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    _meta: {
      securitySchemes: [{ type: "noauth" }],
      "openai/toolInvocation/invoking": "Loading the Council method",
      "openai/toolInvocation/invoked": "Council method ready",
    },
  }, async () => ({ content: [{ type: "text", text: councilMethod }] }));
  return server;
}

async function respond(request: Request): Promise<Response> {
  // Validate before reading a body. Origin-less service clients remain valid.
  const rejection = hostHeaderValidationResponse(request, ALLOWED_HOSTS)
    ?? originValidationResponse(request, ALLOWED_ORIGINS);
  if (rejection) return rejection;

  const url = new URL(request.url);
  if (url.search) return new Response("Query parameters are not accepted.", { status: 400 });
  if (url.pathname === "/" && (request.method === "GET" || request.method === "HEAD")) {
    const body = "M3S Councils\n\nPublic MCP endpoint: https://councils.middle3rd.com/mcp\nAuthentication: none\nTool: get_council_method (no arguments)\n\nThis service returns the public Council method. Your AI host runs the council.\nThe application does not store decision text or run an inference API.\nLearn more: https://middle3rd.com/councils/\n";
    return new Response(request.method === "HEAD" ? null : body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
  if (url.pathname !== "/mcp") return new Response("Not found.", { status: 404 });

  const handler = createMcpHandler(createServer, {
    route: "/mcp",
    legacy: "stateless",
    responseMode: "json",
    allowedHostnames: ALLOWED_HOSTS,
    allowedOriginHostnames: ALLOWED_ORIGINS,
    // No application logging. Errors return generic SDK protocol responses.
    onerror: () => {},
  });
  if (request.method !== "POST") return handler.fetch(request);
  if (request.headers.get("content-encoding") && request.headers.get("content-encoding") !== "identity") {
    return rpcError(415, -32600, "Compressed request bodies are not accepted.");
  }
  if (request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== "application/json") {
    return rpcError(415, -32600, "Content-Type must be application/json.");
  }

  let body: unknown;
  try {
    body = await readBoundedJson(request);
  } catch (error) {
    if (error instanceof BodyError) return rpcError(error.status, error.status === 400 ? -32700 : -32600, error.message);
    return rpcError(400, -32600, "Unable to read request.");
  }
  if (!isObject(body)) return rpcError(400, -32600, "A single JSON-RPC request is required.");
  // Reject extra inputs without quoting their keys or contents in validation errors.
  if (body.method === "tools/call" && isObject(body.params)) {
    const meta = isObject(body.params._meta) ? body.params._meta : {};
    const version = meta["io.modelcontextprotocol/protocolVersion"];
    const legacy = version === undefined && !request.headers.has("Mcp-Method")
      && request.headers.get("MCP-Protocol-Version") !== "2026-07-28";
    const matchingModernHeaders = version === "2026-07-28"
      && request.headers.get("MCP-Protocol-Version") === version
      && request.headers.get("Mcp-Method") === body.method
      && request.headers.get("Mcp-Name") === body.params.name;
    // Leave invalid or unknown modern envelopes to SDK transport validation first.
    if (!legacy && !matchingModernHeaders) return handler.fetch(request, { parsedBody: body });
    const args = body.params.arguments;
    if (body.params.name !== TOOL_NAME) return rpcError(400, -32602, "Unknown tool.", body.id);
    if (args !== undefined && (!isObject(args) || Object.keys(args).length !== 0)) {
      return rpcError(400, -32602, "This tool accepts no arguments. Keep decision text in your AI host.", body.id);
    }
  }
  return handler.fetch(request, { parsedBody: body });
}

export default {
  async fetch(request: Request): Promise<Response> {
    try {
      return secureResponse(await respond(request));
    } catch {
      return secureResponse(rpcError(500, -32603, "Internal server error."));
    }
  },
} satisfies ExportedHandler<Env>;

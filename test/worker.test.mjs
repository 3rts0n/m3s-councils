import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { Client } from "@modelcontextprotocol/client";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { Client as LegacyClient } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport as LegacyTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const root = new URL("../", import.meta.url);
const method = await readFile(new URL("COUNCIL.md", root), "utf8");
let child;
let base;
let output = "";

before(async () => {
  const reservation = createServer();
  reservation.listen(0, "127.0.0.1");
  await once(reservation, "listening");
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  base = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath, ["node_modules/wrangler/bin/wrangler.js", "dev", "--local", "--ip", "127.0.0.1", "--port", String(port), "--show-interactive-dev-session=false"], {
    cwd: root, stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, WRANGLER_SEND_METRICS: "false", BROWSER: "none" },
  });
  for (const stream of [child.stdout, child.stderr]) stream.on("data", chunk => { output = (output + chunk).slice(-12000); });
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw new Error(`Worker exited: ${output}`);
    try { if ((await fetch(base, { signal: AbortSignal.timeout(500) })).ok) return; } catch {}
    await delay(200);
  }
  throw new Error(`Worker did not start: ${output}`);
}, { timeout: 30000 });

after(async () => {
  if (child && child.exitCode === null) {
    const exited = once(child, "exit");
    child.kill("SIGTERM");
    await exited;
  }
});

function modern(methodName, params = {}, headers = {}) {
  const body = {
    jsonrpc: "2.0", id: 1, method: methodName,
    params: { ...params, _meta: { "io.modelcontextprotocol/protocolVersion": "2026-07-28", "io.modelcontextprotocol/clientCapabilities": {} } },
  };
  return fetch(`${base}/mcp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json", Accept: "application/json, text/event-stream",
      "MCP-Protocol-Version": "2026-07-28", "Mcp-Method": methodName,
      ...(methodName === "tools/call" ? { "Mcp-Name": params.name } : {}), ...headers,
    }, body: JSON.stringify(body),
  });
}

test("modern SDK client lists one public no-input tool and retrieves the exact bundled method", async () => {
  const client = new Client({ name: "councils-modern-test", version: "1.0.0" }, { versionNegotiation: { mode: { pin: "2026-07-28" } } });
  try {
    await client.connect(new StreamableHTTPClientTransport(new URL(`${base}/mcp`)));
    assert.equal(client.getProtocolEra(), "modern");
    assert.equal(client.getServerCapabilities().tools.listChanged, false);
    const { tools } = await client.listTools();
    assert.equal(tools.length, 1);
    assert.equal(tools[0].name, "get_council_method");
    assert.deepEqual(tools[0].inputSchema.properties, {});
    assert.equal(tools[0].inputSchema.additionalProperties, false);
    assert.equal(tools[0].annotations.readOnlyHint, true);
    assert.deepEqual(tools[0]._meta.securitySchemes, [{ type: "noauth" }]);
    const result = await client.callTool({ name: "get_council_method", arguments: {} });
    assert.deepEqual(result.content, [{ type: "text", text: method }]);
  } finally { await client.close(); }
});

test("legacy SDK client completes initialize and retrieves the same method without a persistent session", async () => {
  const client = new LegacyClient({ name: "councils-legacy-test", version: "1.0.0" });
  const transport = new LegacyTransport(new URL(`${base}/mcp`));
  try {
    await client.connect(transport);
    assert.equal(transport.sessionId, undefined);
    assert.equal((await client.listTools()).tools.length, 1);
    const result = await client.callTool({ name: "get_council_method", arguments: {} });
    assert.deepEqual(result.content, [{ type: "text", text: method }]);
  } finally { await client.close(); }
});

test("modern HTTP header mismatches are rejected by the SDK", async () => {
  const response = await modern("tools/list", {}, { "Mcp-Method": "tools/call" });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, -32020);
  const call = await modern("tools/call", { name: "get_council_method", arguments: { privateInput: "PRIVATE_DECISION_TEXT" } }, { "Mcp-Name": "mismatched" });
  assert.equal(call.status, 400);
  assert.equal((await call.json()).error.code, -32020);
});

test("extra tool arguments are rejected without reflecting their keys or values", async () => {
  const response = await modern("tools/call", { name: "get_council_method", arguments: { PRIVATE_DECISION_KEY: "PRIVATE_DECISION_TEXT" } });
  assert.equal(response.status, 400);
  const text = await response.text();
  assert.ok(!text.includes("PRIVATE_DECISION"));
  assert.match(text, /accepts no arguments/);
});

test("untrusted and opaque Origins are rejected, intended hosts and no Origin are accepted", async () => {
  for (const origin of ["https://untrusted.example", "null", "file:///"]) {
    assert.equal((await modern("tools/list", {}, { Origin: origin })).status, 403);
  }
  for (const origin of ["https://claude.ai", "https://chatgpt.com", "https://councils.middle3rd.com"]) {
    assert.equal((await modern("tools/list", {}, { Origin: origin })).status, 200);
  }
  assert.equal((await modern("tools/list")).status, 200);
});

test("CORS preflight includes the required modern MCP headers", async () => {
  const response = await fetch(`${base}/mcp`, { method: "OPTIONS", headers: { Origin: "https://chatgpt.com", "Access-Control-Request-Method": "POST" } });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("access-control-allow-headers"), /Mcp-Method/i);
  assert.match(response.headers.get("access-control-allow-headers"), /Mcp-Name/i);
});

test("HTTP boundary rejects invalid body formats and unknown routes", async () => {
  for (const body of ["{malformed", "[]", "null"]) {
    assert.equal((await fetch(`${base}/mcp`, { method: "POST", headers: { "Content-Type": "application/json" }, body })).status, 400);
  }
  assert.equal((await fetch(`${base}/mcp`, { method: "POST", headers: { "Content-Type": "text/plain" }, body: "{}" })).status, 415);
  assert.equal((await fetch(`${base}/mcp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "x".repeat(32769) })).status, 413);
  assert.equal((await fetch(`${base}/mcp?decision=PRIVATE_DECISION_TEXT`)).status, 400);
  for (const path of ["/.well-known/oauth-authorization-server", "/.well-known/oauth-protected-resource", "/sse", "/missing"]) {
    assert.equal((await fetch(base + path)).status, 404);
  }
  for (const method of ["GET", "DELETE"]) assert.equal((await fetch(`${base}/mcp`, { method })).status, 405);
});

test("concurrent requests return identical public content without sessions", async () => {
  const responses = await Promise.all(Array.from({ length: 6 }, () => modern("tools/call", { name: "get_council_method", arguments: {} })));
  for (const response of responses) {
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("mcp-session-id"), null);
    assert.deepEqual((await response.json()).result.content, [{ type: "text", text: method }]);
  }
});

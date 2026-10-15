import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { Client as LegacyClient } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport as LegacyTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

// Explicit opt-in: npm test never invokes this script or contacts a public host.
const argument = process.argv[2];
let endpoint;
try {
  assert.equal(process.argv.length, 3);
  endpoint = new URL(argument);
  assert.equal(endpoint.protocol, "https:");
  assert.ok(!endpoint.username && !endpoint.password && !endpoint.search && !endpoint.hash);
} catch {
  console.error("Usage: npm run smoke -- https://your-public-host.example/mcp");
  console.error("Supply one HTTPS endpoint without credentials, query parameters, or a fragment.");
  process.exit(1);
}

const digest = text => createHash("sha256").update(text, "utf8").digest("hex");
const expectedHash = digest(await readFile(new URL("../COUNCIL.md", import.meta.url), "utf8"));
const watchdog = setTimeout(() => {
  console.error("MCP smoke check timed out after 30 seconds.");
  process.exit(1);
}, 30_000);
watchdog.unref();

async function check(label, client, transport) {
  try {
    await client.connect(transport);
    if (label === "modern") assert.equal(client.getProtocolEra(), "modern");
    const { tools } = await client.listTools();
    assert.equal(tools.length, 1, "Expected exactly one public tool.");
    const tool = tools[0];
    assert.equal(tool.name, "get_council_method");
    assert.deepEqual(tool.inputSchema.properties, {});
    assert.equal(tool.inputSchema.additionalProperties, false);
    assert.equal(tool.annotations?.readOnlyHint, true);
    assert.equal(tool.annotations?.openWorldHint, false);
    assert.deepEqual(tool._meta?.securitySchemes, [{ type: "noauth" }]);
    const result = await client.callTool({ name: tool.name, arguments: {} });
    assert.ok(!result.isError, "Tool returned an error.");
    assert.equal(result.content?.length, 1, "Expected one public text result.");
    assert.equal(result.content[0].type, "text");
    const actualHash = digest(result.content[0].text);
    assert.equal(actualHash, expectedHash, "Deployed method differs from this checkout's COUNCIL.md.");
    console.log(`${label}: ${tool.name} OK; SHA-256 ${actualHash}`);
  } finally {
    await client.close();
  }
}

try {
  await check("modern",
    new Client({ name: "m3s-councils-smoke", version: "0.1.0" }, { versionNegotiation: { mode: { pin: "2026-07-28" } } }),
    new StreamableHTTPClientTransport(endpoint));
  await check("legacy",
    new LegacyClient({ name: "m3s-councils-smoke", version: "0.1.0" }),
    new LegacyTransport(endpoint));
} catch (error) {
  console.error("MCP smoke check failed:", error instanceof Error ? error.message : "Unknown error.");
  process.exitCode = 1;
} finally {
  clearTimeout(watchdog);
}

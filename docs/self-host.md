# Self-host the public method connector

Most people should use the hosted URL or copy the prompt. This guide is for developers who want to inspect, adapt, or host the connector themselves.

The M3S-hosted endpoint is in public beta, checked October 14, 2026. See the [verification record](connect.md#verification-record) for the automated and host-specific checks completed so far. Repository publication is pending.

## What runs

The Cloudflare Worker exposes one no-auth tool, `get_council_method`. It returns the bundled `COUNCIL.md` and accepts no arguments. The connected AI host performs the council. The Worker uses no model API, private data source, application storage, or application logging.

The implementation uses Cloudflare's stateless MCP handler. No Durable Object, database, API key, or inference service is required. Hosting remains subject to your Cloudflare account's terms and limits.

Relevant files:

| File | Purpose |
| --- | --- |
| `COUNCIL.md` | Canonical public method bundled into the Worker |
| `src/index.ts` | MCP tool registration and HTTP routes |
| `src/http.ts` | Request boundary, including the 32 KiB body limit |
| `wrangler.jsonc` | Worker name, custom domain, and deployment settings |
| `package.json` and `package-lock.json` | Scripts and pinned dependency resolution |
| `worker-configuration.d.ts` | Generated Cloudflare binding types |

## Install and verify

Use Node.js 22.13 or newer and npm. From the repository root:

```sh
npm ci
npm run check
npm test
```

`check` regenerates binding types, checks TypeScript, and runs a Wrangler dry-run deployment. `test` starts a local Worker and checks it through modern and legacy MCP clients. These checks do not call a model API.

For local development:

```sh
npm run dev
```

Use the local address printed by Wrangler, with `/mcp` as the path. A local server must be made publicly reachable before a remote host such as Claude or ChatGPT can connect. Local development alone does not provide a hosted connection URL.

## Configure your deployment

1. Choose your own Worker name and a domain managed in your Cloudflare account.
2. Update `wrangler.jsonc`: change the Worker name and custom-domain route. Do not deploy to the M3S domain.
3. Keep `workers_dev` and `preview_urls` disabled if the custom domain is your only intended public address.
4. Update any allowed Host or Origin configuration to match your own endpoint. Preserve validation of supplied origins.
5. Review the bundled method and the public privacy notice. Decide which hosting logs and analytics your own deployment enables; do not copy a privacy claim that your settings do not satisfy.
6. Authenticate Wrangler to your Cloudflare account using the normal Cloudflare login flow.

When you are ready to publish your own service:

```sh
npm run deploy
```

This command publishes the Worker and its configured route. Check the target account and domain before running it.

## Check the deployed endpoint

Run the live smoke check against your HTTPS endpoint, replacing this example address:

```sh
npm run smoke -- https://your-public-host.example/mcp
```

The command uses official modern and legacy MCP clients. It checks discovery and tool retrieval, then compares the returned method's SHA-256 with the local `COUNCIL.md`. It contacts the endpoint you supply and makes no model API call.

Verify through an MCP client, not just a browser:

1. Discovery and initialization work for each supported protocol version.
2. Tool listing returns exactly `get_council_method` with an empty input schema.
3. Calling it without arguments returns the bundled method.
4. Unknown tools, nonempty arguments, query strings, oversized bodies, and invalid supplied Hosts or Origins are rejected.
5. Error messages do not echo tool argument keys or values, and application logging is disabled. JSON-RPC responses echo the request ID.
6. Claude and ChatGPT can discover and invoke the tool in an account that allows custom connectors.

Opening `/mcp` in a browser is not an end-to-end MCP test. The root status route can show that a Worker is reachable, but it does not establish tool compatibility.

## Changes and packaging

Keep `COUNCIL.md` as the source of truth. After updating the method, run `python3 scripts/build-distributions.py` to sync the skill reference and rebuild the downloadable ZIP and checksum. Rerun the checks before publishing changes.

Runtime dependencies keep their own licenses. The method, code, and documentation use [Apache-2.0](../LICENSE).

Technical references: [Cloudflare remote MCP guide](https://developers.cloudflare.com/agents/model-context-protocol/guides/remote-mcp-server/), [MCP TypeScript SDK protocol versions](https://ts.sdk.modelcontextprotocol.io/v2/protocol-versions), and [MCP Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http).

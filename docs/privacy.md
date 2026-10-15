# Privacy and data flow

Public beta, checked October 14, 2026. This note describes the method-only service hosted at `https://councils.middle3rd.com/mcp`.

## The method tool needs no decision text

The public connector exposes one tool, `get_council_method`. It has no arguments and returns the same public instructions in [COUNCIL.md](../COUNCIL.md). It does not need your question, business records, or conversation history to do that job.

Your assistant uses those instructions to run the council. Claude, ChatGPT, or another host processes your conversation under that provider's account settings and terms. The connector does not change them. Share only information you are authorized to give your chosen provider.

## What the service does

- Returns the bundled public council method.
- Rejects tool arguments, including decision text and file paths.
- Uses no model API and performs no council inference.
- Connects to no private library, account, client record, or other data source.
- Writes no application logs and stores no decisions or conversation history.

The HTTP server still receives and processes requests, including invalid requests, to respond to them. An empty tool schema reduces the information needed for a normal call; it cannot prevent a client from transmitting unwanted content in a malformed request.

## Hosting and network metadata

The hosted service runs on Cloudflare. Like other internet infrastructure, it processes network and operational information such as IP addresses, request timing, routes, protocol information, and error or security signals. The service's application logging is disabled. That is not a claim that no infrastructure metadata is processed or retained.

Cloudflare's handling is governed by its [privacy policy](https://www.cloudflare.com/privacypolicy/) and the hosting account's configuration. The deployed Worker configuration disables Workers observability, including invocation logs and traces. This application setting does not govern all infrastructure metadata.

## Prompt, skill, and self-hosted copies

The Markdown method and skill contain no telemetry or network code. Your AI host may use its own tools while following the method and applies its own data handling. A self-hosted connector is subject to the configuration and policies of whoever runs it.

## Questions

Contact [dr@middle3rd.com](mailto:dr@middle3rd.com) with questions about this service. Do not send a confidential decision or client record with a support request.

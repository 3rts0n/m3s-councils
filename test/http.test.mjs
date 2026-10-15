import assert from "node:assert/strict";
import test from "node:test";
import { BodyError, MAX_BODY_BYTES, readBoundedJson } from "../src/http.ts";

function streamed(chunks, onCancel = () => {}) {
  let index = 0;
  return new Request("https://councils.middle3rd.com/mcp", {
    method: "POST", duplex: "half",
    body: new ReadableStream({
      pull(controller) {
        if (index === chunks.length) controller.close();
        else controller.enqueue(new TextEncoder().encode(chunks[index++]));
      },
      cancel: onCancel,
    }),
  });
}

test("bounded parser handles JSON split across chunks", async () => {
  assert.deepEqual(await readBoundedJson(streamed(['{"name":', '"council"}'])), { name: "council" });
});

test("oversized chunked body is rejected and stream is canceled", async () => {
  let canceled = false;
  await assert.rejects(readBoundedJson(streamed(['x'.repeat(MAX_BODY_BYTES), 'x', 'unread'], () => { canceled = true; })),
    error => error instanceof BodyError && error.status === 413);
  assert.equal(canceled, true);
});

test("declared oversize body is rejected before reading", async () => {
  const request = new Request("https://councils.middle3rd.com/mcp", {
    method: "POST", headers: { "Content-Length": String(MAX_BODY_BYTES + 1) }, body: "{}",
  });
  await assert.rejects(readBoundedJson(request), error => error.status === 413);
  assert.equal(request.bodyUsed, false);
});

test("malformed JSON errors do not echo input", async () => {
  await assert.rejects(readBoundedJson(streamed(['PRIVATE_DECISION_TEXT'])),
    error => error.status === 400 && error.message === "Invalid JSON.");
});

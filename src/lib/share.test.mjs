import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const notices = [];
globalThis.__shareTestToast = {
  success: (...args) => notices.push(["success", ...args]),
  error: (...args) => notices.push(["error", ...args]),
};
const source = (await readFile(new URL("./share.ts", import.meta.url), "utf8"))
  .replace('import { toast } from "sonner";', "const toast = globalThis.__shareTestToast;");
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { shareNatively, getPostShareUrl } = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
const postId = "12345678-1234-4234-8234-123456789abc";
const url = `https://www.famousvibe.com/vibe/${postId}`;
function setup(share) {
  const copied = [];
  notices.length = 0;
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { share, clipboard: { writeText: async (value) => copied.push(value) } } });
  return copied;
}
test("share links keep the exact full ID and requested domain", () => {
  assert.equal(getPostShareUrl(postId), url);
});
test("unsupported native share copies the exact reel URL", async () => {
  const copied = setup(undefined);
  await shareNatively(postId);
  assert.deepEqual(copied, [url]);
  assert.equal(notices[0][0], "success");
});
test("failed native share copies the exact reel URL without an error notice", async () => {
  const copied = setup(async () => { throw new DOMException("Unavailable", "NotAllowedError"); });
  await shareNatively(postId);
  assert.deepEqual(copied, [url]);
  assert.deepEqual(notices.map((notice) => notice[0]), ["success"]);
});
test("canceling native sharing neither copies nor shows an error", async () => {
  const copied = setup(async () => { throw new DOMException("Canceled", "AbortError"); });
  await shareNatively(postId);
  assert.deepEqual(copied, []);
  assert.deepEqual(notices, []);
});
test("successful native sharing sends only the clean URL with no caption text", async () => {
  let shared;
  const copied = setup(async (payload) => { shared = payload; });
  await shareNatively(postId);
  assert.deepEqual(shared, { url });
  assert.equal(shared.text, undefined);
  assert.equal(shared.title, undefined);
  assert.deepEqual(copied, []);
});

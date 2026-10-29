// Unit tests for the Basecamp gate: `npm test` (node:test, Node strips the types).
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BASECAMP_HOST, PRIMARY_DOMAIN, gate } from "./config.ts";
import { handleGate, type GateDeps } from "./gate-handler.ts";
import {
  base64url,
  originAllowed,
  passwordMatches,
  readCookie,
  safeNext,
  signCookie,
  timingSafeEqual,
  verifyCookie,
} from "./gate.ts";
import { serialize, type PageModel } from "./page.ts";

const NOW = 1_800_000_000;
const PASSWORD = "summit-test-password";
const host = new URL(`https://${BASECAMP_HOST}/`);

describe("cookie", () => {
  it("verifies a value it signed, until it expires", async () => {
    const value = await signCookie(PASSWORD, NOW + gate.maxAgeSeconds);
    assert.match(value, /^\d+\.[A-Za-z0-9_-]{43}$/);
    assert.equal(await verifyCookie(PASSWORD, value, NOW), true);
    assert.equal(await verifyCookie(PASSWORD, value, NOW + gate.maxAgeSeconds - 1), true);
    assert.equal(await verifyCookie(PASSWORD, value, NOW + gate.maxAgeSeconds), false);
    assert.equal(await verifyCookie(PASSWORD, value, NOW + gate.maxAgeSeconds + 3600), false);
  });

  it("refuses expiries further out than a fresh cookie's", async () => {
    const value = await signCookie(PASSWORD, NOW + 10 * gate.maxAgeSeconds);
    assert.equal(await verifyCookie(PASSWORD, value, NOW), false);
  });

  it("refuses a tampered signature or expiry", async () => {
    const value = await signCookie(PASSWORD, NOW + 3600);
    const [expiry, signature] = value.split(".");
    const flipped = signature.slice(0, -1) + (signature.endsWith("A") ? "B" : "A");
    assert.equal(await verifyCookie(PASSWORD, `${expiry}.${flipped}`, NOW), false);
    assert.equal(await verifyCookie(PASSWORD, `${Number(expiry) + 1}.${signature}`, NOW), false);
    assert.equal(await verifyCookie(PASSWORD, `${expiry}.${base64url(new Uint8Array(32))}`, NOW), false);
  });

  it("refuses malformed values", async () => {
    for (const value of [null, undefined, "", "abc", "123", ".", `${NOW + 60}.`, `x${NOW + 60}.${"A".repeat(43)}`, `${NOW + 60}.${"A".repeat(44)}`]) {
      assert.equal(await verifyCookie(PASSWORD, value, NOW), false, String(value));
    }
  });

  it("is invalidated by a password change (the key is derived from the password)", async () => {
    const value = await signCookie(PASSWORD, NOW + 3600);
    assert.equal(await verifyCookie(`${PASSWORD}-new`, value, NOW), false);
    assert.equal(await verifyCookie(PASSWORD, value, NOW), true);
  });

  it("reads one cookie from a Cookie header", () => {
    assert.equal(readCookie(`a=1; ${gate.cookie}=v.alue; b=2`, gate.cookie), "v.alue");
    assert.equal(readCookie(`x${gate.cookie}=nope`, gate.cookie), null);
    assert.equal(readCookie(null, gate.cookie), null);
  });
});

describe("password comparison", () => {
  it("matches only the exact password", async () => {
    assert.equal(await passwordMatches(PASSWORD, PASSWORD), true);
    assert.equal(await passwordMatches(`${PASSWORD} `, PASSWORD), false);
    assert.equal(await passwordMatches("", PASSWORD), false);
    assert.equal(await passwordMatches("x", PASSWORD), false);
    assert.equal(await passwordMatches("", ""), false);
  });

  it("compares every byte, wherever the first difference is", () => {
    const counted = (bytes: number[]) => {
      const reads = { count: 0 };
      const array = new Proxy(new Uint8Array(bytes), {
        get(target, key) {
          if (typeof key === "string" && /^\d+$/.test(key)) reads.count++;
          const value = Reflect.get(target, key);
          return typeof value === "function" ? value.bind(target) : value;
        },
      });
      return { array, reads };
    };
    for (const differAt of [0, 15, 31, -1]) {
      const a = Array.from({ length: 32 }, (_, i) => i);
      const b = a.map((v, i) => (i === differAt ? v + 1 : v));
      const left = counted(a);
      const right = counted(b);
      assert.equal(timingSafeEqual(left.array, right.array), differAt === -1);
      assert.equal(left.reads.count, 32, `reads all bytes when bytes differ at ${differAt}`);
      assert.equal(right.reads.count, 32);
    }
    assert.equal(timingSafeEqual(new Uint8Array(2), new Uint8Array(3)), false);
  });
});

describe("next", () => {
  it("keeps same-host relative paths", () => {
    assert.equal(safeNext("/", host), "/");
    assert.equal(safeNext("/work/test-project/", host), "/work/test-project/");
    assert.equal(safeNext("/about/?hm=2048", host), "/about/?hm=2048");
    assert.equal(safeNext("/a/../about/", host), "/about/");
    assert.equal(safeNext("/work/test-project/index.htm?x=1", host), "/work/test-project/?x=1");
    assert.equal(safeNext("/index.html", host), "/");
  });

  it("refuses anything that could leave the host or loop back into the gate", () => {
    for (const value of [
      "https://evil.example/",
      "//evil.example/",
      "/\\evil.example/",
      "\\\\evil.example",
      "javascript:alert(1)",
      "evil.example",
      "/foo\nbar",
      "/\u0000",
      `https://${BASECAMP_HOST}/`,
      gate.unlock,
      gate.lock,
      `${gate.assets}x.css`,
      `/${"a".repeat(2000)}`,
      undefined,
      null,
      42,
    ]) {
      assert.equal(safeNext(value, host), "/", String(value));
    }
  });
});

describe("origin", () => {
  it("accepts PRIMARY_DOMAIN, the gated host itself, or no Origin", () => {
    assert.equal(originAllowed(null, host), true);
    assert.equal(originAllowed(`https://${PRIMARY_DOMAIN}`, host), true);
    assert.equal(originAllowed(host.origin, host), true);
    const preview = new URL("https://deploy-preview-7--example.netlify.app/.basecamp/unlock");
    assert.equal(originAllowed(preview.origin, preview), true);
  });

  it("refuses other origins", () => {
    for (const origin of ["null", "https://evil.example", `http://${PRIMARY_DOMAIN}`, `https://www.${PRIMARY_DOMAIN}`, `https://${PRIMARY_DOMAIN}.evil.example`, ""]) {
      assert.equal(originAllowed(origin, host), false, origin);
    }
  });
});

// --- the handler -------------------------------------------------------------------------------

const page: PageModel = {
  lang: "en",
  title: "Title",
  description: "Description",
  canonical: null,
  name: "Name",
  role: "Role",
  status: "Status",
  contact: [{ label: "Email", href: null }],
  placeholder: (label) => `[${label.toUpperCase()}]`,
  hud: { coordinates: "N", altitude: "ALT", clock: "Bern" },
  access: { heading: "Basecamp access", label: "Password", submit: "Enter", error: "Wrong password.", closed: "Closed.", username: "basecamp" },
  credit: { label: "Credit", href: null },
  css: "",
  script: "",
  preload: [],
};
const options = { page: serialize(page), csp: "default-src 'none'" };

function harness({ password }: { password: string | undefined } = { password: PASSWORD }) {
  const calls = { next: 0, waits: [] as number[], logs: [] as string[] };
  const deps: GateDeps = {
    password,
    now: () => NOW,
    next: async () => {
      calls.next++;
      return new Response("protected", { headers: { "Cache-Control": "public, max-age=31536000, immutable" } });
    },
    wait: async (ms) => void calls.waits.push(ms),
    log: (message) => void calls.logs.push(message),
  };
  const request = (path: string, init: RequestInit = {}) => handleGate(new Request(new URL(path, host), init), options, deps);
  const unlock = (body: Record<string, string>, headers: Record<string, string> = {}) =>
    request(gate.unlock, { method: "POST", body: new URLSearchParams(body), headers });
  return { calls, request, unlock };
}

const cookieFrom = (response: Response) => response.headers.get("Set-Cookie")!.split(";")[0];

describe("gate handler", () => {
  it("shows the gate page for any path without a valid cookie", async () => {
    const { calls, request } = harness();
    for (const path of ["/", "/work/test-project/", "/_next/static/chunks/app.js", "/terrain/heightmap-1536.webp", "/index.txt?_rsc=1", "/_basecamp/x.css"]) {
      const res = await request(path);
      assert.equal(res.status, 401, path);
      assert.match(res.headers.get("WWW-Authenticate")!, /^Cookie realm="Basecamp"/);
      assert.equal(res.headers.get("Cache-Control"), "no-store");
      assert.equal(res.headers.get("X-Robots-Tag"), "noindex, nofollow");
      assert.match(res.headers.get("Content-Type")!, /^text\/html/);
      const html = await res.text();
      assert.match(html, /<form method="post" action="\/\.basecamp\/unlock">/);
      assert.match(html, /autocomplete="current-password"/);
    }
    assert.equal(calls.next, 0);
    const res = await request("/work/test-project/?a=1");
    assert.match(await res.text(), /name="next" value="\/work\/test-project\/\?a=1"/);
  });

  it("lets the gate's own assets through and answers robots.txt itself", async () => {
    const { calls, request } = harness();
    assert.equal(await (await request(`${gate.assets}gate.css`)).text(), "protected");
    assert.equal(calls.next, 1);
    const robots = await request("/robots.txt");
    assert.equal(await robots.text(), "User-agent: *\nDisallow: /\n");
    assert.equal(robots.headers.get("X-Robots-Tag"), "noindex, nofollow");
  });

  it("unlocks with the right password: cookie, then 303 to next", async () => {
    const { calls, unlock, request } = harness();
    const res = await unlock({ password: PASSWORD, next: "/work/test-project/" }, { Origin: `https://${PRIMARY_DOMAIN}` });
    assert.equal(res.status, 303);
    assert.equal(res.headers.get("Location"), "/work/test-project/");
    const setCookie = res.headers.get("Set-Cookie")!;
    assert.match(setCookie, new RegExp(`^${gate.cookie.replace("-", "\\-")}=\\d+\\.[A-Za-z0-9_-]{43}; `));
    for (const attribute of ["Path=/", `Max-Age=${gate.maxAgeSeconds}`, "Secure", "HttpOnly", "SameSite=Lax"]) {
      assert.ok(setCookie.split("; ").includes(attribute), attribute);
    }
    assert.doesNotMatch(setCookie, /Domain=/i);
    assert.deepEqual(calls.waits, []);

    const inside = await request("/work/test-project/", { headers: { Cookie: cookieFrom(res) } });
    assert.equal(await inside.text(), "protected");
    assert.equal(inside.headers.get("X-Robots-Tag"), "noindex, nofollow");
    assert.equal(inside.headers.get("Cache-Control"), "private, max-age=31536000, immutable");
  });

  it("redirects to / when next is unsafe", async () => {
    const { unlock } = harness();
    const res = await unlock({ password: PASSWORD, next: "https://evil.example/" });
    assert.equal(res.headers.get("Location"), "/");
  });

  it("waits, then shows the gate again with an announced error on a wrong password", async () => {
    const { calls, unlock } = harness();
    const res = await unlock({ password: "wrong", next: "/about/" });
    assert.deepEqual(calls.waits, [gate.failureDelayMs]);
    assert.equal(res.status, 401);
    assert.equal(res.headers.get("Set-Cookie"), null);
    assert.equal(res.headers.get("Cache-Control"), "no-store");
    const html = await res.text();
    assert.match(html, /role="alert">Wrong password\.</);
    assert.match(html, /aria-invalid="true" aria-describedby="access-error"/);
    assert.match(html, /name="next" value="\/about\/"/);
  });

  it("refuses an unlock from another origin", async () => {
    const { calls, unlock } = harness();
    for (const origin of ["https://evil.example", "null"]) {
      const res = await unlock({ password: PASSWORD, next: "/" }, { Origin: origin });
      assert.equal(res.status, 403);
      assert.equal(res.headers.get("Set-Cookie"), null);
    }
    assert.equal(calls.next, 0);
    const own = await unlock({ password: PASSWORD, next: "/" }, { Origin: host.origin });
    assert.equal(own.status, 303);
  });

  it("answers GET on the unlock path with a redirect home", async () => {
    const { request } = harness();
    const res = await request(gate.unlock);
    assert.equal(res.status, 303);
    assert.equal(res.headers.get("Location"), "/");
  });

  it("locks: clears the cookie and shows the gate page", async () => {
    const { unlock, request } = harness();
    const cookie = cookieFrom(await unlock({ password: PASSWORD, next: "/" }));
    const res = await request(gate.lock, { headers: { Cookie: cookie } });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("Set-Cookie"), `${gate.cookie}=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax`);
    assert.match(await res.text(), /<form method="post"/);
  });

  it("logs everyone out when the password changes", async () => {
    const before = harness();
    const cookie = cookieFrom(await before.unlock({ password: PASSWORD, next: "/" }));
    const after = harness({ password: `${PASSWORD}-rotated` });
    const res = await after.request("/", { headers: { Cookie: cookie } });
    assert.equal(res.status, 401);
    assert.equal(after.calls.next, 0);
  });

  it("fails closed without a password and says why in one log line", async () => {
    const { calls, request, unlock } = harness({ password: undefined });
    const res = await request("/");
    assert.equal(res.status, 503);
    assert.equal(res.headers.get("Cache-Control"), "no-store");
    const html = await res.text();
    assert.match(html, /class="closed">Closed\.</);
    assert.doesNotMatch(html, /<form/);
    assert.equal((await unlock({ password: "", next: "/" })).status, 503);
    assert.equal((await request(gate.lock)).status, 503);
    assert.equal(calls.next, 0);
    assert.ok(calls.logs.length <= 1);
    assert.ok(calls.logs.every((line) => line.includes(gate.passwordEnv)));
  });
});

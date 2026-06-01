// @vitest-environment node
import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { SignJWT, jwtVerify } from "jose";

vi.mock("server-only", () => ({}));

const mockSet = vi.fn();
const mockGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve({ set: mockSet, get: mockGet })),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

async function importCreateSession() {
  const { createSession } = await import("../auth");
  return createSession;
}

test("createSession sets an auth-token cookie", async () => {
  const createSession = await importCreateSession();
  await createSession("user-1", "test@example.com");

  expect(mockSet).toHaveBeenCalledOnce();
  const [cookieName] = mockSet.mock.calls[0];
  expect(cookieName).toBe("auth-token");
});

test("createSession cookie has correct options", async () => {
  const createSession = await importCreateSession();
  await createSession("user-1", "test@example.com");

  const [, , options] = mockSet.mock.calls[0];
  expect(options.httpOnly).toBe(true);
  expect(options.sameSite).toBe("lax");
  expect(options.path).toBe("/");
});

test("createSession cookie expires approximately 7 days from now", async () => {
  const createSession = await importCreateSession();
  const before = Date.now();
  await createSession("user-1", "test@example.com");
  const after = Date.now();

  const [, , options] = mockSet.mock.calls[0];
  const expiresMs = options.expires.getTime();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  expect(expiresMs).toBeGreaterThanOrEqual(before + sevenDays - 1000);
  expect(expiresMs).toBeLessThanOrEqual(after + sevenDays + 1000);
});

test("createSession cookie value is a JWT containing userId and email", async () => {
  const createSession = await importCreateSession();
  await createSession("user-1", "test@example.com");

  const [, token] = mockSet.mock.calls[0];
  const secret = new TextEncoder().encode("development-secret-key");
  const { payload } = await jwtVerify(token, secret);

  expect(payload.userId).toBe("user-1");
  expect(payload.email).toBe("test@example.com");
});

// --- getSession ---

const TEST_SECRET = new TextEncoder().encode("development-secret-key");

async function makeToken(
  payload: Record<string, unknown>,
  options: { expired?: boolean } = {}
) {
  const builder = new SignJWT(payload).setProtectedHeader({ alg: "HS256" });
  if (options.expired) {
    builder.setExpirationTime(Math.floor(Date.now() / 1000) - 60);
  } else {
    builder.setExpirationTime("7d").setIssuedAt();
  }
  return builder.sign(TEST_SECRET);
}

async function importGetSession() {
  const { getSession } = await import("../auth");
  return getSession;
}

test("getSession returns null when no cookie is present", async () => {
  mockGet.mockReturnValue(undefined);
  const getSession = await importGetSession();
  expect(await getSession()).toBeNull();
});

test("getSession returns the decoded payload for a valid token", async () => {
  const token = await makeToken({ userId: "user-1", email: "test@example.com" });
  mockGet.mockReturnValue({ value: token });
  const getSession = await importGetSession();

  const session = await getSession();
  expect(session?.userId).toBe("user-1");
  expect(session?.email).toBe("test@example.com");
});

test("getSession returns null for an expired token", async () => {
  const token = await makeToken({ userId: "user-1", email: "test@example.com" }, { expired: true });
  mockGet.mockReturnValue({ value: token });
  const getSession = await importGetSession();

  expect(await getSession()).toBeNull();
});

test("getSession returns null for a malformed token", async () => {
  mockGet.mockReturnValue({ value: "not.a.valid.jwt" });
  const getSession = await importGetSession();

  expect(await getSession()).toBeNull();
});

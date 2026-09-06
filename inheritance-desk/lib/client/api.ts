"use client";
// Thin fetch wrapper for the JSON API. Throws on non-2xx with the server message.
// Every request has a timeout via AbortController, so a slow/hung request always
// settles — callers' finally blocks reset busy state and the error surfaces (no
// permanently-stuck "Adding…"/disabled buttons).

const DEFAULT_TIMEOUT = 20_000;

async function request<T>(url: string, init?: RequestInit, timeoutMs = DEFAULT_TIMEOUT): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) {
      throw new Error((data && data.error) || `Request failed (${res.status})`);
    }
    return data as T;
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new Error("The request timed out. Please check your connection and try again.");
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>(url, { method: "POST", body: body ? JSON.stringify(body) : undefined, headers }),
  patch: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  del: <T>(url: string) => request<T>(url, { method: "DELETE" }),
};

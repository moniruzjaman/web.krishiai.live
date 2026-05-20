import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";

// Re-import after fake indexedDB is installed
import {
  saveChatMessage, getChatHistory, clearChatHistory,
  saveScan, getScanHistory,
  saveProfile, getProfile,
  enqueueRequest, getPendingRequests, removeQueuedRequest,
} from "./offlineStorage";

describe("offlineStorage — Chat", () => {
  beforeEach(async () => {
    await clearChatHistory();
  });

  it("saves and retrieves a chat message", async () => {
    await saveChatMessage({ role: "user", text: "ধান রোগ?" });
    const history = await getChatHistory();
    expect(history).toHaveLength(1);
    expect(history[0].role).toBe("user");
    expect(history[0].text).toBe("ধান রোগ?");
  });

  it("returns messages in chronological order", async () => {
    await saveChatMessage({ role: "user", text: "first" });
    await new Promise(r => setTimeout(r, 10));
    await saveChatMessage({ role: "assistant", text: "second" });

    const history = await getChatHistory();
    expect(history).toHaveLength(2);
    expect(history[0].text).toBe("first");
    expect(history[1].text).toBe("second");
  });

  it("limits results", async () => {
    for (let i = 0; i < 5; i++) {
      await saveChatMessage({ role: "user", text: `msg-${i}` });
      await new Promise(r => setTimeout(r, 5));
    }
    const limited = await getChatHistory(3);
    expect(limited).toHaveLength(3);
  });

  it("clears all chat messages", async () => {
    await saveChatMessage({ role: "user", text: "test" });
    await clearChatHistory();
    const history = await getChatHistory();
    expect(history).toHaveLength(0);
  });
});

describe("offlineStorage — Scans", () => {
  beforeEach(async () => {
    await clearChatHistory();
  });

  it("saves and retrieves a scan record", async () => {
    await saveScan({ disease: "বাদামি দাগ", crop: "ধান", severity: "মধ্যম", ts: "2026-05-20" });
    const scans = await getScanHistory();
    expect(scans).toHaveLength(1);
    expect(scans[0].disease).toBe("বাদামি দাগ");
  });

  it("returns newest scans first", async () => {
    await saveScan({ disease: "old", crop: "ধান", severity: "স্বল্প", ts: "yesterday" });
    await new Promise(r => setTimeout(r, 10));
    await saveScan({ disease: "new", crop: "ধান", severity: "তীব্র", ts: "today" });

    const scans = await getScanHistory();
    expect(scans[0].disease).toBe("new");
  });
});

describe("offlineStorage — Profile", () => {
  it("saves and retrieves profile values", async () => {
    await saveProfile("name", "Rahim");
    const val = await getProfile("name");
    expect(val).toBe("Rahim");
  });

  it("returns undefined for missing key", async () => {
    const val = await getProfile("nonexistent");
    expect(val).toBeUndefined();
  });
});

describe("offlineStorage — Request Queue", () => {
  beforeEach(async () => {
    const pending = await getPendingRequests();
    for (const req of pending) {
      if (req.id != null) await removeQueuedRequest(req.id);
    }
  });

  it("enqueues and retrieves a request", async () => {
    await enqueueRequest({
      url: "/api/analyze",
      method: "POST",
      body: JSON.stringify({ prompt: "test" }),
      headers: { "Content-Type": "application/json" },
    });
    const pending = await getPendingRequests();
    expect(pending).toHaveLength(1);
    expect(pending[0].url).toBe("/api/analyze");
    expect(pending[0].retries).toBe(0);
  });

  it("returns empty queue when no requests", async () => {
    const pending = await getPendingRequests();
    expect(pending).toHaveLength(0);
  });
});

import { openDB, type IDBPDatabase, type DBSchema } from "idb";

const DB_NAME = "krishi-ai";
const DB_VERSION = 3;

interface ChatMessage {
  id?: number;
  role: "user" | "assistant";
  text: string;
  model?: string;
  timestamp: number;
}

interface ScanRecord {
  id?: number;
  disease: string;
  crop: string;
  severity: string;
  ts: string;
  imageThumb?: string;
  timestamp: number;
}

interface ProfileRecord {
  key: string;
  value: string;
}

interface QueuedRequest {
  id?: number;
  url: string;
  method: string;
  body: string;
  headers: Record<string, string>;
  timestamp: number;
  retries: number;
}

interface KrishiDB extends DBSchema {
  chat: {
    key: number;
    value: ChatMessage;
    indexes: { timestamp: number };
  };
  scans: {
    key: number;
    value: ScanRecord;
    indexes: { timestamp: number };
  };
  profile: {
    key: string;
    value: ProfileRecord;
  };
  requestQueue: {
    key: number;
    value: QueuedRequest;
    indexes: { timestamp: number };
  };
}

let dbPromise: Promise<IDBPDatabase<KrishiDB>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<KrishiDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("chat")) {
          const chatStore = db.createObjectStore("chat", { keyPath: "id", autoIncrement: true });
          chatStore.createIndex("timestamp", "timestamp");
        }
        if (!db.objectStoreNames.contains("scans")) {
          const scanStore = db.createObjectStore("scans", { keyPath: "id", autoIncrement: true });
          scanStore.createIndex("timestamp", "timestamp");
        }
        if (!db.objectStoreNames.contains("profile")) {
          db.createObjectStore("profile", { keyPath: "key" });
        }
        if (!db.objectStoreNames.contains("requestQueue")) {
          const queueStore = db.createObjectStore("requestQueue", { keyPath: "id", autoIncrement: true });
          queueStore.createIndex("timestamp", "timestamp");
        }
      },
    });
  }
  return dbPromise;
}

// Chat
export async function saveChatMessage(msg: Omit<ChatMessage, "id" | "timestamp">): Promise<IDBValidKey> {
  const db = await getDb();
  return db.add("chat", { ...msg, timestamp: Date.now() });
}

export async function getChatHistory(limit = 50): Promise<ChatMessage[]> {
  const db = await getDb();
  const all = await db.getAll("chat");
  return all.sort((a, b) => a.timestamp - b.timestamp).slice(-limit);
}

export async function clearChatHistory(): Promise<void> {
  const db = await getDb();
  await db.clear("chat");
}

// Scans
export async function saveScan(scan: Omit<ScanRecord, "id" | "timestamp">): Promise<IDBValidKey> {
  const db = await getDb();
  return db.add("scans", { ...scan, timestamp: Date.now() });
}

export async function getScanHistory(limit = 20): Promise<ScanRecord[]> {
  const db = await getDb();
  const all = await db.getAll("scans");
  return all.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
}

// Profile
export async function saveProfile(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.put("profile", { key, value });
}

export async function getProfile(key: string): Promise<string | undefined> {
  const db = await getDb();
  const result = await db.get("profile", key);
  return result?.value;
}

// ── Offline Request Queue ────────────────────────────────────────────────────────
export async function enqueueRequest(req: Omit<QueuedRequest, "id" | "timestamp" | "retries">): Promise<void> {
  const db = await getDb();
  await db.add("requestQueue", { ...req, timestamp: Date.now(), retries: 0 });
}

export async function getPendingRequests(limit = 50): Promise<QueuedRequest[]> {
  const db = await getDb();
  const all = await db.getAll("requestQueue");
  return all.sort((a, b) => a.timestamp - b.timestamp).slice(0, limit);
}

export async function removeQueuedRequest(id: number): Promise<void> {
  const db = await getDb();
  await db.delete("requestQueue", id);
}

export async function incrementQueuedRetry(id: number): Promise<void> {
  const db = await getDb();
  const req = await db.get("requestQueue", id);
  if (req) {
    req.retries += 1;
    await db.put("requestQueue", req);
  }
}

export async function processRequestQueue(): Promise<{ processed: number; failed: number }> {
  const pending = await getPendingRequests();
  let processed = 0;
  let failed = 0;
  for (const req of pending) {
    if (req.retries >= 5) { await removeQueuedRequest(req.id!); failed++; continue; }
    try {
      const headers: Record<string, string> =
        typeof req.headers === "string" ? JSON.parse(req.headers as string) : req.headers;
      const res = await fetch(req.url, {
        method: req.method,
        headers: { ...headers, "Content-Type": "application/json" },
        body: req.body,
      });
      if (res.ok) { await removeQueuedRequest(req.id!); processed++; }
      else { await incrementQueuedRetry(req.id!); failed++; }
    } catch { await incrementQueuedRetry(req.id!); failed++; }
  }
  return { processed, failed };
}

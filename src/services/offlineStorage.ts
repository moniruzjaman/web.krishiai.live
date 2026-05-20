import { openDB, type IDBPDatabase, type DBSchema } from "idb";

const DB_NAME = "krishi-ai";
const DB_VERSION = 2;

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
      },
    });
  }
  return dbPromise;
}

// Chat
export async function saveChatMessage(msg: Omit<ChatMessage, "id">): Promise<IDBValidKey> {
  const db = await getDb();
  return db.add("chat", { ...msg, timestamp: Date.now() });
}

export async function getChatHistory(limit = 50): Promise<ChatMessage[]> {
  const db = await getDb();
  const index = db.transaction("chat").store.index("timestamp");
  return index.getAll(null, limit);
}

export async function clearChatHistory(): Promise<void> {
  const db = await getDb();
  await db.clear("chat");
}

// Scans
export async function saveScan(scan: Omit<ScanRecord, "id">): Promise<IDBValidKey> {
  const db = await getDb();
  return db.add("scans", { ...scan, timestamp: Date.now() });
}

export async function getScanHistory(limit = 20): Promise<ScanRecord[]> {
  const db = await getDb();
  const index = db.transaction("scans").store.index("timestamp");
  return index.getAll(null, limit);
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

type ExpiringValue = {
  value: string;
  expiresAt?: number;
};

const kvStore = new Map<string, ExpiringValue>();
const setStore = new Map<string, Set<string>>();

const isExpired = (item: ExpiringValue): boolean => {
  return item.expiresAt !== undefined && Date.now() > item.expiresAt;
};

export const inMemoryStore = {
  async set(key: string, value: string, exSeconds?: number): Promise<void> {
    const expiresAt = exSeconds ? Date.now() + exSeconds * 1000 : undefined;
    kvStore.set(key, { value, expiresAt });
  },

  async get(key: string): Promise<string | null> {
    const item = kvStore.get(key);
    if (!item) {
      return null;
    }

    if (isExpired(item)) {
      kvStore.delete(key);
      return null;
    }

    return item.value;
  },

  async del(...keys: string[]): Promise<number> {
    let deleted = 0;

    for (const key of keys) {
      if (kvStore.delete(key)) {
        deleted += 1;
      }
    }

    return deleted;
  },

  async sadd(key: string, member: string): Promise<number> {
    const existing = setStore.get(key) || new Set<string>();
    const before = existing.size;
    existing.add(member);
    setStore.set(key, existing);
    return existing.size - before;
  },

  async srem(key: string, member: string): Promise<number> {
    const existing = setStore.get(key);
    if (!existing) {
      return 0;
    }

    const removed = existing.delete(member);
    if (existing.size === 0) {
      setStore.delete(key);
    }

    return removed ? 1 : 0;
  },
};

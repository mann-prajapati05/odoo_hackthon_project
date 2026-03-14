const kvStore = new Map();
const setStore = new Map();
const isExpired = (item) => {
    return item.expiresAt !== undefined && Date.now() > item.expiresAt;
};
export const inMemoryStore = {
    async set(key, value, exSeconds) {
        const expiresAt = exSeconds ? Date.now() + exSeconds * 1000 : undefined;
        kvStore.set(key, { value, expiresAt });
    },
    async get(key) {
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
    async del(...keys) {
        let deleted = 0;
        for (const key of keys) {
            if (kvStore.delete(key)) {
                deleted += 1;
            }
        }
        return deleted;
    },
    async sadd(key, member) {
        const existing = setStore.get(key) || new Set();
        const before = existing.size;
        existing.add(member);
        setStore.set(key, existing);
        return existing.size - before;
    },
    async srem(key, member) {
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

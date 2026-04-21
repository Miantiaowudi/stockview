// 测试环境初始化

// Mock indexedDB for Node.js environment
const mockStore = new Map<string, unknown>()
const transactionStores = new Map<string, Map<string, unknown>>()

function getStore(name: string): Map<string, unknown> {
  if (!transactionStores.has(name)) {
    transactionStores.set(name, new Map())
  }
  return transactionStores.get(name)!
}

global.indexedDB = {
  open: (_name: string, _version: number) => {
    const store = getStore(STORE_NAME)
    const mockDb = {
      name: 'stockview_db',
      objectStoreNames: { contains: (_n: string) => true },
      createObjectStore: () => ({
        add: (record: { id: string }) => {
          store.set(record.id, record)
          const req = { onerror: null as ((e: unknown) => void) | null, onsuccess: null as ((e: unknown) => void) | null }
          setTimeout(() => req.onsuccess?.({ target: req }), 0)
          return req
        },
        getAll: () => {
          const req = { onerror: null as ((e: unknown) => void) | null, onsuccess: null as ((e: unknown) => void) | null, result: undefined as unknown }
          setTimeout(() => {
            req.result = Array.from(store.values())
            req.onsuccess?.({ target: req })
          }, 0)
          return req
        },
        delete: (id: string) => {
          store.delete(id)
          const req = { onerror: null as ((e: unknown) => void) | null, onsuccess: null as ((e: unknown) => void) | null }
          setTimeout(() => req.onsuccess?.({ target: req }), 0)
          return req
        },
        clear: () => {
          store.clear()
          const req = { onerror: null as ((e: unknown) => void) | null, onsuccess: null as ((e: unknown) => void) | null }
          setTimeout(() => req.onsuccess?.({ target: req }), 0)
          return req
        },
      }),
      transaction: () => ({
        objectStore: () => ({
          add: (record: { id: string }) => {
            store.set(record.id, record)
            const req = { onerror: null as ((e: unknown) => void) | null, onsuccess: null as ((e: unknown) => void) | null }
            setTimeout(() => req.onsuccess?.({ target: req }), 0)
            return req
          },
          getAll: () => {
            const req = { onerror: null as ((e: unknown) => void) | null, onsuccess: null as ((e: unknown) => void) | null, result: undefined as unknown }
            setTimeout(() => {
              req.result = Array.from(store.values())
              req.onsuccess?.({ target: req })
            }, 0)
            return req
          },
          delete: (id: string) => {
            store.delete(id)
            const req = { onerror: null as ((e: unknown) => void) | null, onsuccess: null as ((e: unknown) => void) | null }
            setTimeout(() => req.onsuccess?.({ target: req }), 0)
            return req
          },
          clear: () => {
            store.clear()
            const req = { onerror: null as ((e: unknown) => void) | null, onsuccess: null as ((e: unknown) => void) | null }
            setTimeout(() => req.onsuccess?.({ target: req }), 0)
            return req
          },
        }),
      }),
    }

    const req = {
      onerror: null as ((e: unknown) => void) | null,
      onsuccess: null as ((e: unknown) => void) | null,
      onupgradeneeded: null as ((e: unknown) => void) | null,
      result: mockDb as unknown,
    }
    setTimeout(() => req.onsuccess?.({ target: req }), 0)
    return req
  },
} as unknown as IDBFactory

const STORE_NAME = 'trades'
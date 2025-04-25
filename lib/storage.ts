import { kv } from "@vercel/kv"

// In-memory fallback storage when KV is not configured
const mem = new Map<string, any>()

/**
 * Store data with an optional expiration time
 * Falls back to in-memory storage if KV is not available
 */
export async function storeData(key: string, data: any, expirationSeconds = 3600) {
  try {
    // Try to use Vercel KV first
    await kv.set(key, data, { ex: expirationSeconds })
    return true
  } catch (error) {
    // Fall back to in-memory storage if KV fails
    console.log("Using in-memory storage fallback (KV not configured)")
    mem.set(key, {
      data,
      expiry: Date.now() + expirationSeconds * 1000,
    })
    return true
  }
}

/**
 * Retrieve data from storage
 * Falls back to in-memory storage if KV is not available
 */
export async function retrieveData<T = any>(key: string): Promise<T | null> {
  try {
    // Try to use Vercel KV first
    const data = await kv.get<T>(key)
    return data
  } catch (error) {
    // Fall back to in-memory storage if KV fails
    const memData = mem.get(key)

    // Check if data exists and is not expired
    if (memData && memData.expiry > Date.now()) {
      return memData.data as T
    }

    // Clean up expired data
    if (memData) {
      mem.delete(key)
    }

    return null
  }
}

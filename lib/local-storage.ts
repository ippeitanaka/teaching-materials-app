// ローカルストレージの操作を安全に行うためのヘルパー関数

/**
 * ローカルストレージからデータを取得する
 * @param key ストレージのキー
 * @param defaultValue デフォルト値
 * @returns 取得したデータまたはデフォルト値
 */
export function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") {
    return defaultValue
  }

  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`ローカルストレージからの取得エラー (${key}):`, error)
    return defaultValue
  }
}

/**
 * ローカルストレージにデータを保存する
 * @param key ストレージのキー
 * @param value 保存するデータ
 * @returns 保存が成功したかどうか
 */
export function saveToStorage<T>(key: string, value: T): boolean {
  if (typeof window === "undefined") {
    return false
  }

  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.error(`ローカルストレージへの保存エラー (${key}):`, error)
    return false
  }
}

/**
 * ローカルストレージから項目を削除する
 * @param key ストレージのキー
 * @returns 削除が成功したかどうか
 */
export function removeFromStorage(key: string): boolean {
  if (typeof window === "undefined") {
    return false
  }

  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error(`ローカルストレージからの削除エラー (${key}):`, error)
    return false
  }
}

/**
 * ローカルストレージの容量を確認する
 * @returns 使用中の容量（バイト）
 */
export function getStorageUsage(): number {
  if (typeof window === "undefined") {
    return 0
  }

  try {
    let total = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const value = localStorage.getItem(key) || ""
        total += key.length + value.length
      }
    }
    return total * 2 // UTF-16エンコーディングでは各文字が2バイト
  } catch (error) {
    console.error("ストレージ使用量の計算エラー:", error)
    return 0
  }
}

/**
 * ローカルストレージの残り容量を推定する
 * @returns 残り容量の推定値（バイト）
 */
export function estimateRemainingStorage(): number {
  // ブラウザによって異なるが、一般的には5MBが上限
  const totalStorage = 5 * 1024 * 1024
  const usedStorage = getStorageUsage()
  return Math.max(0, totalStorage - usedStorage)
}

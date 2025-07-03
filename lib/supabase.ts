import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

// 環境変数が設定されているかチェック
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Supabaseクライアントを作成する関数
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase環境変数が設定されていません。一部の機能が利用できない可能性があります。")
    // ダミーのクライアントを返す（実際には機能しない）
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: () => Promise.resolve({ error: new Error("Supabase環境変数が設定されていません") }),
        signUp: () => Promise.resolve({ error: new Error("Supabase環境変数が設定されていません") }),
        signOut: () => Promise.resolve({ error: null }),
      },
      from: () => ({
        select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }),
        insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
      }),
      storage: {
        from: () => ({
          upload: () => Promise.resolve({ data: null, error: null }),
        }),
      },
    } as any
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Supabaseクライアントのインスタンスを作成
export const supabase = createSupabaseClient()

// サーバーサイドでのみ使用するクライアント（サーバーアクション用）
export const createServerSupabaseClient = () => {
  if (!supabaseUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("Supabase環境変数が設定されていません。サーバーサイド機能が利用できない可能性があります。")
    // ダミーのクライアントを返す
    return supabase
  }

  return createClient<Database>(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

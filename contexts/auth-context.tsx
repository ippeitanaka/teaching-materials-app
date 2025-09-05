"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { v4 as uuidv4 } from "uuid"

// シンプルなセッション管理のみの認証コンテキスト
type AuthContextType = {
  guestId: string
  isLoading: boolean
  resetSession: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ローカルストレージのキー
const GUEST_ID_KEY = "guest_session_id"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [guestId, setGuestId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // セッションIDの初期化
  useEffect(() => {
    if (typeof window !== "undefined") {
      let sessionId = localStorage.getItem(GUEST_ID_KEY)

      // セッションIDがない場合は新しく生成
      if (!sessionId) {
        sessionId = uuidv4()
        localStorage.setItem(GUEST_ID_KEY, sessionId)
      }

      setGuestId(sessionId)
      setIsLoading(false)
    }
  }, [])

  // 新しいセッションを開始
  const resetSession = () => {
    const newSessionId = uuidv4()
    setGuestId(newSessionId)
    if (typeof window !== "undefined") {
      localStorage.setItem(GUEST_ID_KEY, newSessionId)

      // セッション関連のデータをクリア
      localStorage.removeItem("guest_documents")
      localStorage.removeItem("guest_materials")
    }

    router.push("/")
  }

  const value = {
    guestId,
    isLoading,
    resetSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

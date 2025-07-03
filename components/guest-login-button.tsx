"use client"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useState } from "react"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface GuestLoginButtonProps {
  variant?: "default" | "outline" | "ghost"
  className?: string
}

export function GuestLoginButton({ variant = "outline", className = "" }: GuestLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { resetSession } = useAuth()
  const router = useRouter()

  const handleGuestLogin = async () => {
    setIsLoading(true)
    try {
      // 新しいゲストセッションを開始
      resetSession()

      toast({
        title: "ゲストモードでログイン",
        description: "ゲストとしてダッシュボードにアクセスします",
      })

      router.push("/dashboard")
    } catch (error) {
      console.error("Guest login error:", error)
      toast({
        title: "エラー",
        description: "ゲストログイン中にエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button variant={variant} className={className} onClick={handleGuestLogin} disabled={isLoading}>
      {isLoading ? "処理中..." : "ゲストとして利用"}
    </Button>
  )
}

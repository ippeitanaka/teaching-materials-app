"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGuestLoading, setIsGuestLoading] = useState(false)
  const { resetSession } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // 現在の実装ではサインイン機能は実装されていないため、
      // ゲストモードとしてログインし、ダッシュボードにリダイレクトします

      // 新しいゲストセッションを開始
      resetSession()

      toast({
        title: "ゲストモードで開始",
        description: "現在はゲストモードのみサポートしています。ダッシュボードにリダイレクトします。",
      })

      router.push("/dashboard")
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "エラー",
        description: "処理中にエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGuestLogin = async () => {
    setIsGuestLoading(true)
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
      setIsGuestLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">ログイン</CardTitle>
          <CardDescription className="text-center">アカウントにログインして教材作成を始めましょう</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">パスワード</Label>
                <Link href="/help" className="text-sm text-purple-600 hover:text-purple-800">
                  パスワードをお忘れですか？
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-800">
                <span className="font-medium">注意:</span>{" "}
                現在はゲストモードのみサポートしています。入力した情報は保存されません。
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
              {isLoading ? "処理中..." : "ゲストモードで始める"}
            </Button>

            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">または</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGuestLogin}
              disabled={isGuestLoading}
            >
              {isGuestLoading ? "処理中..." : "新しいゲストセッションを開始"}
            </Button>

            <div className="text-center text-sm">
              アカウントをお持ちでないですか？{" "}
              <Link href="/auth/register" className="text-purple-600 hover:text-purple-800 font-medium">
                新規登録
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

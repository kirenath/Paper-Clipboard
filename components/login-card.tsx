"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"

export function LoginCard() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/"

  const [password, setPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
        credentials: "include",
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean }
      if (!res.ok || !data.ok) {
        setError(data.error ?? "登录失败")
        setLoading(false)
        return
      }
      const check = await fetch("/api/auth/session", {
        credentials: "include",
        cache: "no-store",
      })
      const checkData = (await check.json().catch(() => ({}))) as { authenticated?: boolean }
      if (!checkData.authenticated) {
        setError("浏览器拦截了会话 Cookie，请尝试在新标签页中打开。")
        setLoading(false)
        return
      }
      window.location.assign(redirect)
    } catch {
      setError("网络错误，请重试")
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col px-6 py-10 sm:px-10">
      {/* Top banner: ornamental masthead */}
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-baseline gap-3">
          <span className="smallcaps text-muted-foreground">N&deg; 001</span>
          <span className="hidden h-px w-24 bg-border sm:block" />
          <span className="smallcaps text-muted-foreground">Private Archive</span>
        </div>
        <ThemeToggle />
      </div>

      {/* Main composition — vertically and horizontally centered */}
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center text-center">
            <p className="smallcaps mb-6 text-muted-foreground">
              EST. 2026
            </p>

            <h1 className="font-serif text-6xl font-medium leading-[0.95] tracking-tight sm:text-7xl">
              纸片<span className="italic text-primary">剪贴板</span>
            </h1>

            <p className="ornament mt-6 text-lg" aria-hidden="true">
              ❋&nbsp;&nbsp;❋&nbsp;&nbsp;❋
            </p>

            <p className="mt-6 max-w-xs text-balance font-serif text-base italic leading-relaxed text-muted-foreground">
              一个私人的临时文本中转站。
            </p>
            <p className="mt-1 smallcaps text-muted-foreground">
              A Quiet Archive of Fragments
            </p>
          </div>

          <form onSubmit={onSubmit} className="mx-auto mt-12 flex max-w-xs flex-col gap-7">
            <div className="flex flex-col gap-3">
              <label
                htmlFor="password"
                className="smallcaps text-muted-foreground"
              >
                Passphrase &middot; 访问密码
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="• • • • • • • •"
                required
                className="input-rule h-10 text-center text-base"
              />
            </div>

            {error ? (
              <p
                className="smallcaps text-center text-destructive"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={loading}
              className="group h-11 rounded-sm font-sans text-sm tracking-wide"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>正在登入存档…</span>
                </>
              ) : (
                <>
                  <span>登入存档</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] opacity-70">
                    Enter
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Footer mark */}
      <div className="flex items-center justify-between gap-6">
        <span className="smallcaps text-muted-foreground">v0.1</span>
        <span className="smallcaps text-muted-foreground">— 私人副本 —</span>
        <span className="smallcaps text-muted-foreground">∞</span>
      </div>
    </div>
  )
}

"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { LogOut, Menu, Plus, Search, Settings2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ClipboardComposer } from "@/components/clipboard-composer"
import { ClipboardList } from "@/components/clipboard-list"
import { GroupFilter } from "@/components/group-filter"
import { TagFilter } from "@/components/tag-filter"
import { GroupTagManager } from "@/components/group-tag-manager"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  ClipboardDataProvider,
  useClipboardData,
} from "@/components/clipboard-data-provider"

export function AppShell() {
  return (
    <ClipboardDataProvider>
      <ShellInner />
    </ClipboardDataProvider>
  )
}

function ShellInner() {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = React.useState(false)

  async function logout() {
    setLoggingOut(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      toast.success("已退出登录")
      router.replace("/login")
      router.refresh()
    } catch {
      toast.error("退出失败")
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop: persistent editorial side rail */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
        <SidebarContents onLogout={logout} loggingOut={loggingOut} />
      </aside>

      {/* Mobile: slim top strip with hamburger + brand mark */}
      <MobileTopStrip onLogout={logout} loggingOut={loggingOut} />

      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-3xl px-6 py-10 sm:px-10 lg:px-14 lg:py-16">
          <PageHeader />
          <div className="mt-10 flex flex-col gap-10">
            <TagFilter />
            <ClipboardList />
          </div>
        </main>
        <PageFooter />
      </div>
    </div>
  )
}

function PageHeader() {
  const { items, filters, setQuery } = useClipboardData()
  const [composerOpen, setComposerOpen] = React.useState(false)
  const count = items?.length ?? 0
  return (
    <header>
      <div className="flex items-baseline gap-3">
        <span className="smallcaps text-muted-foreground">N&deg; 001</span>
        <span className="h-px flex-1 bg-border" />
        <span className="smallcaps text-muted-foreground">
          {count.toString().padStart(3, "0")} ENTRIES
        </span>
      </div>

      <h1 className="mt-7 font-serif text-5xl font-medium leading-[0.95] tracking-tight sm:text-6xl">
        纸片<span className="italic text-primary">剪贴板</span>
      </h1>

      <p className="mt-4 smallcaps text-muted-foreground">
        A Quiet Archive of Fragments
      </p>

      <div className="mt-8 flex items-center gap-3">
        <div className="relative flex-1">
          <Input
            type="search"
            value={filters.query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索标题与正文 · Search"
            className="input-rule h-10 pr-8 text-sm tracking-normal"
            aria-label="搜索"
          />
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute right-1 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
        </div>

        <Dialog open={composerOpen} onOpenChange={setComposerOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              className="h-10 shrink-0 rounded-sm font-sans text-sm tracking-wide"
            >
              <Plus className="h-4 w-4" />
              <span>新建</span>
              <span className="hidden font-mono text-[10px] uppercase tracking-[0.22em] opacity-70 sm:inline">
                New
              </span>
            </Button>
          </DialogTrigger>
          <DialogContent className="paper-card max-h-[90vh] overflow-y-auto border-border bg-card p-0 sm:max-w-2xl">
            <div className="px-6 pt-6 pb-2 sm:px-8 sm:pt-8">
              <DialogHeader className="space-y-2 text-left">
                <div className="editorial-rule">
                  <span>新建条目</span>
                  <em>New Entry</em>
                </div>
                <DialogTitle className="sr-only">新建条目</DialogTitle>
                <DialogDescription className="font-serif text-sm italic text-muted-foreground">
                  把一段值得保留的文本放入这本档案。
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="px-6 pb-6 sm:px-8 sm:pb-8">
              <ClipboardComposer
                onSubmitted={() => setComposerOpen(false)}
                onCancel={() => setComposerOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  )
}

function SidebarContents({
  onLogout,
  loggingOut,
  onNavigate,
}: {
  onLogout: () => void
  loggingOut: boolean
  onNavigate?: () => void
}) {
  return (
    <div className="flex h-full flex-col p-6">
      {/* Brand mark */}
      <div className="mb-10 flex items-baseline gap-3">
        <span className="smallcaps text-muted-foreground">N&deg; 001</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="mb-10">
        <h2 className="font-serif text-2xl font-medium leading-tight tracking-tight">
          纸片
          <span className="italic text-primary">剪贴板</span>
        </h2>
        <p className="mt-1.5 smallcaps text-muted-foreground">
          Quiet Archive
        </p>
      </div>

      <div className="mb-6 editorial-rule">
        <span>分组</span>
        <em>Groups</em>
      </div>

      <div onClick={onNavigate} className="-mx-1">
        <GroupFilter />
      </div>

      <div className="mt-auto pt-8">
        <div className="mb-3 editorial-rule">
          <span>工具</span>
          <em>Tools</em>
        </div>

        <div className="flex flex-col gap-1">
          <GroupTagManager
            trigger={
              <button
                type="button"
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
              >
                <Settings2 className="h-3.5 w-3.5" />
                <span>管理分组与标签</span>
              </button>
            }
          />
          <div className="flex items-center justify-between gap-2 px-2 py-1.5">
            <span className="text-sm text-muted-foreground">外观主题</span>
            <ThemeToggle />
          </div>
          <button
            type="button"
            onClick={onLogout}
            disabled={loggingOut}
            className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground disabled:opacity-60"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>{loggingOut ? "正在退出…" : "退出存档"}</span>
          </button>
        </div>

        <p className="mt-6 smallcaps text-muted-foreground/70">
          v0.1 &middot; EST. 2026
        </p>
      </div>
    </div>
  )
}

function MobileTopStrip({
  onLogout,
  loggingOut,
}: {
  onLogout: () => void
  loggingOut: boolean
}) {
  const [open, setOpen] = React.useState(false)
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/85 px-5 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 lg:hidden">
      <div className="flex items-baseline gap-2">
        <span className="font-serif text-base font-medium tracking-tight">
          纸片<span className="italic text-primary">剪贴板</span>
        </span>
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="打开菜单"
              className="h-8 w-8"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 border-r border-border bg-sidebar p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>导航</SheetTitle>
              <SheetDescription>分组与工具</SheetDescription>
            </SheetHeader>
            <SidebarContents
              onLogout={onLogout}
              loggingOut={loggingOut}
              onNavigate={() => setOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}

function PageFooter() {
  return (
    <footer className="mx-auto mt-16 max-w-3xl px-6 pb-12 sm:px-10 lg:px-14">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="ornament text-sm" aria-hidden="true">
          ❋
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <p className="mt-4 text-center smallcaps text-muted-foreground">
        End of file &middot; 卷终
      </p>
    </footer>
  )
}

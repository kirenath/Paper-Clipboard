"use client"

import * as React from "react"
import { Check, ChevronDown, Copy, MoreHorizontal, Pencil, Pin, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ItemEditDialog } from "@/components/item-edit-dialog"
import { refreshAllClipboardData } from "@/components/clipboard-data-provider"
import type { ClipboardItem } from "@/lib/types"
import { cn } from "@/lib/utils"

const COLLAPSE_THRESHOLD = 240

export function ClipboardCard({ item }: { item: ClipboardItem }) {
  const [copied, setCopied] = React.useState(false)
  const [expanded, setExpanded] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

  const canCollapse =
    item.content.length > COLLAPSE_THRESHOLD || item.content.split("\n").length > 6

  const fallbackTitle = React.useMemo(() => {
    const firstLine = item.content.split("\n").find((l) => l.trim().length > 0) ?? ""
    return firstLine.slice(0, 40) || "（空白条目）"
  }, [item.content])

  const displayTitle = item.title?.trim() || fallbackTitle
  const groupName = item.group?.name ?? "默认"
  const updatedDifferent = item.updatedAt !== item.createdAt

  async function copyContent() {
    try {
      await navigator.clipboard.writeText(item.content)
      setCopied(true)
      toast.success("已复制")
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("复制失败，请手动复制")
    }
  }

  async function doDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/items/${item.id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        toast.error(data.error ?? "删除失败")
        return
      }
      toast.success("已删除")
      refreshAllClipboardData()
      setDeleteOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <article className="paper-card group relative flex flex-col gap-4 px-6 py-5">
      {/* Hover edge ribbon — pure decorative, drives the "memo card" feel */}
      <span className="editorial-edge" aria-hidden="true" />

      {/* Top rule: group label (serif) — line — mono date */}
      <div className="flex items-baseline gap-3">
        <span
          className="font-serif text-[13px] italic text-muted-foreground"
          title={`分组：${groupName}`}
        >
          {groupName}
        </span>
        {item.sortOrder !== null ? (
          <span
            className="flex items-center gap-1 smallcaps text-primary"
            title={`置顶 ${item.sortOrder}`}
          >
            <Pin className="h-3 w-3" />
            {String(item.sortOrder).padStart(2, "0")}
          </span>
        ) : null}
        <span className="h-px flex-1 bg-border" />
        <span className="smallcaps text-muted-foreground">
          {formatStamp(item.createdAt)}
        </span>
      </div>

      {/* Heading + actions */}
      <div className="flex items-start justify-between gap-3">
        <h3
          className="min-w-0 flex-1 truncate font-serif text-xl font-medium leading-snug tracking-tight"
          title={displayTitle}
        >
          {displayTitle}
        </h3>

        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={copyContent}
            aria-label="复制"
            className="h-8 w-8 text-muted-foreground hover:bg-accent/40 hover:text-foreground"
          >
            {copied ? (
              <Check className="h-4 w-4 text-primary" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="更多操作"
                className="h-8 w-8 text-muted-foreground hover:bg-accent/40 hover:text-foreground"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-sm">
              <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" />
                编辑
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setDeleteOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Body — typewriter type for content */}
      <pre
        className={cn(
          "whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed text-foreground/90",
          !expanded && canCollapse && "line-clamp-6",
        )}
      >
        {item.content}
      </pre>

      {canCollapse ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 self-start smallcaps text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronDown
            className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")}
          />
          {expanded ? "Collapse · 收起" : "Expand · 展开"}
        </button>
      ) : null}

      {/* Footer rule: tags + mono updated stamp */}
      <div className="flex items-baseline gap-3">
        {item.tags.length > 0 ? (
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-1">
            {item.tags.map((t) => (
              <span
                key={t.id}
                className="font-serif text-xs italic text-muted-foreground"
              >
                #{t.name}
              </span>
            ))}
          </div>
        ) : (
          <span className="smallcaps text-muted-foreground/60">— no tags —</span>
        )}
        <span className="h-px flex-1 bg-border" />
        {updatedDifferent ? (
          <span className="smallcaps text-muted-foreground">
            rev. {formatStamp(item.updatedAt)}
          </span>
        ) : null}
      </div>

      <ItemEditDialog item={item} open={editOpen} onOpenChange={setEditOpen} />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-xl tracking-tight">
              删除这条记录？
            </AlertDialogTitle>
            <AlertDialogDescription>
              删除后无法恢复，请确认操作。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                doDelete()
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  )
}

function formatStamp(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  const hh = String(d.getHours()).padStart(2, "0")
  const mm = String(d.getMinutes()).padStart(2, "0")
  return `${y}.${m}.${day} ${hh}:${mm}`
}

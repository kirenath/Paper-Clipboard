"use client"

import * as React from "react"
import { ChevronDown, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { GroupSelect } from "@/components/group-select"
import { TagSelector } from "@/components/tag-selector"
import { refreshAllClipboardData } from "@/components/clipboard-data-provider"
import type { ClipboardItem } from "@/lib/types"
import { cn } from "@/lib/utils"

export function ClipboardComposer({
  onSubmitted,
  onCancel,
}: {
  onSubmitted?: () => void
  onCancel?: () => void
}) {
  const [title, setTitle] = React.useState("")
  const [content, setContent] = React.useState("")
  const [groupId, setGroupId] = React.useState<string | null>(null)
  const [tagIds, setTagIds] = React.useState<string[]>([])
  const [sortOrder, setSortOrder] = React.useState<string>("")
  const [moreOpen, setMoreOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  const canSubmit = content.trim().length > 0 && !submitting

  function reset() {
    setTitle("")
    setContent("")
    setGroupId(null)
    setTagIds([])
    setSortOrder("")
    setMoreOpen(false)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const parsedSort = sortOrder.trim() === "" ? null : Number(sortOrder)
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || null,
          content,
          groupId,
          tagIds,
          sortOrder:
            parsedSort === null || Number.isNaN(parsedSort) ? null : parsedSort,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        item?: ClipboardItem
        error?: string
      }
      if (!res.ok || !data.item) {
        toast.error(data.error ?? "保存失败")
        return
      }
      toast.success("已保存")
      reset()
      refreshAllClipboardData()
      onSubmitted?.()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      {/* Title — large serif placeholder so an empty title still looks editorial */}
      <Input
        id="composer-title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="给这段文本起个名字…"
        maxLength={200}
        aria-label="标题（可选）"
        autoFocus
        className="input-rule h-11 font-serif text-xl tracking-tight placeholder:text-muted-foreground/60"
      />

      {/* Body — typewriter feel */}
      <Textarea
        id="composer-content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={'把要保存的文本粘贴到这里…\nPaste anything worth keeping.'}
        className="min-h-[160px] resize-y rounded-sm border-border/80 bg-background/40 font-mono text-[13px] leading-relaxed placeholder:text-muted-foreground/60"
        required
        aria-label="正文"
      />

      {/* Meta row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <span className="smallcaps text-muted-foreground">
            Group &middot; 分组
          </span>
          <GroupSelect value={groupId} onChange={setGroupId} />
        </div>
        <div className="flex flex-col gap-2">
          <span className="smallcaps text-muted-foreground">
            Tags &middot; 标签
          </span>
          <TagSelector value={tagIds} onChange={setTagIds} />
        </div>
      </div>

      <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1.5 self-start smallcaps text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform",
                moreOpen && "rotate-180",
              )}
            />
            More options &middot; 更多选项
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <div className="flex flex-col gap-2">
            <span className="smallcaps text-muted-foreground">
              Pin order &middot; 排序值
            </span>
            <Input
              id="composer-sort"
              type="number"
              inputMode="numeric"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              placeholder="留空表示普通条目"
              className="max-w-[200px] rounded-sm font-mono"
            />
            <p className="font-serif text-xs italic text-muted-foreground">
              数字越小越靠前，留空表示普通条目。
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="mt-1 flex items-center gap-3 border-t border-border pt-5">
        <Button
          type="submit"
          disabled={!canSubmit}
          className="h-10 rounded-sm font-sans text-sm tracking-wide"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>保存中…</span>
            </>
          ) : (
            <>
              <span>保存归档</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] opacity-70">
                Save
              </span>
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel ?? reset}
          disabled={submitting}
          className="h-10 rounded-sm font-sans text-sm tracking-wide text-muted-foreground"
        >
          <span>{onCancel ? "取消" : "清空"}</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] opacity-70">
            {onCancel ? "Cancel" : "Reset"}
          </span>
        </Button>
      </div>
    </form>
  )
}

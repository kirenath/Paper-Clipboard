"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { GroupSelect } from "@/components/group-select"
import { TagSelector } from "@/components/tag-selector"
import { refreshAllClipboardData } from "@/components/clipboard-data-provider"
import type { ClipboardItem } from "@/lib/types"

export function ItemEditDialog({
  item,
  open,
  onOpenChange,
}: {
  item: ClipboardItem
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [title, setTitle] = React.useState(item.title ?? "")
  const [content, setContent] = React.useState(item.content)
  const [groupId, setGroupId] = React.useState<string | null>(item.groupId)
  const [tagIds, setTagIds] = React.useState<string[]>(item.tags.map((t) => t.id))
  const [sortOrder, setSortOrder] = React.useState<string>(
    item.sortOrder !== null ? String(item.sortOrder) : "",
  )
  const [submitting, setSubmitting] = React.useState(false)

  // Reset state when item changes or when reopening
  React.useEffect(() => {
    if (open) {
      setTitle(item.title ?? "")
      setContent(item.content)
      setGroupId(item.groupId)
      setTagIds(item.tags.map((t) => t.id))
      setSortOrder(item.sortOrder !== null ? String(item.sortOrder) : "")
    }
  }, [open, item])

  const canSubmit = content.trim().length > 0 && !submitting

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const parsedSort = sortOrder.trim() === "" ? null : Number(sortOrder)
      const res = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
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
        toast.error(data.error ?? "更新失败")
        return
      }
      toast.success("已更新")
      refreshAllClipboardData()
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>编辑条目</DialogTitle>
          <DialogDescription>修改后会更新更新时间。</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-title" className="text-xs text-muted-foreground">
              标题（可选）
            </Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-content" className="text-xs text-muted-foreground">
              正文
            </Label>
            <Textarea
              id="edit-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[160px] resize-y font-mono text-[13px] leading-relaxed"
              required
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">分组</Label>
              <GroupSelect value={groupId} onChange={setGroupId} />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">标签</Label>
              <TagSelector value={tagIds} onChange={setTagIds} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-sort" className="text-xs text-muted-foreground">
              排序值
            </Label>
            <Input
              id="edit-sort"
              type="number"
              inputMode="numeric"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              placeholder="留空表示普通条目"
              className="max-w-[200px]"
            />
            <p className="text-xs text-muted-foreground">
              数字越小越靠前，留空表示普通条目。
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              取消
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  保存中…
                </>
              ) : (
                "确认"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

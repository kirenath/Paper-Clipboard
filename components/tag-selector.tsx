"use client"

import * as React from "react"
import { Check, Plus, Tag as TagIcon, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useClipboardData, refreshAllClipboardData } from "@/components/clipboard-data-provider"
import type { ClipboardTag } from "@/lib/types"
import { cn } from "@/lib/utils"

export function TagSelector({
  value,
  onChange,
}: {
  value: string[]
  onChange: (ids: string[]) => void
}) {
  const { tags } = useClipboardData()
  const [open, setOpen] = React.useState(false)
  const [filter, setFilter] = React.useState("")
  const [creating, setCreating] = React.useState(false)

  const selectedTags = (tags ?? []).filter((t) => value.includes(t.id))
  const filtered = (tags ?? []).filter((t) =>
    filter ? t.name.toLowerCase().includes(filter.toLowerCase()) : true,
  )
  const exactMatch =
    filter.trim().length > 0 &&
    !!(tags ?? []).find((t) => t.name === filter.trim())

  function toggle(id: string) {
    if (value.includes(id)) onChange(value.filter((v) => v !== id))
    else onChange([...value, id])
  }

  async function createTag() {
    const name = filter.trim()
    if (!name || creating) return
    setCreating(true)
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      })
      const data = (await res.json().catch(() => ({}))) as { tag?: ClipboardTag; error?: string }
      if (!res.ok || !data.tag) {
        toast.error(data.error ?? "创建失败")
        return
      }
      toast.success("已创建标签")
      onChange([...value, data.tag.id])
      setFilter("")
      refreshAllClipboardData()
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between font-normal"
            aria-label="选择标签"
          >
            <span className="flex items-center gap-2 text-muted-foreground">
              <TagIcon className="h-4 w-4" />
              {selectedTags.length > 0
                ? `已选 ${selectedTags.length} 个标签`
                : "选择或新建标签"}
            </span>
            <Plus className="h-4 w-4 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <div className="border-b border-border p-2">
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="搜索或新建标签…"
              className="h-9"
              onKeyDown={(e) => {
                if (e.key === "Enter" && filter.trim() && !exactMatch) {
                  e.preventDefault()
                  createTag()
                }
              }}
            />
          </div>
          <ScrollArea className="max-h-60">
            <div className="flex flex-col p-1">
              {filtered.length === 0 && filter.trim().length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  还没有标签
                </p>
              ) : null}
              {filtered.map((t) => {
                const checked = value.includes(t.id)
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => toggle(t.id)}
                    className={cn(
                      "flex items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
                      checked && "bg-accent/60",
                    )}
                  >
                    <span>{t.name}</span>
                    {checked ? <Check className="h-4 w-4 text-primary" /> : null}
                  </button>
                )
              })}
              {filter.trim() && !exactMatch ? (
                <button
                  type="button"
                  onClick={createTag}
                  disabled={creating}
                  className="mt-1 flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-primary hover:bg-accent disabled:opacity-60"
                >
                  <Plus className="h-3.5 w-3.5" />
                  新建标签 “{filter.trim()}”
                </button>
              ) : null}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {selectedTags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map((t) => (
            <Badge
              key={t.id}
              variant="secondary"
              className="gap-1 pr-1"
            >
              {t.name}
              <button
                type="button"
                onClick={() => toggle(t.id)}
                className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                aria-label={`移除标签 ${t.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  )
}

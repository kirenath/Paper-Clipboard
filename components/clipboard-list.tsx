"use client"

import * as React from "react"
import { ClipboardCard } from "@/components/clipboard-card"
import { useClipboardData } from "@/components/clipboard-data-provider"
import type { ClipboardItem } from "@/lib/types"

export function ClipboardList() {
  const { items, itemsLoading, filters } = useClipboardData()

  const filtered = React.useMemo(() => {
    if (!items) return []
    let result: ClipboardItem[] = items
    if (filters.groupFilter === "default") {
      result = result.filter((i) => i.groupId === null)
    } else if (filters.groupFilter !== "all") {
      result = result.filter((i) => i.groupId === filters.groupFilter)
    }
    if (filters.tagFilter) {
      result = result.filter((i) => i.tags.some((t) => t.id === filters.tagFilter))
    }
    const q = filters.query.trim().toLowerCase()
    if (q) {
      result = result.filter(
        (i) =>
          (i.title ?? "").toLowerCase().includes(q) || i.content.toLowerCase().includes(q),
      )
    }
    return result
  }, [items, filters])

  return (
    <section aria-label="条目列表" className="flex flex-col gap-5">
      <div className="editorial-rule">
        <span>归档</span>
        <em>
          Archive &middot; {filtered.length.toString().padStart(2, "0")}
        </em>
      </div>

      {itemsLoading && !items ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="paper-card h-32 animate-pulse opacity-60"
              aria-hidden
            />
          ))}
        </div>
      ) : !items || items.length === 0 ? (
        <EmptyState
          title="尚无字迹"
          latin="Nothing here yet"
          description="把第一段值得保存的文字粘贴到上方，按下 保存。"
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="未见匹配"
          latin="No matches"
          description="试着调整搜索词，或在左侧切换分组与标签。"
        />
      ) : (
        <div className="flex flex-col gap-5">
          {filtered.map((item, i) => (
            <div
              key={item.id}
              className="editorial-rise"
              style={{ ["--idx" as string]: i }}
            >
              <ClipboardCard item={item} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function EmptyState({
  title,
  latin,
  description,
}: {
  title: string
  latin: string
  description: string
}) {
  return (
    <div className="paper-card flex flex-col items-center gap-4 px-8 py-16 text-center">
      <span className="ornament text-2xl" aria-hidden="true">
        ❋
      </span>
      <h3 className="font-serif text-3xl font-medium italic tracking-tight">
        {title}
      </h3>
      <p className="smallcaps text-muted-foreground">{latin}</p>
      <p className="max-w-sm text-pretty font-serif text-sm italic leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  )
}

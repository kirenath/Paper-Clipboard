"use client"

import { X } from "lucide-react"
import { useClipboardData } from "@/components/clipboard-data-provider"
import { cn } from "@/lib/utils"

export function TagFilter() {
  const { tags, filters, setTagFilter } = useClipboardData()
  if (!tags || tags.length === 0) return null

  return (
    <section aria-label="标签筛选" className="flex flex-col gap-3">
      <div className="editorial-rule">
        <span>标签</span>
        <em>Tags</em>
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
        {tags.map((t) => {
          const active = filters.tagFilter === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTagFilter(active ? null : t.id)}
              aria-pressed={active}
              className={cn(
                "group/tag inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 transition-all",
                "font-serif text-[13px] italic",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
              )}
            >
              <span className="font-mono not-italic text-[10px] opacity-70">#</span>
              {t.name}
            </button>
          )
        })}

        {filters.tagFilter ? (
          <button
            type="button"
            onClick={() => setTagFilter(null)}
            className="ml-1 inline-flex items-center gap-1 smallcaps text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        ) : null}
      </div>
    </section>
  )
}

"use client"

import { useClipboardData } from "@/components/clipboard-data-provider"
import { cn } from "@/lib/utils"

export function GroupFilter({ className }: { className?: string }) {
  const { groups, items, filters, setGroupFilter } = useClipboardData()

  const totalCount = items?.length ?? 0
  const defaultCount = items?.filter((i) => i.groupId === null).length ?? 0
  const groupCounts = new Map<string, number>()
  for (const it of items ?? []) {
    if (it.groupId) groupCounts.set(it.groupId, (groupCounts.get(it.groupId) ?? 0) + 1)
  }

  return (
    <nav aria-label="分组" className={cn("flex flex-col", className)}>
      <Row
        active={filters.groupFilter === "all"}
        onClick={() => setGroupFilter("all")}
        label="全部"
        latin="All"
        count={totalCount}
      />
      <Row
        active={filters.groupFilter === "default"}
        onClick={() => setGroupFilter("default")}
        label="默认"
        latin="Default"
        count={defaultCount}
      />
      {groups && groups.length > 0
        ? groups.map((g) => (
            <Row
              key={g.id}
              active={filters.groupFilter === g.id}
              onClick={() => setGroupFilter(g.id)}
              label={g.name}
              count={groupCounts.get(g.id) ?? 0}
            />
          ))
        : null}
    </nav>
  )
}

function Row({
  active,
  onClick,
  label,
  latin,
  count,
}: {
  active: boolean
  onClick: () => void
  label: string
  latin?: string
  count: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "group/row relative flex w-full items-baseline gap-2 px-2 py-1.5 text-left transition-colors",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {/* Active marker — a small oxblood square left of the row */}
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-1/2 h-1.5 w-1.5 -translate-x-3 -translate-y-1/2 rounded-[1px] transition-all",
          active
            ? "scale-100 bg-primary opacity-100"
            : "scale-0 bg-muted-foreground opacity-0 group-hover/row:opacity-40 group-hover/row:scale-100",
        )}
      />
      <span
        className={cn(
          "min-w-0 truncate font-serif text-[15px] leading-snug",
          active && "font-medium",
        )}
      >
        {label}
      </span>
      {latin ? (
        <span className="smallcaps shrink-0 text-muted-foreground/70">
          {latin}
        </span>
      ) : null}
      <span className="ml-auto shrink-0 font-mono text-xs tabular-nums text-muted-foreground/80">
        {count.toString().padStart(2, "0")}
      </span>
    </button>
  )
}

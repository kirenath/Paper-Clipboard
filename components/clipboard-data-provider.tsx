"use client"

import * as React from "react"
import useSWR, { mutate } from "swr"
import type { ClipboardGroup, ClipboardItem, ClipboardTag } from "@/lib/types"

type FilterState = {
  groupFilter: string | "all" | "default"
  tagFilter: string | null
  query: string
}

type Ctx = {
  items: ClipboardItem[] | undefined
  groups: ClipboardGroup[] | undefined
  tags: ClipboardTag[] | undefined
  itemsLoading: boolean
  filters: FilterState
  setGroupFilter: (v: FilterState["groupFilter"]) => void
  setTagFilter: (v: string | null) => void
  setQuery: (v: string) => void
  refresh: () => void
}

const ClipboardCtx = React.createContext<Ctx | null>(null)

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error("请求失败")
  }
  return res.json()
}

export const ITEMS_KEY = "/api/items"
export const GROUPS_KEY = "/api/groups"
export const TAGS_KEY = "/api/tags"

export function refreshAllClipboardData() {
  mutate(ITEMS_KEY)
  mutate(GROUPS_KEY)
  mutate(TAGS_KEY)
}

export function ClipboardDataProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = React.useState<FilterState>({
    groupFilter: "all",
    tagFilter: null,
    query: "",
  })

  const itemsRes = useSWR<{ items: ClipboardItem[] }>(ITEMS_KEY, fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: false,
  })
  const groupsRes = useSWR<{ groups: ClipboardGroup[] }>(GROUPS_KEY, fetcher, {
    revalidateOnFocus: false,
  })
  const tagsRes = useSWR<{ tags: ClipboardTag[] }>(TAGS_KEY, fetcher, {
    revalidateOnFocus: false,
  })

  const value: Ctx = {
    items: itemsRes.data?.items,
    groups: groupsRes.data?.groups,
    tags: tagsRes.data?.tags,
    itemsLoading: itemsRes.isLoading,
    filters,
    setGroupFilter: (v) => setFilters((f) => ({ ...f, groupFilter: v })),
    setTagFilter: (v) => setFilters((f) => ({ ...f, tagFilter: v })),
    setQuery: (v) => setFilters((f) => ({ ...f, query: v })),
    refresh: refreshAllClipboardData,
  }

  return <ClipboardCtx.Provider value={value}>{children}</ClipboardCtx.Provider>
}

export function useClipboardData() {
  const ctx = React.useContext(ClipboardCtx)
  if (!ctx) throw new Error("useClipboardData must be used within ClipboardDataProvider")
  return ctx
}

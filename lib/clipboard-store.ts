import type { ClipboardGroup, ClipboardItem, ClipboardTag } from "@/lib/types"

// In-memory store for v0 preview.
// All CRUD operations go through this module so it can later be swapped
// out for a SQLite-backed implementation without changing UI or API code.
//
// To migrate to SQLite, re-implement the exported functions below using
// the schema in `db/schema.sql`. Field names in the DB use snake_case;
// the public API of this module always returns camelCase types.

type GroupRow = {
  id: string
  name: string
  sort_order: number | null
  created_at: string
  updated_at: string
}

type TagRow = {
  id: string
  name: string
  sort_order: number | null
  created_at: string
  updated_at: string
}

type ItemRow = {
  id: string
  group_id: string | null
  title: string | null
  content: string
  sort_order: number | null
  created_at: string
  updated_at: string
}

type ItemTagRow = {
  item_id: string
  tag_id: string
}

type Store = {
  groups: GroupRow[]
  tags: TagRow[]
  items: ItemRow[]
  itemTags: ItemTagRow[]
}

// Persist across HMR reloads in dev by attaching to globalThis.
const globalForStore = globalThis as unknown as {
  __clipboardStore?: Store
}

function nowIso() {
  return new Date().toISOString()
}

function seed(): Store {
  const t0 = new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
  const t1 = new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
  const t2 = new Date(Date.now() - 1000 * 60 * 30).toISOString()

  const groupServers: GroupRow = {
    id: crypto.randomUUID(),
    name: "服务器",
    sort_order: 1,
    created_at: t0,
    updated_at: t0,
  }
  const groupSecrets: GroupRow = {
    id: crypto.randomUUID(),
    name: "凭证",
    sort_order: 2,
    created_at: t0,
    updated_at: t0,
  }

  const tagSsh: TagRow = {
    id: crypto.randomUUID(),
    name: "ssh",
    sort_order: 1,
    created_at: t0,
    updated_at: t0,
  }
  const tagOtp: TagRow = {
    id: crypto.randomUUID(),
    name: "一次性",
    sort_order: 2,
    created_at: t0,
    updated_at: t0,
  }
  const tagVpn: TagRow = {
    id: crypto.randomUUID(),
    name: "vpn",
    sort_order: 3,
    created_at: t0,
    updated_at: t0,
  }

  const itemSsh: ItemRow = {
    id: crypto.randomUUID(),
    group_id: groupServers.id,
    title: "登录 vps",
    content: "ssh root@example.com -p 22",
    sort_order: 1,
    created_at: t0,
    updated_at: t1,
  }
  const itemOtp: ItemRow = {
    id: crypto.randomUUID(),
    group_id: groupSecrets.id,
    title: null,
    content: "738 219",
    sort_order: null,
    created_at: t1,
    updated_at: t1,
  }
  const itemNote: ItemRow = {
    id: crypto.randomUUID(),
    group_id: null,
    title: "顺手记一下",
    content:
      "这是一段比较长的临时文本。你可以把它从手机粘贴到电脑，或者反过来。\n这个应用本身不会自动同步，每条都需要你手动保存。",
    sort_order: null,
    created_at: t2,
    updated_at: t2,
  }

  return {
    groups: [groupServers, groupSecrets],
    tags: [tagSsh, tagOtp, tagVpn],
    items: [itemSsh, itemOtp, itemNote],
    itemTags: [
      { item_id: itemSsh.id, tag_id: tagSsh.id },
      { item_id: itemOtp.id, tag_id: tagOtp.id },
      { item_id: itemNote.id, tag_id: tagVpn.id },
    ],
  }
}

function getStore(): Store {
  if (!globalForStore.__clipboardStore) {
    globalForStore.__clipboardStore = seed()
  }
  return globalForStore.__clipboardStore
}

// Mappers ---------------------------------------------------------------

function mapGroup(row: GroupRow): ClipboardGroup {
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapTag(row: TagRow): ClipboardTag {
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapItem(row: ItemRow, store: Store): ClipboardItem {
  const group = row.group_id ? store.groups.find((g) => g.id === row.group_id) ?? null : null
  const tagIds = store.itemTags.filter((it) => it.item_id === row.id).map((it) => it.tag_id)
  const tags = store.tags.filter((t) => tagIds.includes(t.id)).map(mapTag)
  return {
    id: row.id,
    groupId: row.group_id,
    title: row.title,
    content: row.content,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    group: group ? mapGroup(group) : null,
    tags: sortTags(tags),
  }
}

// Sorting ---------------------------------------------------------------

function sortItems(items: ClipboardItem[]): ClipboardItem[] {
  const manual = items
    .filter((i) => i.sortOrder !== null)
    .sort((a, b) => {
      const so = (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
      if (so !== 0) return so
      return b.updatedAt.localeCompare(a.updatedAt)
    })
  const normal = items
    .filter((i) => i.sortOrder === null)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  return [...manual, ...normal]
}

function sortGroups(groups: ClipboardGroup[]): ClipboardGroup[] {
  const manual = groups
    .filter((g) => g.sortOrder !== null)
    .sort((a, b) => {
      const so = (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
      if (so !== 0) return so
      return a.name.localeCompare(b.name, "zh")
    })
  const normal = groups
    .filter((g) => g.sortOrder === null)
    .sort((a, b) => a.name.localeCompare(b.name, "zh"))
  return [...manual, ...normal]
}

function sortTags(tags: ClipboardTag[]): ClipboardTag[] {
  const manual = tags
    .filter((t) => t.sortOrder !== null)
    .sort((a, b) => {
      const so = (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
      if (so !== 0) return so
      return a.name.localeCompare(b.name, "zh")
    })
  const normal = tags
    .filter((t) => t.sortOrder === null)
    .sort((a, b) => a.name.localeCompare(b.name, "zh"))
  return [...manual, ...normal]
}

// Helpers ---------------------------------------------------------------

function normalizeTitle(title: string | null | undefined): string | null {
  if (title === null || title === undefined) return null
  const trimmed = title.trim()
  return trimmed.length === 0 ? null : trimmed
}

function normalizeSortOrder(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null
  if (Number.isNaN(value)) return null
  return Math.trunc(value)
}

export class StoreValidationError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
    this.name = "StoreValidationError"
  }
}

// Items -----------------------------------------------------------------

export async function listClipboardItems(options?: {
  groupId?: string | null | "default"
  tagIds?: string[]
  query?: string
}): Promise<ClipboardItem[]> {
  const store = getStore()
  let rows = store.items.slice()

  if (options?.groupId !== undefined) {
    if (options.groupId === null || options.groupId === "default") {
      rows = rows.filter((r) => r.group_id === null)
    } else if (typeof options.groupId === "string") {
      rows = rows.filter((r) => r.group_id === options.groupId)
    }
  }

  if (options?.tagIds && options.tagIds.length > 0) {
    const tagSet = new Set(options.tagIds)
    rows = rows.filter((r) => {
      const itemTagIds = store.itemTags.filter((it) => it.item_id === r.id).map((it) => it.tag_id)
      return itemTagIds.some((id) => tagSet.has(id))
    })
  }

  if (options?.query) {
    const q = options.query.trim().toLowerCase()
    if (q.length > 0) {
      rows = rows.filter(
        (r) =>
          (r.title ?? "").toLowerCase().includes(q) || r.content.toLowerCase().includes(q),
      )
    }
  }

  const items = rows.map((r) => mapItem(r, store))
  return sortItems(items)
}

export async function getClipboardItem(id: string): Promise<ClipboardItem | null> {
  const store = getStore()
  const row = store.items.find((r) => r.id === id)
  if (!row) return null
  return mapItem(row, store)
}

export async function createClipboardItem(input: {
  title?: string | null
  content: string
  groupId?: string | null
  tagIds?: string[]
  sortOrder?: number | null
}): Promise<ClipboardItem> {
  const store = getStore()
  const content = input.content?.trim()
  if (!content) {
    throw new StoreValidationError("正文不能为空")
  }
  if (input.groupId && !store.groups.find((g) => g.id === input.groupId)) {
    throw new StoreValidationError("指定的分组不存在", 404)
  }
  const tagIds = (input.tagIds ?? []).filter((id) => store.tags.find((t) => t.id === id))

  const now = nowIso()
  const row: ItemRow = {
    id: crypto.randomUUID(),
    group_id: input.groupId ?? null,
    title: normalizeTitle(input.title),
    content,
    sort_order: normalizeSortOrder(input.sortOrder),
    created_at: now,
    updated_at: now,
  }
  store.items.push(row)
  for (const tagId of tagIds) {
    store.itemTags.push({ item_id: row.id, tag_id: tagId })
  }
  return mapItem(row, store)
}

export async function updateClipboardItem(
  id: string,
  input: {
    title?: string | null
    content?: string
    groupId?: string | null
    tagIds?: string[]
    sortOrder?: number | null
  },
): Promise<ClipboardItem> {
  const store = getStore()
  const row = store.items.find((r) => r.id === id)
  if (!row) {
    throw new StoreValidationError("条目不存在", 404)
  }
  if (input.content !== undefined) {
    const content = input.content.trim()
    if (!content) throw new StoreValidationError("正文不能为空")
    row.content = content
  }
  if (input.title !== undefined) {
    row.title = normalizeTitle(input.title)
  }
  if (input.groupId !== undefined) {
    if (input.groupId !== null && !store.groups.find((g) => g.id === input.groupId)) {
      throw new StoreValidationError("指定的分组不存在", 404)
    }
    row.group_id = input.groupId
  }
  if (input.sortOrder !== undefined) {
    row.sort_order = normalizeSortOrder(input.sortOrder)
  }
  if (input.tagIds !== undefined) {
    const valid = input.tagIds.filter((tid) => store.tags.find((t) => t.id === tid))
    store.itemTags = store.itemTags.filter((it) => it.item_id !== id)
    for (const tagId of valid) {
      store.itemTags.push({ item_id: id, tag_id: tagId })
    }
  }
  row.updated_at = nowIso()
  return mapItem(row, store)
}

export async function deleteClipboardItem(id: string): Promise<void> {
  const store = getStore()
  const idx = store.items.findIndex((r) => r.id === id)
  if (idx === -1) {
    throw new StoreValidationError("条目不存在", 404)
  }
  store.items.splice(idx, 1)
  store.itemTags = store.itemTags.filter((it) => it.item_id !== id)
}

// Groups ----------------------------------------------------------------

export async function listClipboardGroups(): Promise<ClipboardGroup[]> {
  const store = getStore()
  return sortGroups(store.groups.map(mapGroup))
}

export async function createClipboardGroup(input: {
  name: string
  sortOrder?: number | null
}): Promise<ClipboardGroup> {
  const store = getStore()
  const name = input.name?.trim()
  if (!name) throw new StoreValidationError("分组名不能为空")
  if (store.groups.find((g) => g.name === name)) {
    throw new StoreValidationError("已存在同名分组", 409)
  }
  const now = nowIso()
  const row: GroupRow = {
    id: crypto.randomUUID(),
    name,
    sort_order: normalizeSortOrder(input.sortOrder),
    created_at: now,
    updated_at: now,
  }
  store.groups.push(row)
  return mapGroup(row)
}

export async function updateClipboardGroup(
  id: string,
  input: { name?: string; sortOrder?: number | null },
): Promise<ClipboardGroup> {
  const store = getStore()
  const row = store.groups.find((g) => g.id === id)
  if (!row) throw new StoreValidationError("分组不存在", 404)
  if (input.name !== undefined) {
    const name = input.name.trim()
    if (!name) throw new StoreValidationError("分组名不能为空")
    if (store.groups.find((g) => g.id !== id && g.name === name)) {
      throw new StoreValidationError("已存在同名分组", 409)
    }
    row.name = name
  }
  if (input.sortOrder !== undefined) {
    row.sort_order = normalizeSortOrder(input.sortOrder)
  }
  row.updated_at = nowIso()
  return mapGroup(row)
}

export async function deleteClipboardGroup(id: string): Promise<void> {
  const store = getStore()
  const idx = store.groups.findIndex((g) => g.id === id)
  if (idx === -1) throw new StoreValidationError("分组不存在", 404)
  // Items in this group fall back to the default (null) group.
  for (const item of store.items) {
    if (item.group_id === id) item.group_id = null
  }
  store.groups.splice(idx, 1)
}

// Tags ------------------------------------------------------------------

export async function listClipboardTags(): Promise<ClipboardTag[]> {
  const store = getStore()
  return sortTags(store.tags.map(mapTag))
}

export async function createClipboardTag(input: {
  name: string
  sortOrder?: number | null
}): Promise<ClipboardTag> {
  const store = getStore()
  const name = input.name?.trim()
  if (!name) throw new StoreValidationError("标签名不能为空")
  if (store.tags.find((t) => t.name === name)) {
    throw new StoreValidationError("已存在同名标签", 409)
  }
  const now = nowIso()
  const row: TagRow = {
    id: crypto.randomUUID(),
    name,
    sort_order: normalizeSortOrder(input.sortOrder),
    created_at: now,
    updated_at: now,
  }
  store.tags.push(row)
  return mapTag(row)
}

export async function updateClipboardTag(
  id: string,
  input: { name?: string; sortOrder?: number | null },
): Promise<ClipboardTag> {
  const store = getStore()
  const row = store.tags.find((t) => t.id === id)
  if (!row) throw new StoreValidationError("标签不存在", 404)
  if (input.name !== undefined) {
    const name = input.name.trim()
    if (!name) throw new StoreValidationError("标签名不能为空")
    if (store.tags.find((t) => t.id !== id && t.name === name)) {
      throw new StoreValidationError("已存在同名标签", 409)
    }
    row.name = name
  }
  if (input.sortOrder !== undefined) {
    row.sort_order = normalizeSortOrder(input.sortOrder)
  }
  row.updated_at = nowIso()
  return mapTag(row)
}

export async function deleteClipboardTag(id: string): Promise<void> {
  const store = getStore()
  const idx = store.tags.findIndex((t) => t.id === id)
  if (idx === -1) throw new StoreValidationError("标签不存在", 404)
  // Removing a tag should not delete items, only relations.
  store.itemTags = store.itemTags.filter((it) => it.tag_id !== id)
  store.tags.splice(idx, 1)
}

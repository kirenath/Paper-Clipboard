import "server-only";

import { getDb } from "@/lib/db";
import type { ClipboardGroup, ClipboardItem, ClipboardTag } from "@/lib/types";

type GroupRow = {
  id: string;
  name: string;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
};

type TagRow = {
  id: string;
  name: string;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
};

type ItemRow = {
  id: string;
  group_id: string | null;
  title: string | null;
  content: string;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
};

function nowIso() {
  return new Date().toISOString();
}

function mapGroup(row: GroupRow): ClipboardGroup {
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTag(row: TagRow): ClipboardTag {
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function sortItems(items: ClipboardItem[]): ClipboardItem[] {
  const manual = items
    .filter((i) => i.sortOrder !== null)
    .sort((a, b) => {
      const so = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      if (so !== 0) return so;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  const normal = items
    .filter((i) => i.sortOrder === null)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return [...manual, ...normal];
}

function sortGroups(groups: ClipboardGroup[]): ClipboardGroup[] {
  const manual = groups
    .filter((g) => g.sortOrder !== null)
    .sort((a, b) => {
      const so = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      if (so !== 0) return so;
      return a.name.localeCompare(b.name, "zh");
    });
  const normal = groups
    .filter((g) => g.sortOrder === null)
    .sort((a, b) => a.name.localeCompare(b.name, "zh"));
  return [...manual, ...normal];
}

function sortTags(tags: ClipboardTag[]): ClipboardTag[] {
  const manual = tags
    .filter((t) => t.sortOrder !== null)
    .sort((a, b) => {
      const so = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      if (so !== 0) return so;
      return a.name.localeCompare(b.name, "zh");
    });
  const normal = tags
    .filter((t) => t.sortOrder === null)
    .sort((a, b) => a.name.localeCompare(b.name, "zh"));
  return [...manual, ...normal];
}

function normalizeTitle(title: string | null | undefined): string | null {
  if (title === null || title === undefined) return null;
  const trimmed = title.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function normalizeSortOrder(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (Number.isNaN(value)) return null;
  return Math.trunc(value);
}

function uniqueValues(values: string[]): string[] {
  return [
    ...new Set(
      values.filter((value) => typeof value === "string" && value.length > 0),
    ),
  ];
}

function isUniqueConstraintError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === "SQLITE_CONSTRAINT_UNIQUE"
  );
}

export class StoreValidationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
    this.name = "StoreValidationError";
  }
}

function getGroupRow(id: string): GroupRow | undefined {
  return getDb()
    .prepare("SELECT * FROM clipboard_groups WHERE id = ?")
    .get(id) as GroupRow | undefined;
}

function getTagRow(id: string): TagRow | undefined {
  return getDb()
    .prepare("SELECT * FROM clipboard_tags WHERE id = ?")
    .get(id) as TagRow | undefined;
}

function getItemRow(id: string): ItemRow | undefined {
  return getDb()
    .prepare("SELECT * FROM clipboard_items WHERE id = ?")
    .get(id) as ItemRow | undefined;
}

function getTagsForItem(itemId: string): ClipboardTag[] {
  const rows = getDb()
    .prepare(
      `SELECT t.*
       FROM clipboard_tags t
       INNER JOIN clipboard_item_tags it ON it.tag_id = t.id
       WHERE it.item_id = ?`,
    )
    .all(itemId) as TagRow[];
  return sortTags(rows.map(mapTag));
}

function mapItem(row: ItemRow): ClipboardItem {
  const group = row.group_id ? getGroupRow(row.group_id) : undefined;
  return {
    id: row.id,
    groupId: row.group_id,
    title: row.title,
    content: row.content,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    group: group ? mapGroup(group) : null,
    tags: getTagsForItem(row.id),
  };
}

function validateGroupExists(groupId: string | null | undefined) {
  if (groupId && !getGroupRow(groupId)) {
    throw new StoreValidationError("指定的分组不存在", 404);
  }
}

function filterExistingTagIds(tagIds: string[]): string[] {
  const ids = uniqueValues(tagIds);
  if (ids.length === 0) return [];
  const existing: string[] = [];
  const stmt = getDb().prepare("SELECT id FROM clipboard_tags WHERE id = ?");
  for (const id of ids) {
    const row = stmt.get(id) as { id: string } | undefined;
    if (row) existing.push(row.id);
  }
  return existing;
}

export async function listClipboardItems(options?: {
  groupId?: string | null | "default";
  tagIds?: string[];
  query?: string;
}): Promise<ClipboardItem[]> {
  const db = getDb();
  let sql = "SELECT DISTINCT i.* FROM clipboard_items i";
  const where: string[] = [];
  const params: unknown[] = [];

  if (options?.tagIds && options.tagIds.length > 0) {
    sql +=
      " INNER JOIN clipboard_item_tags filter_tags ON filter_tags.item_id = i.id";
    const tagIds = uniqueValues(options.tagIds);
    if (tagIds.length > 0) {
      where.push(`filter_tags.tag_id IN (${tagIds.map(() => "?").join(", ")})`);
      params.push(...tagIds);
    }
  }

  if (options?.groupId !== undefined) {
    if (options.groupId === null || options.groupId === "default") {
      where.push("i.group_id IS NULL");
    } else if (typeof options.groupId === "string") {
      where.push("i.group_id = ?");
      params.push(options.groupId);
    }
  }

  if (options?.query) {
    const q = options.query.trim().toLowerCase();
    if (q.length > 0) {
      where.push(
        "(LOWER(COALESCE(i.title, '')) LIKE ? OR LOWER(i.content) LIKE ?)",
      );
      params.push(`%${q}%`, `%${q}%`);
    }
  }

  if (where.length > 0) sql += ` WHERE ${where.join(" AND ")}`;
  const rows = db.prepare(sql).all(...params) as ItemRow[];
  return sortItems(rows.map(mapItem));
}

export async function getClipboardItem(
  id: string,
): Promise<ClipboardItem | null> {
  const row = getItemRow(id);
  if (!row) return null;
  return mapItem(row);
}

export async function createClipboardItem(input: {
  title?: string | null;
  content: string;
  groupId?: string | null;
  tagIds?: string[];
  sortOrder?: number | null;
}): Promise<ClipboardItem> {
  const content = input.content?.trim();
  if (!content) throw new StoreValidationError("正文不能为空");
  validateGroupExists(input.groupId ?? null);

  const db = getDb();
  const now = nowIso();
  const id = crypto.randomUUID();
  const tagIds = filterExistingTagIds(input.tagIds ?? []);

  const create = db.transaction(() => {
    db.prepare(
      `INSERT INTO clipboard_items (id, group_id, title, content, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      input.groupId ?? null,
      normalizeTitle(input.title),
      content,
      normalizeSortOrder(input.sortOrder),
      now,
      now,
    );

    const insertTag = db.prepare(
      "INSERT OR IGNORE INTO clipboard_item_tags (item_id, tag_id) VALUES (?, ?)",
    );
    for (const tagId of tagIds) insertTag.run(id, tagId);
  });
  create();

  return mapItem(getItemRow(id)!);
}

export async function updateClipboardItem(
  id: string,
  input: {
    title?: string | null;
    content?: string;
    groupId?: string | null;
    tagIds?: string[];
    sortOrder?: number | null;
  },
): Promise<ClipboardItem> {
  if (!getItemRow(id)) throw new StoreValidationError("条目不存在", 404);

  let content: string | undefined;
  if (input.content !== undefined) {
    content = input.content.trim();
    if (!content) throw new StoreValidationError("正文不能为空");
  }
  if (input.groupId !== undefined) validateGroupExists(input.groupId);

  const db = getDb();
  const tagIds =
    input.tagIds !== undefined ? filterExistingTagIds(input.tagIds) : undefined;
  const updatedAt = nowIso();

  const update = db.transaction(() => {
    if (input.title !== undefined) {
      db.prepare(
        "UPDATE clipboard_items SET title = ?, updated_at = ? WHERE id = ?",
      ).run(normalizeTitle(input.title), updatedAt, id);
    }
    if (content !== undefined) {
      db.prepare(
        "UPDATE clipboard_items SET content = ?, updated_at = ? WHERE id = ?",
      ).run(content, updatedAt, id);
    }
    if (input.groupId !== undefined) {
      db.prepare(
        "UPDATE clipboard_items SET group_id = ?, updated_at = ? WHERE id = ?",
      ).run(input.groupId, updatedAt, id);
    }
    if (input.sortOrder !== undefined) {
      db.prepare(
        "UPDATE clipboard_items SET sort_order = ?, updated_at = ? WHERE id = ?",
      ).run(normalizeSortOrder(input.sortOrder), updatedAt, id);
    }
    if (tagIds !== undefined) {
      db.prepare("DELETE FROM clipboard_item_tags WHERE item_id = ?").run(id);
      const insertTag = db.prepare(
        "INSERT OR IGNORE INTO clipboard_item_tags (item_id, tag_id) VALUES (?, ?)",
      );
      for (const tagId of tagIds) insertTag.run(id, tagId);
      db.prepare("UPDATE clipboard_items SET updated_at = ? WHERE id = ?").run(
        updatedAt,
        id,
      );
    }
  });
  update();

  return mapItem(getItemRow(id)!);
}

export async function deleteClipboardItem(id: string): Promise<void> {
  const result = getDb()
    .prepare("DELETE FROM clipboard_items WHERE id = ?")
    .run(id);
  if (result.changes === 0) throw new StoreValidationError("条目不存在", 404);
}

export async function listClipboardGroups(): Promise<ClipboardGroup[]> {
  const rows = getDb()
    .prepare("SELECT * FROM clipboard_groups")
    .all() as GroupRow[];
  return sortGroups(rows.map(mapGroup));
}

export async function createClipboardGroup(input: {
  name: string;
  sortOrder?: number | null;
}): Promise<ClipboardGroup> {
  const name = input.name?.trim();
  if (!name) throw new StoreValidationError("分组名不能为空");
  const now = nowIso();
  const id = crypto.randomUUID();
  try {
    getDb()
      .prepare(
        `INSERT INTO clipboard_groups (id, name, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(id, name, normalizeSortOrder(input.sortOrder), now, now);
  } catch (err) {
    if (isUniqueConstraintError(err))
      throw new StoreValidationError("已存在同名分组", 409);
    throw err;
  }
  return mapGroup(getGroupRow(id)!);
}

export async function updateClipboardGroup(
  id: string,
  input: { name?: string; sortOrder?: number | null },
): Promise<ClipboardGroup> {
  if (!getGroupRow(id)) throw new StoreValidationError("分组不存在", 404);
  const updatedAt = nowIso();
  try {
    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name) throw new StoreValidationError("分组名不能为空");
      getDb()
        .prepare(
          "UPDATE clipboard_groups SET name = ?, updated_at = ? WHERE id = ?",
        )
        .run(name, updatedAt, id);
    }
    if (input.sortOrder !== undefined) {
      getDb()
        .prepare(
          "UPDATE clipboard_groups SET sort_order = ?, updated_at = ? WHERE id = ?",
        )
        .run(normalizeSortOrder(input.sortOrder), updatedAt, id);
    }
  } catch (err) {
    if (isUniqueConstraintError(err))
      throw new StoreValidationError("已存在同名分组", 409);
    throw err;
  }
  return mapGroup(getGroupRow(id)!);
}

export async function deleteClipboardGroup(id: string): Promise<void> {
  const db = getDb();
  const remove = db.transaction(() => {
    const exists = getGroupRow(id);
    if (!exists) throw new StoreValidationError("分组不存在", 404);
    db.prepare(
      "UPDATE clipboard_items SET group_id = NULL, updated_at = ? WHERE group_id = ?",
    ).run(nowIso(), id);
    db.prepare("DELETE FROM clipboard_groups WHERE id = ?").run(id);
  });
  remove();
}

export async function listClipboardTags(): Promise<ClipboardTag[]> {
  const rows = getDb()
    .prepare("SELECT * FROM clipboard_tags")
    .all() as TagRow[];
  return sortTags(rows.map(mapTag));
}

export async function createClipboardTag(input: {
  name: string;
  sortOrder?: number | null;
}): Promise<ClipboardTag> {
  const name = input.name?.trim();
  if (!name) throw new StoreValidationError("标签名不能为空");
  const now = nowIso();
  const id = crypto.randomUUID();
  try {
    getDb()
      .prepare(
        `INSERT INTO clipboard_tags (id, name, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(id, name, normalizeSortOrder(input.sortOrder), now, now);
  } catch (err) {
    if (isUniqueConstraintError(err))
      throw new StoreValidationError("已存在同名标签", 409);
    throw err;
  }
  return mapTag(getTagRow(id)!);
}

export async function updateClipboardTag(
  id: string,
  input: { name?: string; sortOrder?: number | null },
): Promise<ClipboardTag> {
  if (!getTagRow(id)) throw new StoreValidationError("标签不存在", 404);
  const updatedAt = nowIso();
  try {
    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name) throw new StoreValidationError("标签名不能为空");
      getDb()
        .prepare(
          "UPDATE clipboard_tags SET name = ?, updated_at = ? WHERE id = ?",
        )
        .run(name, updatedAt, id);
    }
    if (input.sortOrder !== undefined) {
      getDb()
        .prepare(
          "UPDATE clipboard_tags SET sort_order = ?, updated_at = ? WHERE id = ?",
        )
        .run(normalizeSortOrder(input.sortOrder), updatedAt, id);
    }
  } catch (err) {
    if (isUniqueConstraintError(err))
      throw new StoreValidationError("已存在同名标签", 409);
    throw err;
  }
  return mapTag(getTagRow(id)!);
}

export async function deleteClipboardTag(id: string): Promise<void> {
  const db = getDb();
  const remove = db.transaction(() => {
    const exists = getTagRow(id);
    if (!exists) throw new StoreValidationError("标签不存在", 404);
    db.prepare("DELETE FROM clipboard_item_tags WHERE tag_id = ?").run(id);
    db.prepare("DELETE FROM clipboard_tags WHERE id = ?").run(id);
  });
  remove();
}

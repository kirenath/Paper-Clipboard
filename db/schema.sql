-- 纸片剪贴板 schema (single source of truth)
-- This SQLite-compatible schema mirrors the in-memory store used in v0 preview.

CREATE TABLE IF NOT EXISTS clipboard_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS clipboard_tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS clipboard_items (
  id TEXT PRIMARY KEY,
  group_id TEXT,
  title TEXT,
  content TEXT NOT NULL,
  sort_order INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (group_id) REFERENCES clipboard_groups(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS clipboard_item_tags (
  item_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (item_id, tag_id),
  FOREIGN KEY (item_id) REFERENCES clipboard_items(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES clipboard_tags(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_clipboard_items_group_id
ON clipboard_items (group_id);

CREATE INDEX IF NOT EXISTS idx_clipboard_items_sort_order
ON clipboard_items (sort_order);

CREATE INDEX IF NOT EXISTS idx_clipboard_items_updated_at
ON clipboard_items (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_clipboard_groups_sort_order
ON clipboard_groups (sort_order);

CREATE INDEX IF NOT EXISTS idx_clipboard_tags_sort_order
ON clipboard_tags (sort_order);

CREATE INDEX IF NOT EXISTS idx_clipboard_item_tags_tag_id
ON clipboard_item_tags (tag_id);

export type ClipboardGroup = {
  id: string
  name: string
  sortOrder: number | null
  createdAt: string
  updatedAt: string
}

export type ClipboardTag = {
  id: string
  name: string
  sortOrder: number | null
  createdAt: string
  updatedAt: string
}

export type ClipboardItem = {
  id: string
  groupId: string | null
  title: string | null
  content: string
  sortOrder: number | null
  createdAt: string
  updatedAt: string
  group?: ClipboardGroup | null
  tags: ClipboardTag[]
}

export const DEFAULT_GROUP_LABEL = "默认"

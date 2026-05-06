import { NextResponse } from "next/server"
import {
  createClipboardItem,
  listClipboardItems,
  StoreValidationError,
} from "@/lib/clipboard-store"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const groupParam = searchParams.get("groupId")
  const tagParam = searchParams.getAll("tagId")
  const query = searchParams.get("q") ?? undefined

  let groupId: string | null | "default" | undefined
  if (groupParam === null) groupId = undefined
  else if (groupParam === "default" || groupParam === "") groupId = "default"
  else groupId = groupParam

  const items = await listClipboardItems({
    groupId,
    tagIds: tagParam.length > 0 ? tagParam : undefined,
    query,
  })
  return NextResponse.json({ items })
}

export async function POST(req: Request) {
  let body: {
    title?: string | null
    content?: string
    groupId?: string | null
    tagIds?: string[]
    sortOrder?: number | null
  } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 })
  }
  if (typeof body.content !== "string") {
    return NextResponse.json({ error: "正文不能为空" }, { status: 400 })
  }
  try {
    const item = await createClipboardItem({
      title: body.title ?? null,
      content: body.content,
      groupId: body.groupId ?? null,
      tagIds: body.tagIds ?? [],
      sortOrder: body.sortOrder ?? null,
    })
    return NextResponse.json({ item }, { status: 201 })
  } catch (err) {
    if (err instanceof StoreValidationError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}

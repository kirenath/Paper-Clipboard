import { NextResponse } from "next/server"
import {
  createClipboardGroup,
  listClipboardGroups,
  StoreValidationError,
} from "@/lib/clipboard-store"

export async function GET() {
  const groups = await listClipboardGroups()
  return NextResponse.json({ groups })
}

export async function POST(req: Request) {
  let body: { name?: string; sortOrder?: number | null } = {}
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 })
  }
  if (typeof body.name !== "string") {
    return NextResponse.json({ error: "分组名不能为空" }, { status: 400 })
  }
  try {
    const group = await createClipboardGroup({
      name: body.name,
      sortOrder: body.sortOrder ?? null,
    })
    return NextResponse.json({ group }, { status: 201 })
  } catch (err) {
    if (err instanceof StoreValidationError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}

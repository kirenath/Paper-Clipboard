import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { enforceCsrf } from "@/lib/csrf";
import {
  createClipboardGroup,
  listClipboardGroups,
  StoreValidationError,
} from "@/lib/clipboard-store";

export const runtime = "nodejs";

export async function GET() {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;

  try {
    const groups = await listClipboardGroups();
    return NextResponse.json({ groups });
  } catch {
    return NextResponse.json({ error: "读取分组失败" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;
  const csrfError = enforceCsrf(req);
  if (csrfError) return csrfError;

  let body: { name?: string; sortOrder?: number | null } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
  if (typeof body.name !== "string") {
    return NextResponse.json({ error: "分组名不能为空" }, { status: 400 });
  }
  try {
    const group = await createClipboardGroup({
      name: body.name,
      sortOrder: body.sortOrder ?? null,
    });
    return NextResponse.json({ group }, { status: 201 });
  } catch (err) {
    if (err instanceof StoreValidationError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "创建分组失败" }, { status: 500 });
  }
}

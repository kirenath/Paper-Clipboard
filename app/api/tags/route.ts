import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { enforceCsrf } from "@/lib/csrf";
import {
  createClipboardTag,
  listClipboardTags,
  StoreValidationError,
} from "@/lib/clipboard-store";

export const runtime = "nodejs";

export async function GET() {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;

  try {
    const tags = await listClipboardTags();
    return NextResponse.json({ tags });
  } catch {
    return NextResponse.json({ error: "读取标签失败" }, { status: 500 });
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
    return NextResponse.json({ error: "标签名不能为空" }, { status: 400 });
  }
  try {
    const tag = await createClipboardTag({
      name: body.name,
      sortOrder: body.sortOrder ?? null,
    });
    return NextResponse.json({ tag }, { status: 201 });
  } catch (err) {
    if (err instanceof StoreValidationError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "创建标签失败" }, { status: 500 });
  }
}

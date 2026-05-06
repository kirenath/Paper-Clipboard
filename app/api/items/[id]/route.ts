import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { enforceCsrf } from "@/lib/csrf";
import {
  deleteClipboardItem,
  updateClipboardItem,
  StoreValidationError,
} from "@/lib/clipboard-store";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;
  const csrfError = enforceCsrf(req);
  if (csrfError) return csrfError;

  const { id } = await ctx.params;
  let body: {
    title?: string | null;
    content?: string;
    groupId?: string | null;
    tagIds?: string[];
    sortOrder?: number | null;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
  try {
    const item = await updateClipboardItem(id, body);
    return NextResponse.json({ item });
  } catch (err) {
    if (err instanceof StoreValidationError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "更新条目失败" }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  const unauthorized = await requireAuth();
  if (unauthorized) return unauthorized;
  const csrfError = enforceCsrf(req);
  if (csrfError) return csrfError;

  const { id } = await ctx.params;
  try {
    await deleteClipboardItem(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof StoreValidationError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "删除条目失败" }, { status: 500 });
  }
}

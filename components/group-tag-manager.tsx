"use client"

import * as React from "react"
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useClipboardData, refreshAllClipboardData } from "@/components/clipboard-data-provider"

export function GroupTagManager({
  trigger,
}: {
  trigger: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>管理分组和标签</DialogTitle>
          <DialogDescription>
            分组和标签都是可选的，用来帮你组织条目。删除分组会把其中的条目放回默认分组。
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="groups">
          <TabsList className="w-full">
            <TabsTrigger value="groups" className="flex-1">分组</TabsTrigger>
            <TabsTrigger value="tags" className="flex-1">标签</TabsTrigger>
          </TabsList>
          <TabsContent value="groups" className="mt-4">
            <ManagerSection kind="groups" />
          </TabsContent>
          <TabsContent value="tags" className="mt-4">
            <ManagerSection kind="tags" />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

type Kind = "groups" | "tags"

type Entity = {
  id: string
  name: string
  sortOrder: number | null
}

function ManagerSection({ kind }: { kind: Kind }) {
  const { groups, tags } = useClipboardData()
  const items: Entity[] =
    kind === "groups"
      ? (groups ?? []).map((g) => ({ id: g.id, name: g.name, sortOrder: g.sortOrder }))
      : (tags ?? []).map((t) => ({ id: t.id, name: t.name, sortOrder: t.sortOrder }))

  const [newName, setNewName] = React.useState("")
  const [newSort, setNewSort] = React.useState("")
  const [creating, setCreating] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editName, setEditName] = React.useState("")
  const [editSort, setEditSort] = React.useState("")
  const [savingEdit, setSavingEdit] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<Entity | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  const baseUrl = kind === "groups" ? "/api/groups" : "/api/tags"
  const labelSingular = kind === "groups" ? "分组" : "标签"

  function startEdit(entity: Entity) {
    setEditingId(entity.id)
    setEditName(entity.name)
    setEditSort(entity.sortOrder !== null ? String(entity.sortOrder) : "")
  }
  function cancelEdit() {
    setEditingId(null)
    setEditName("")
    setEditSort("")
  }

  async function create(e: React.FormEvent) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    setCreating(true)
    try {
      const parsedSort = newSort.trim() === "" ? null : Number(newSort)
      const res = await fetch(baseUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          sortOrder:
            parsedSort === null || Number.isNaN(parsedSort) ? null : parsedSort,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        toast.error(data.error ?? "创建失败")
        return
      }
      toast.success(`已创建${labelSingular}`)
      setNewName("")
      setNewSort("")
      refreshAllClipboardData()
    } finally {
      setCreating(false)
    }
  }

  async function saveEdit() {
    if (!editingId) return
    const name = editName.trim()
    if (!name) return
    setSavingEdit(true)
    try {
      const parsedSort = editSort.trim() === "" ? null : Number(editSort)
      const res = await fetch(`${baseUrl}/${editingId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          sortOrder:
            parsedSort === null || Number.isNaN(parsedSort) ? null : parsedSort,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        toast.error(data.error ?? "更新失败")
        return
      }
      toast.success("已更新")
      cancelEdit()
      refreshAllClipboardData()
    } finally {
      setSavingEdit(false)
    }
  }

  async function doDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`${baseUrl}/${deleteTarget.id}`, { method: "DELETE" })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        toast.error(data.error ?? "删除失败")
        return
      }
      toast.success("已删除")
      setDeleteTarget(null)
      refreshAllClipboardData()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={create} className="flex flex-col gap-2 rounded-md border border-dashed border-border bg-muted/40 p-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">名称</label>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={`新${labelSingular}名称`}
          />
        </div>
        <div className="flex w-full flex-col gap-1.5 sm:w-28">
          <label className="text-xs text-muted-foreground">排序</label>
          <Input
            type="number"
            inputMode="numeric"
            value={newSort}
            onChange={(e) => setNewSort(e.target.value)}
            placeholder="可选"
          />
        </div>
        <Button type="submit" disabled={!newName.trim() || creating}>
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          添加
        </Button>
      </form>

      <ScrollArea className="max-h-72">
        {items.length === 0 ? (
          <p className="px-1 py-8 text-center text-sm text-muted-foreground">
            {kind === "groups" ? "还没有自定义分组" : "还没有标签"}
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {items.map((entity) => {
              const editing = editingId === entity.id
              return (
                <li
                  key={entity.id}
                  className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-2"
                >
                  {editing ? (
                    <>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8 flex-1"
                        autoFocus
                      />
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={editSort}
                        onChange={(e) => setEditSort(e.target.value)}
                        className="h-8 w-20"
                        placeholder="排序"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={saveEdit}
                        disabled={savingEdit || !editName.trim()}
                        aria-label="保存"
                      >
                        {savingEdit ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={cancelEdit}
                        aria-label="取消"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 truncate text-sm">{entity.name}</span>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {entity.sortOrder !== null ? `#${entity.sortOrder}` : "—"}
                      </span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => startEdit(entity)}
                        aria-label="重命名"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(entity)}
                        aria-label="删除"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </ScrollArea>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              删除{labelSingular} “{deleteTarget?.name}”？
            </AlertDialogTitle>
            <AlertDialogDescription>
              {kind === "groups"
                ? "其中的条目会被放回默认分组，不会被删除。"
                : "条目上的这个标签会被移除，条目本身不会被删除。"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                doDelete()
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

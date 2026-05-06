"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useClipboardData, refreshAllClipboardData } from "@/components/clipboard-data-provider"
import type { ClipboardGroup } from "@/lib/types"

const NEW_GROUP_VALUE = "__new_group__"
const DEFAULT_VALUE = "__default__"

export function GroupSelect({
  value,
  onChange,
}: {
  value: string | null
  onChange: (groupId: string | null) => void
}) {
  const { groups } = useClipboardData()
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const selectValue = value === null ? DEFAULT_VALUE : value

  return (
    <>
      <Select
        value={selectValue}
        onValueChange={(v) => {
          if (v === NEW_GROUP_VALUE) {
            setDialogOpen(true)
            return
          }
          onChange(v === DEFAULT_VALUE ? null : v)
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="选择分组" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={DEFAULT_VALUE}>默认</SelectItem>
          {groups && groups.length > 0 ? (
            <>
              <SelectSeparator />
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </>
          ) : null}
          <SelectSeparator />
          <SelectItem value={NEW_GROUP_VALUE}>
            <span className="flex items-center gap-2 text-primary">
              <Plus className="h-3.5 w-3.5" />
              新建分组…
            </span>
          </SelectItem>
        </SelectContent>
      </Select>

      <NewGroupDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={(g) => onChange(g.id)}
      />
    </>
  )
}

function NewGroupDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (group: ClipboardGroup) => void
}) {
  const [name, setName] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (!open) setName("")
  }, [open])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      })
      const data = (await res.json().catch(() => ({}))) as { group?: ClipboardGroup; error?: string }
      if (!res.ok || !data.group) {
        toast.error(data.error ?? "创建失败")
        return
      }
      toast.success("已创建分组")
      onCreated(data.group)
      refreshAllClipboardData()
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新建分组</DialogTitle>
          <DialogDescription>分组用来把相关条目组织在一起。</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-group-name">分组名</Label>
            <Input
              id="new-group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：服务器"
              autoFocus
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={submitting || !name.trim()}>
              确认
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

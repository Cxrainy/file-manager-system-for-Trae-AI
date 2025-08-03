import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface DialogInputProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  label: string
  placeholder?: string
  defaultValue?: string
  onConfirm: (value: string) => void
  onCancel?: () => void
}

export function DialogInput({
  open,
  onOpenChange,
  title,
  label,
  placeholder,
  defaultValue = '',
  onConfirm,
  onCancel,
}: DialogInputProps) {
  const [value, setValue] = useState(defaultValue)

  React.useEffect(() => {
    if (open) {
      setValue(defaultValue)
    }
  }, [open, defaultValue])

  const handleConfirm = () => {
    if (value.trim()) {
      onConfirm(value.trim())
      onOpenChange(false)
    }
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleConfirm()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="input-value">{label}</Label>
            <Input
              id="input-value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            取消
          </Button>
          <Button onClick={handleConfirm} disabled={!value.trim()}>
            确认
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
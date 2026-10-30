import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  label: string
  className?: string
  children: ReactNode
}

export function Dialog({ open, onClose, label, className = '', children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
    if (!open) return
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      className={`dialog ${className}`}
      aria-label={label}
      onClose={onClose}
      onCancel={(event) => { event.preventDefault(); onClose() }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose() }}
    >
      <div className="dialog-inner">
        <button className="icon-button dialog-close" type="button" aria-label="Schließen" onClick={onClose} autoFocus>
          <X size={20} />
        </button>
        {children}
      </div>
    </dialog>
  )
}

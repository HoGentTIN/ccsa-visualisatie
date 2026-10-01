import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogPortal = DialogPrimitive.Portal

export function DialogOverlay({ className = '', ...props }: DialogPrimitive.DialogOverlayProps) {
    return (
        <DialogPrimitive.Overlay
            className={`fixed inset-0 z-50 bg-neutral-950/30 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 ${className}`}
            {...props}
        />
    )
}

export function DialogContent({ className = '', children, ...props }: DialogPrimitive.DialogContentProps) {
    return (
        <DialogPortal>
            <DialogOverlay />
            <DialogPrimitive.Content
                className={`fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white border border-neutral-200 rounded-xl shadow-2xl p-6 text-neutral-950 ${className}`}
                {...props}
            >
                {children}
            </DialogPrimitive.Content>
        </DialogPortal>
    )
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
    return <div className="mb-4">{children}</div>
}

export const DialogTitle = DialogPrimitive.Title
export const DialogClose = DialogPrimitive.Close
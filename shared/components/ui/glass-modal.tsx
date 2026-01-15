'use client'

import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  useEffect,
  useCallback,
} from 'react'
import { clsx } from 'clsx'
import { X } from 'lucide-react'
import { GlassButton, GlassIconButton } from './glass-button'

// Modal sizes - Neumorphism style
type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

interface GlassModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  size?: ModalSize
  title?: string
  description?: string
  showCloseButton?: boolean
  closeOnOverlay?: boolean
  closeOnEscape?: boolean
  className?: string
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
}

export function GlassModal({
  isOpen,
  onClose,
  children,
  size = 'md',
  title,
  description,
  showCloseButton = true,
  closeOnOverlay = true,
  closeOnEscape = true,
  className,
}: GlassModalProps) {
  // Handle escape key
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
        onClose()
      }
    },
    [closeOnEscape, onClose]
  )

  // Add/remove event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="modal-neu-overlay absolute inset-0 bg-black/40 animate-fade-in"
        onClick={closeOnOverlay ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
        className={clsx(
          'modal-neu relative w-full neu-lg',
          'p-6 rounded-neu-lg',
          'animate-scale-in',
          sizeClasses[size],
          className
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between mb-4">
            <div>
              {title && (
                <h2
                  id="modal-title"
                  className="text-lg font-semibold text-gray-900 dark:text-white"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id="modal-description"
                  className="mt-1 text-sm text-gray-600 dark:text-gray-300"
                >
                  {description}
                </p>
              )}
            </div>

            {showCloseButton && (
              <GlassIconButton
                icon={<X className="w-5 h-5" />}
                size="sm"
                variant="ghost"
                onClick={onClose}
                aria-label="Cerrar"
                className="flex-shrink-0 -mt-1 -mr-2"
              />
            )}
          </div>
        )}

        {/* Body */}
        {children}
      </div>
    </div>
  )
}

// Modal Footer component
interface GlassModalFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
}

export function GlassModalFooter({ children, className, ...props }: GlassModalFooterProps) {
  return (
    <div
      className={clsx(
        'flex items-center justify-end gap-3 mt-6 pt-4 border-t border-neu-dark/20 dark:border-neu-light-dark/20',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// Confirmation Modal
interface GlassConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'default'
  isLoading?: boolean
}

export function GlassConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default',
  isLoading = false,
}: GlassConfirmModalProps) {
  const buttonVariant = variant === 'danger' ? 'danger' : variant === 'warning' ? 'secondary' : 'primary'

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
    >
      <p className="text-gray-600 dark:text-gray-300">{message}</p>

      <GlassModalFooter>
        <GlassButton variant="ghost" onClick={onClose} disabled={isLoading}>
          {cancelText}
        </GlassButton>
        <GlassButton
          variant={buttonVariant}
          onClick={onConfirm}
          isLoading={isLoading}
        >
          {confirmText}
        </GlassButton>
      </GlassModalFooter>
    </GlassModal>
  )
}

export default GlassModal

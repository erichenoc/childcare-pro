'use client'

import { type HTMLAttributes, type ReactNode } from 'react'
import { clsx } from 'clsx'
import Image from 'next/image'

// Avatar sizes
type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

interface GlassAvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null
  alt?: string
  name?: string
  size?: AvatarSize
  fallbackIcon?: ReactNode
  className?: string
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-xs',
  sm: 'avatar-glass-sm',
  md: 'avatar-glass-md',
  lg: 'avatar-glass-lg',
  xl: 'w-20 h-20 text-2xl',
  '2xl': 'w-28 h-28 text-3xl',
}

const imageSizes: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 80,
  '2xl': 112,
}

// Get initials from name
function getInitials(name?: string): string {
  if (!name) return '?'
  const words = name.trim().split(/\s+/)
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase()
  }
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
}

// Generate a consistent color based on name
function getColorFromName(name?: string): string {
  if (!name) return 'bg-gray-500'

  const colors = [
    'bg-primary-500',
    'bg-secondary-500',
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-cyan-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-rose-500',
  ]

  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  return colors[Math.abs(hash) % colors.length]
}

export function GlassAvatar({
  src,
  alt,
  name,
  size = 'md',
  fallbackIcon,
  className,
  ...props
}: GlassAvatarProps) {
  const initials = getInitials(name)
  const bgColor = getColorFromName(name)
  const imageSize = imageSizes[size]

  return (
    <div
      className={clsx(
        'relative inline-flex items-center justify-center rounded-full overflow-hidden',
        'ring-2 ring-white/30 dark:ring-white/20',
        sizeClasses[size],
        !src && bgColor,
        className
      )}
      {...props}
    >
      {src ? (
        <Image
          src={src}
          alt={alt || name || 'Avatar'}
          width={imageSize}
          height={imageSize}
          className="object-cover w-full h-full"
        />
      ) : fallbackIcon ? (
        <span className="text-white">{fallbackIcon}</span>
      ) : (
        <span className="font-semibold text-white select-none">
          {initials}
        </span>
      )}
    </div>
  )
}

// Avatar Group
interface GlassAvatarGroupProps {
  children: ReactNode
  max?: number
  size?: AvatarSize
  className?: string
}

export function GlassAvatarGroup({
  children,
  max = 4,
  size = 'md',
  className,
}: GlassAvatarGroupProps) {
  const childArray = Array.isArray(children) ? children : [children]
  const visibleAvatars = childArray.slice(0, max)
  const remainingCount = childArray.length - max

  return (
    <div className={clsx('flex -space-x-2', className)}>
      {visibleAvatars}
      {remainingCount > 0 && (
        <div
          className={clsx(
            'relative inline-flex items-center justify-center rounded-full',
            'bg-gray-200 dark:bg-gray-700 ring-2 ring-white dark:ring-gray-900',
            sizeClasses[size]
          )}
        >
          <span className="font-semibold text-gray-600 dark:text-gray-300 text-xs">
            +{remainingCount}
          </span>
        </div>
      )}
    </div>
  )
}

export default GlassAvatar

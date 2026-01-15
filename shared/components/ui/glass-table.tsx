'use client'

import { type ReactNode, type ThHTMLAttributes, type TdHTMLAttributes, type HTMLAttributes } from 'react'
import { clsx } from 'clsx'

// Table wrapper
interface GlassTableProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
}

export function GlassTable({ children, className, ...props }: GlassTableProps) {
  return (
    <div className={clsx('table-glass overflow-hidden', className)} {...props}>
      <div className="overflow-x-auto">
        <table className="w-full">
          {children}
        </table>
      </div>
    </div>
  )
}

// Table Header
interface GlassTableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode
  className?: string
}

export function GlassTableHeader({ children, className, ...props }: GlassTableHeaderProps) {
  return (
    <thead
      className={clsx(
        'bg-white/5 dark:bg-black/5 border-b border-white/10',
        className
      )}
      {...props}
    >
      {children}
    </thead>
  )
}

// Table Body
interface GlassTableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode
  className?: string
}

export function GlassTableBody({ children, className, ...props }: GlassTableBodyProps) {
  return (
    <tbody className={clsx('divide-y divide-white/5', className)} {...props}>
      {children}
    </tbody>
  )
}

// Table Row
interface GlassTableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode
  isHoverable?: boolean
  isClickable?: boolean
  isSelected?: boolean
  className?: string
}

export function GlassTableRow({
  children,
  isHoverable = true,
  isClickable = false,
  isSelected = false,
  className,
  ...props
}: GlassTableRowProps) {
  return (
    <tr
      className={clsx(
        'transition-colors duration-150',
        isHoverable && 'hover:bg-white/5 dark:hover:bg-white/5',
        isClickable && 'cursor-pointer',
        isSelected && 'bg-primary-500/10',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  )
}

// Table Head Cell
interface GlassTableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode
  className?: string
}

export function GlassTableHead({ children, className, ...props }: GlassTableHeadProps) {
  return (
    <th
      className={clsx(
        'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider',
        'text-gray-600 dark:text-gray-400',
        className
      )}
      {...props}
    >
      {children}
    </th>
  )
}

// Table Cell
interface GlassTableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode
  className?: string
}

export function GlassTableCell({ children, className, ...props }: GlassTableCellProps) {
  return (
    <td
      className={clsx(
        'px-4 py-3 text-sm text-gray-900 dark:text-gray-100',
        className
      )}
      {...props}
    >
      {children}
    </td>
  )
}

// Empty state for table
interface GlassTableEmptyProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function GlassTableEmpty({
  icon,
  title,
  description,
  action,
  className,
}: GlassTableEmptyProps) {
  return (
    <tr>
      <td colSpan={100}>
        <div
          className={clsx(
            'flex flex-col items-center justify-center py-12 px-4 text-center',
            className
          )}
        >
          {icon && (
            <div className="mb-4 text-gray-400 dark:text-gray-500">
              {icon}
            </div>
          )}
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-sm">
              {description}
            </p>
          )}
          {action}
        </div>
      </td>
    </tr>
  )
}

export default GlassTable

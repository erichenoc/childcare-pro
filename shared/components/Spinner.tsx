export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3'
  }

  return (
    <div className={`${sizeClasses[size]} border-gray-300 dark:border-gray-600 border-t-primary-500 rounded-full animate-spin`} />
  )
}

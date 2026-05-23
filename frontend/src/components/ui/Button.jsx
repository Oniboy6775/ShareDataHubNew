import Spinner from './Spinner'

const variants = {
  primary:  'bg-primary hover:bg-secondary text-white',
  outline:  'border border-primary text-primary hover:bg-primary hover:text-white',
  danger:   'bg-red-600 hover:bg-red-700 text-white',
  ghost:    'text-gray-600 hover:bg-gray-100',
  secondary:'bg-gray-200 hover:bg-gray-300 text-gray-800',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
}

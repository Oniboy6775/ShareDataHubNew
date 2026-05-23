import { UserRound } from 'lucide-react'
import { useContactPicker } from '../../hooks/useContactPicker'

export default function PhoneInput({ label, contactName, onContactPick, className = '', ...props }) {
  const { isSupported, pick } = useContactPicker()

  const handlePick = async () => {
    const result = await pick()
    if (result) onContactPick?.(result)
  }

  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <div className="relative">
        <input
          className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary border-gray-300 ${isSupported ? 'pr-10' : ''} ${className}`}
          {...props}
        />
        {isSupported && (
          <button
            type="button"
            onClick={handlePick}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
            title="Pick from contacts"
          >
            <UserRound size={18} />
          </button>
        )}
      </div>
      {contactName && (
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <UserRound size={11} />
          {contactName}
        </p>
      )}
    </div>
  )
}

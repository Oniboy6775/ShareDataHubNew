import { UserRound, X } from 'lucide-react'
import { useContactPicker } from '../../hooks/useContactPicker'

export default function PhoneInput({ label, contactName, onContactPick, className = '', onChange, ...props }) {
  const { isSupported, pick } = useContactPicker()

  const handlePick = async () => {
    const result = await pick()
    if (result) onContactPick?.(result)
  }

  const handleClear = () => {
    onChange?.({ target: { value: '' } })
    onContactPick?.({ number: '', name: '' })
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
        {isSupported && (
          <button
            type="button"
            onClick={handlePick}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border-2 border-blue-500 text-blue-600 bg-blue-50 hover:bg-blue-100 active:scale-95 transition-all duration-150 shadow-sm"
          >
            <UserRound size={13} />
            From Contacts
          </button>
        )}
      </div>

      <div className="relative">
        <input
          className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary border-gray-300 ${className}`}
          onChange={onChange}
          {...props}
        />
      </div>

      {contactName && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 shrink-0">
            <UserRound size={13} className="text-white" />
          </div>
          <span className="text-xs font-semibold text-blue-700 flex-1 truncate">{contactName}</span>
          <button
            type="button"
            onClick={handleClear}
            className="text-blue-400 hover:text-blue-600 transition-colors"
            title="Remove contact"
          >
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  )
}

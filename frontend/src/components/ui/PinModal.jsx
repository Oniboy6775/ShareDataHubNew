import { useState, useEffect, useRef } from 'react'
import { Lock } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

export default function PinModal({ open, onSubmit, onClose, loading, title = 'Enter Transaction PIN' }) {
  const [pin, setPin] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) { setPin(''); setTimeout(() => inputRef.current?.focus(), 100) }
  }, [open])

  const handleChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4)
    setPin(val)
    if (val.length === 4) onSubmit(val)
  }

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm" zIndex="z-[60]">
      <div className="flex flex-col items-center gap-5 py-2">
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-indigo-50">
          <Lock size={22} className="text-indigo-600" />
        </div>

        {/* Dot indicators */}
        <div className="flex gap-3">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`h-3.5 w-3.5 rounded-full border-2 transition-all duration-150
                ${i < pin.length ? 'bg-indigo-600 border-indigo-600' : 'bg-transparent border-gray-300'}`}
            />
          ))}
        </div>

        {/* Hidden input captures keyboard / numpad */}
        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          value={pin}
          onChange={handleChange}
          className="opacity-0 absolute w-0 h-0"
          autoComplete="one-time-code"
        />

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-3 w-52">
          {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((k, i) => (
            <button
              key={i}
              type="button"
              disabled={loading || k === ''}
              onClick={() => {
                if (k === '⌫') { setPin(p => p.slice(0, -1)); return }
                if (k === '') return
                const next = (pin + k).slice(0, 4)
                setPin(next)
                if (next.length === 4) onSubmit(next)
              }}
              className={`h-12 rounded-xl text-lg font-semibold transition-colors
                ${k === '' ? 'invisible' : 'bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 active:bg-indigo-100 border border-gray-100'}
                ${k === '⌫' ? 'text-gray-500' : 'text-gray-800'}`}
            >
              {k}
            </button>
          ))}
        </div>

        {loading && <p className="text-xs text-gray-400 animate-pulse">Verifying…</p>}

        <button type="button" onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600">
          Cancel
        </button>
      </div>
    </Modal>
  )
}

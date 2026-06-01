const typeStyle = {
  data:        { bg: 'bg-blue-50   text-blue-600',   label: 'Data'        },
  airtime:     { bg: 'bg-green-50  text-green-600',  label: 'Airtime'     },
  electricity: { bg: 'bg-yellow-50 text-yellow-700', label: 'Electricity' },
  cable:       { bg: 'bg-purple-50 text-purple-600', label: 'Cable TV'    },
  wallet:      { bg: 'bg-emerald-50 text-emerald-600', label: 'Wallet'    },
}

export default function TxDetails({ tx }) {
  const { trans_Type, trans_plan, trans_Network, phone_number } = tx
  const style = typeStyle[trans_Type] || { bg: 'bg-gray-50 text-gray-500', label: trans_Type || 'Unknown' }

  return (
    <div className="space-y-1 min-w-[120px]">
      {/* Type + Network row */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize ${style.bg}`}>
          {style.label}
        </span>
        {trans_Network && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {trans_Network}
          </span>
        )}
      </div>

      {/* Plan name */}
      {trans_plan && (
        <p className="text-xs font-medium text-gray-800 leading-snug">{trans_plan}</p>
      )}

      {/* Phone / meter number */}
      {phone_number && (
        <p className="text-xs text-gray-400 font-mono">{phone_number}</p>
      )}
    </div>
  )
}

import Modal from './Modal'
import Badge from './Badge'
import { naira } from '../../services/api'

const statusVariant = {
  success: 'success',
  failed: 'danger',
  processing: 'warning',
  pending: 'warning',
  refunded: 'info',
}

function Row({ label, value, className = '' }) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 shrink-0 w-36">{label}</span>
      <span className={`text-sm font-medium text-right break-all ${className}`}>{value}</span>
    </div>
  )
}

export default function TransactionDetailModal({ tx, onClose, isAdmin = false, footer = null }) {
  if (!tx) return null

  const date = tx.trans_Date
    ? tx.trans_Date
    : tx.createdAt
      ? new Date(tx.createdAt).toLocaleString()
      : '—'

  const balBefore = tx.balance_Before != null ? naira(tx.balance_Before) : null
  const balAfter  = tx.balance_After  != null ? naira(tx.balance_After)  : null

  return (
    <Modal open={!!tx} onClose={onClose} title="Transaction Details" size="sm">
      <div>
        {/* Status badge at the top */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-gray-400 font-mono break-all">{tx.trans_Id}</span>
          <Badge variant={statusVariant[tx.trans_Status] || 'default'} className="capitalize shrink-0 ml-2">
            {tx.trans_Status}
          </Badge>
        </div>

        <div className="divide-y divide-gray-100">
          {isAdmin && <Row label="User"       value={tx.trans_UserName} />}
          <Row label="Type"         value={tx.trans_Type}    className="capitalize" />
          <Row label="Network"      value={tx.trans_Network} />
          <Row label="Phone / Ref"  value={tx.phone_number}  />
          <Row label="Amount"       value={naira(tx.trans_amount)} className="text-gray-900 font-bold" />
          {isAdmin && tx.trans_profit > 0 && (
            <Row label="Profit" value={`+${naira(tx.trans_profit)}`} className="text-green-600" />
          )}
          {balBefore && <Row label="Balance Before" value={balBefore} />}
          {balAfter  && <Row label="Balance After"  value={balAfter}  />}
          <Row label="Date"         value={date} />
          {isAdmin && tx.apiResponse && (
            <Row label="API Response" value={tx.apiResponse} className="text-gray-600 text-xs font-normal" />
          )}
          {isAdmin && tx.trans_supplier && (
            <Row label="Supplier" value={tx.trans_supplier} />
          )}
        </div>

        {footer && (
          <div className="mt-5 pt-4 border-t border-gray-100 flex justify-end">
            {footer}
          </div>
        )}
      </div>
    </Modal>
  )
}

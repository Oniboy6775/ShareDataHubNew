export default function Table({ children, className = '' }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm text-left">{children}</table>
    </div>
  )
}

Table.Head = function THead({ children }) {
  return (
    <thead className="bg-gray-50 text-xs uppercase text-gray-500 tracking-wider">
      {children}
    </thead>
  )
}

Table.Body = function TBody({ children }) {
  return <tbody className="divide-y divide-gray-100">{children}</tbody>
}

Table.Row = function TRow({ children, className = '', ...props }) {
  return (
    <tr className={`hover:bg-gray-50 transition-colors ${className}`} {...props}>
      {children}
    </tr>
  )
}

Table.Th = function Th({ children, className = '' }) {
  return <th className={`px-4 py-3 font-medium ${className}`}>{children}</th>
}

Table.Td = function Td({ children, className = '' }) {
  return <td className={`px-4 py-3 text-gray-700 ${className}`}>{children}</td>
}

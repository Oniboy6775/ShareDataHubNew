export default function Card({ children, className = '', ...props }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`} {...props}>
      {children}
    </div>
  )
}

Card.Header = function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-5 py-4 border-b border-gray-100 font-semibold text-gray-800 ${className}`}>
      {children}
    </div>
  )
}

Card.Body = function CardBody({ children, className = '' }) {
  return <div className={`p-5 ${className}`}>{children}</div>
}

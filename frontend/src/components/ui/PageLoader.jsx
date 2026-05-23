import Spinner from './Spinner'

export default function PageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-darker z-50">
      <Spinner size="lg" />
    </div>
  )
}

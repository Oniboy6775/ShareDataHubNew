import { useState } from 'react'
import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { purchaseService } from '../../services/purchase.service'
import { errMsg, naira } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import Modal from '../../components/ui/Modal'
import PhoneInput from '../../components/ui/PhoneInput'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import PinModal from '../../components/ui/PinModal'
import { Flame } from 'lucide-react'

const networks = [
  { name: 'MTN',     bg: '#FFCC00', color: '#1a1a1a', short: 'MTN', logo: '/networks/mtn.png'     },
  { name: 'GLO',     bg: '#007A00', color: '#ffffff', short: 'GLO', logo: '/networks/glo.png'     },
  { name: 'AIRTEL',  bg: '#EF1C25', color: '#ffffff', short: 'AIR', logo: '/networks/airtel.png'  },
  { name: '9MOBILE', bg: '#006B5E', color: '#ffffff', short: '9MO', logo: '/networks/9mobile.png' },
]


export default function BuyData() {
  const { user } = useAuth()
  const theme = useTheme()
  const [network, setNetwork] = useState('MTN')
  const [category, setCategory] = useState('all')
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [phone, setPhone] = useState('')
  const [contactName, setContactName] = useState('')
  const [pinOpen, setPinOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState(null)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['plans', network],
    queryFn: () => purchaseService.getPlans({ network }).then(r => r.data),
    staleTime: 0,
    refetchOnMount: true,
    placeholderData: keepPreviousData,
  })

  const allPlans = (data?.plans ?? []).filter(p => p.isAvailable !== false)

  const hasHot = allPlans.some(p => p.isHot)

  // derive unique categories from loaded plans; prepend 'hot' if any hot plans exist
  const categories = [
    'all',
    ...(hasHot ? ['hot'] : []),
    ...Array.from(new Set(allPlans.map(p => p.planCategory).filter(Boolean))),
  ]

  const plans = category === 'all'
    ? allPlans
    : category === 'hot'
      ? allPlans.filter(p => p.isHot)
      : allPlans.filter(p => p.planCategory === category)

  const { mutate, isPending } = useMutation({
    mutationFn: purchaseService.buyData,
    onSuccess: ({ data: d }) => {
      toast.success(d.msg || 'Data purchased successfully!')
      setSelectedPlan(null)
      setPhone('')
      setContactName('')
    },
    onError: (err) => toast.error(errMsg(err)),
  })

  const handleBuy = () => {
    if (!phone || phone.length < 10) return toast.error('Enter a valid phone number')
    const payload = { plan: selectedPlan.planId, mobile_number: phone, network }
    if (user?.pinEnabled) {
      setPendingPayload(payload)
      setPinOpen(true)
    } else {
      mutate(payload)
    }
  }

  return (
    <div>
      <h4 className="text-xl font-bold text-gray-900 underline uppercase mb-5">Purchase DATA</h4>

      <div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-6">

          {/* Network selector */}
          <div>
            <h6 className="text-center font-semibold text-gray-700 mb-4">Select Network</h6>
            <div className="flex gap-5 justify-center">
              {networks.map(n => (
                <button
                  key={n.name}
                  onClick={() => { setNetwork(n.name); setCategory('all') }}
                  className="flex flex-col items-center gap-2 focus:outline-none"
                >
                  <div
                    className="h-16 w-16 rounded-full overflow-hidden flex items-center justify-center transition-all duration-200"
                    style={{
                      background: n.bg,
                      opacity: network && network !== n.name ? 0.25 : 1,
                      transform: network === n.name ? 'scale(1.15)' : 'scale(1)',
                      boxShadow: network === n.name
                        ? `0 0 0 4px ${n.bg}55, 0 6px 16px ${n.bg}77`
                        : 'none',
                    }}
                  >
                    <img
                      src={n.logo}
                      alt={n.name}
                      className="h-full w-full object-contain p-1.5"
                      onError={e => {
                        e.target.style.display = 'none'
                        e.target.parentElement.innerHTML = `<span style="color:${n.color};font-weight:900;font-size:12px">${n.short}</span>`
                      }}
                    />
                  </div>
                  <span className={`text-xs font-semibold ${network === n.name ? 'text-gray-900' : 'text-gray-400'}`}>
                    {n.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Category pills — dynamically from loaded plans, colored by network */}
          {network && !isLoading && categories.length > 1 && (
            <div className="flex gap-2 flex-wrap justify-center">
              {categories.map(c => {
                const net = networks.find(n => n.name === network)
                const active = category === c
                return (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className="flex items-center gap-1 capitalize px-4 py-1.5 rounded-full border-2 text-sm font-semibold transition-all"
                    style={c === 'hot' ? (active ? {
                      borderColor: '#f97316',
                      background: '#fff7ed',
                      color: '#ea580c',
                    } : {
                      borderColor: '#fed7aa',
                      color: '#fb923c',
                    }) : (active ? {
                      borderColor: net?.bg,
                      background: `${net?.bg}22`,
                      color: net?.bg === '#FFCC00' ? '#7a6200' : net?.bg,
                    } : {
                      borderColor: '#e5e7eb',
                      color: '#6b7280',
                    })}
                  >
                    {c === 'hot' && <Flame size={13} />}
                    {c === 'hot' ? 'Hot' : c}
                  </button>
                )
              })}
            </div>
          )}

          {isLoading && plans.length === 0 && (
            <div className="flex justify-center py-10">
              <Spinner size="lg" />
            </div>
          )}

          {!isLoading && plans.length === 0 && (
            <p className="text-center text-gray-400 py-10 text-sm">
              No plans available for this selection.
            </p>
          )}

          {plans.length > 0 && (
            <div className={`transition-opacity duration-150 ${isFetching ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <h2 className="text-center font-bold text-lg text-gray-800 mb-4">Select a plan</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {plans.map(plan => {
                  const net = networks.find(n => n.name === network)
                  const headerBg = net ? `${net.bg}22` : '#f0f0f0'
                  const headerColor = net?.bg === '#FFCC00' ? '#7a6200' : (net?.bg || theme.colors.primary)
                  const footerBg = net?.bg || theme.colors.primary
                  const footerText = net?.color || '#fff'
                  return (
                    <div
                      key={plan.planId}
                      className="relative border-2 rounded-xl overflow-hidden text-center cursor-pointer hover:shadow-lg transition-all duration-150"
                      style={{ borderColor: `${footerBg}55` }}
                      onClick={() => setSelectedPlan(plan)}
                    >
                      {plan.isHot && (
                        <span className="absolute top-1.5 right-1.5 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 leading-none z-10">
                          <Flame size={9} />HOT
                        </span>
                      )}
                      <div className="px-2 py-1.5" style={{ background: headerBg }}>
                        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: headerColor }}>
                          {plan.planType}
                        </p>
                      </div>

                      <div className="px-3 py-3 space-y-1">
                        <p className="text-gray-800 font-semibold text-sm leading-tight">
                          {plan.planName}
                        </p>
                        <p className="font-bold text-base" style={{ color: headerColor }}>
                          {naira(plan.price ?? plan.sellingPrice)}
                        </p>
                      </div>

                      <div className="px-2 py-1" style={{ background: footerBg }}>
                        <p className="text-xs truncate" style={{ color: footerText }}>
                          {plan.planCategory || plan.planType}
                          {user?.userType === 'api user' && ` · id=${plan.planId}`}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <PinModal
        open={pinOpen}
        loading={isPending}
        onClose={() => { setPinOpen(false); setPendingPayload(null) }}
        onSubmit={(pin) => { setPinOpen(false); mutate({ ...pendingPayload, transactionPin: pin }) }}
      />

      {/* Confirmation modal */}
      <Modal
        open={!!selectedPlan}
        onClose={() => { setSelectedPlan(null); setContactName('') }}
        title="Confirm Purchase"
        size="sm"
      >
        {selectedPlan && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Network</span>
                <span className="font-semibold">{network}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Plan</span>
                <span className="font-semibold text-right max-w-[55%]">{selectedPlan.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className="font-semibold">{selectedPlan.planType}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="text-gray-600 font-medium">Amount</span>
                <span className="font-bold text-green-600 text-base">
                  {naira(selectedPlan.price ?? selectedPlan.sellingPrice)}
                </span>
              </div>
            </div>

            <PhoneInput
              label="Phone number"
              type="tel"
              placeholder="08012345678"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              contactName={contactName}
              onContactPick={({ number, name }) => {
                setPhone(number)
                setContactName(name)
              }}
              autoFocus
            />

            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setSelectedPlan(null)}>
                Cancel
              </Button>
              <Button className="flex-1" loading={isPending} onClick={handleBuy}>
                Buy Now
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

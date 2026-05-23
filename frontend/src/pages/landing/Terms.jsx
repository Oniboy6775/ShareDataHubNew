import LandingNav from '../../components/landing/LandingNav'
import LandingFooter from '../../components/landing/LandingFooter'
import { useTheme } from '../../context/ThemeContext'

export default function Terms() {
  const theme = useTheme()
  return (
    <div className="min-h-screen bg-white">
      <LandingNav />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Terms & Conditions</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: January 2025</p>

        <div className="space-y-8 text-gray-600 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using {theme.siteName} ("the Platform"), you agree to be bound by these Terms & Conditions and our Privacy Policy. If you do not agree to these terms, you must not use the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Eligibility</h2>
            <p>
              You must be at least 18 years of age and a resident of Nigeria to use the Platform. By registering, you confirm that all information you provide is accurate and complete.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Account Registration</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You must not share your account with any other person.</li>
              <li>You must notify us immediately of any unauthorized access to your account.</li>
              <li>We reserve the right to suspend or terminate accounts that violate these terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Wallet & Payments</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Your wallet balance represents prepaid credit for purchasing services on the Platform.</li>
              <li>Wallet funds are non-transferable to other users and cannot be withdrawn as cash.</li>
              <li>We are not responsible for delays caused by your bank when funding your wallet.</li>
              <li>Wallet credits from bank transfers are typically instant. Delays exceeding 30 minutes should be reported to support.</li>
              <li>We reserve the right to reverse any funding that is found to be fraudulent.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Purchases & Transactions</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>All transactions are final once successfully processed. Ensure all details (phone number, plan, amount) are correct before confirming.</li>
              <li>Failed transactions are automatically reversed to your wallet within minutes.</li>
              <li>We are not liable for losses arising from incorrect information provided by the user (e.g., wrong phone number).</li>
              <li>Transaction processing times are subject to third-party network availability.</li>
              <li>We reserve the right to delay or reject transactions that appear suspicious or fraudulent.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Service Availability</h2>
            <p>
              We strive for 99.9% uptime but do not guarantee uninterrupted access to the Platform. Scheduled maintenance, third-party network outages, or technical issues may cause temporary unavailability. We are not liable for losses arising from downtime.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Prohibited Conduct</h2>
            <p>You must not:</p>
            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li>Use the Platform for any illegal purpose</li>
              <li>Attempt to hack, exploit, or reverse-engineer the Platform</li>
              <li>Create multiple accounts to abuse registration bonuses or promotions</li>
              <li>Use bots or automated scripts to make purchases</li>
              <li>Engage in fraudulent funding or chargebacks</li>
              <li>Resell services at prices that violate our reseller agreement</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Reseller Accounts</h2>
            <p>
              Reseller accounts are granted at our discretion and subject to additional terms. We reserve the right to revoke reseller status and adjust pricing at any time. Resellers are responsible for their sub-customers' transactions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. Referral Programme</h2>
            <p>
              Commission earned through referrals is credited to your earnings balance. Earnings are subject to withdrawal conditions. We reserve the right to modify or discontinue the referral programme at any time. Fraudulent referral activity will result in account termination and forfeiture of all earnings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by Nigerian law, {theme.siteName} shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform. Our total liability shall not exceed the value of the transaction(s) in dispute.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">11. Intellectual Property</h2>
            <p>
              All content, trademarks, and software on the Platform are the property of {theme.siteName}. You may not copy, reproduce, or distribute any content without our prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">12. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall be resolved in Nigerian courts with appropriate jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">13. Changes to Terms</h2>
            <p>
              We reserve the right to update these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the revised Terms. We will make reasonable efforts to notify users of material changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">14. Contact</h2>
            <p>
              For questions or disputes, contact our support team via WhatsApp or through the support channels available on the Platform.
            </p>
          </section>
        </div>
      </div>
      <LandingFooter />
    </div>
  )
}

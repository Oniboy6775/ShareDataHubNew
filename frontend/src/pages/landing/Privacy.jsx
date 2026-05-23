import LandingNav from '../../components/landing/LandingNav'
import LandingFooter from '../../components/landing/LandingFooter'
import { useTheme } from '../../context/ThemeContext'

export default function Privacy() {
  const theme = useTheme()
  return (
    <div className="min-h-screen bg-white">
      <LandingNav />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: January 2025</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-600 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Introduction</h2>
            <p>
              {theme.siteName} ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform to purchase digital services such as data bundles, airtime, electricity tokens, and cable TV subscriptions.
            </p>
            <p className="mt-3">
              By using our platform, you consent to the data practices described in this policy. If you do not agree, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Information We Collect</h2>
            <p>We collect the following types of information:</p>
            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li><strong>Account Information:</strong> Your name, email address, phone number, and username provided at registration.</li>
              <li><strong>Transaction Data:</strong> Records of services purchased, amounts, phone numbers used, and transaction statuses.</li>
              <li><strong>Financial Information:</strong> Wallet funding history and payment references. We do not store card details.</li>
              <li><strong>Device & Usage Data:</strong> IP address, browser type, pages visited, and timestamps for security and analytics purposes.</li>
              <li><strong>Communication Data:</strong> Messages you send to our support team.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To create and manage your account</li>
              <li>To process transactions and deliver purchased services</li>
              <li>To credit your wallet and process refunds</li>
              <li>To send transaction confirmations and important account notices</li>
              <li>To prevent fraud and ensure platform security</li>
              <li>To improve our services and user experience</li>
              <li>To comply with applicable Nigerian laws and regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Sharing of Information</h2>
            <p>We do not sell, trade, or rent your personal information to third parties. We may share information only in the following circumstances:</p>
            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li><strong>Service Providers:</strong> We share necessary data with our telecom and utility partners to fulfil your purchases (e.g., phone number and plan ID for data delivery).</li>
              <li><strong>Payment Processors:</strong> We share transaction data with Monnify and other payment gateways to process wallet funding.</li>
              <li><strong>Legal Requirements:</strong> We may disclose information when required by law, court order, or government authority.</li>
              <li><strong>Business Transfers:</strong> In the event of a merger or acquisition, your data may be transferred as part of business assets.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Data Security</h2>
            <p>
              We implement industry-standard security measures including encrypted communications (HTTPS), bcrypt password hashing, JWT authentication, and access controls to protect your personal data. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Data Retention</h2>
            <p>
              We retain your personal data for as long as your account is active or as necessary to provide services. Transaction records are retained for a minimum of 90 days for dispute resolution. You may request deletion of your account and data at any time — see our <a href="/data-deletion" className="font-semibold underline" style={{ color: 'var(--color-primary)' }}>Data Deletion Request</a> page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Your Rights</h2>
            <p>Under Nigerian data protection regulations (NDPA 2023), you have the right to:</p>
            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Withdraw consent for data processing</li>
              <li>Lodge a complaint with the Nigeria Data Protection Commission (NDPC)</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, use our <a href="/data-deletion" className="font-semibold underline" style={{ color: 'var(--color-primary)' }}>Data Deletion Request</a> form or contact us via WhatsApp support.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Cookies</h2>
            <p>
              We use only essential cookies necessary for authentication and session management. We do not use tracking or advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. Third-Party Links</h2>
            <p>
              Our platform may contain links to third-party websites. We are not responsible for the privacy practices of those sites and encourage you to review their privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will notify you of significant changes by posting the new policy on this page and updating the "Last updated" date. Continued use of our platform after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">11. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us through the WhatsApp support button on our platform or via the contact information provided in your account dashboard.
            </p>
          </section>
        </div>
      </div>
      <LandingFooter />
    </div>
  )
}

import FadeIn from '../components/animations/FadeIn';
import { StaggerContainer, StaggerItem } from '../components/animations/StaggerContainer';
import Breadcrumbs from '../components/Breadcrumbs';

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <Breadcrumbs items={[
          { label: 'Home', path: '/' },
          { label: 'Returns & Refunds' }
        ]} />
      </div>

      {/* Hero Section */}
      <div className="bg-warm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <FadeIn direction="none">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-6 text-gray-900 tracking-tight">
              Returns & Refunds
            </h1>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="text-lg sm:text-xl text-center max-w-2xl mx-auto text-gray-600">
              We want you to love your Hafaloha gear. If something isn't right, we're here to help.
            </p>
          </FadeIn>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        {/* Return Window */}
        <FadeIn immediate>
          <div className="mb-16">
            <div className="rounded-lg p-8 bg-warm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-hafalohaRed" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">30-Day Return Window</h2>
                  <p className="text-gray-600">From the date you receive your order</p>
                </div>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed">
                We offer a <span className="font-semibold text-gray-900">30-day return policy</span> on all merchandise purchases.
                If you're not completely satisfied with your order, you may return eligible items within 30 days of delivery
                for a refund or exchange.
              </p>
            </div>
          </div>
        </FadeIn>

        {/* Conditions */}
        <div className="mb-16">
          <FadeIn immediate>
            <h2 className="text-2xl sm:text-3xl font-bold mb-12 text-gray-900 tracking-tight">Return Conditions</h2>
          </FadeIn>
          <StaggerContainer immediate className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Eligible */}
            <StaggerItem>
              <div className="rounded-lg p-8 border border-gray-200 h-full">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Eligible for Return
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2 text-gray-600">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Items in original, unworn condition</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-600">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Items with original tags attached</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-600">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Items in original packaging</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-600">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Defective or damaged items (with photos)</span>
                  </li>
                </ul>
              </div>
            </StaggerItem>

            {/* Not Eligible */}
            <StaggerItem>
              <div className="rounded-lg p-8 border border-gray-200 h-full">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Not Eligible
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2 text-gray-600">
                    <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Worn, washed, or altered items</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-600">
                    <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Items without original tags or packaging</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-600">
                    <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Sale or clearance items (final sale)</span>
                  </li>
                  <li className="flex items-start gap-2 text-gray-600">
                    <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Food items (açaí cakes, etc.)</span>
                  </li>
                </ul>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>

        {/* How to Return */}
        <FadeIn immediate>
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold mb-12 text-gray-900 tracking-tight">How to Initiate a Return</h2>
            <div className="space-y-6">
              {[
                {
                  step: '1',
                  title: 'Email us',
                  desc: 'Send an email to info@hafaloha.com with your order number, the item(s) you wish to return, and the reason for the return.',
                },
                {
                  step: '2',
                  title: 'Get approval',
                  desc: 'Our team will review your request and send you a return authorization along with shipping instructions within 1–2 business days.',
                },
                {
                  step: '3',
                  title: 'Ship it back',
                  desc: 'Pack the item(s) securely in original packaging and ship to the address provided. Return shipping costs are the buyer\'s responsibility unless the item is defective.',
                },
                {
                  step: '4',
                  title: 'Receive your refund',
                  desc: 'Once we receive and inspect the return, we\'ll process your refund within 5–10 business days to your original payment method.',
                },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Refund Timeline */}
        <FadeIn immediate>
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-gray-900 tracking-tight">Refund Processing</h2>
            <div className="rounded-lg p-8 bg-warm">
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                Refunds are processed to your <span className="font-semibold text-gray-900">original payment method</span> (credit card, debit card, etc.).
                Please allow 5–10 business days after we receive your return for the refund to appear on your statement.
              </p>
              <p className="text-gray-600">
                Note: Your bank or credit card company may take additional time to post the refund to your account.
                Shipping costs are non-refundable unless the return is due to our error.
              </p>
            </div>
          </div>
        </FadeIn>

        {/* Exchanges */}
        <FadeIn immediate>
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-gray-900 tracking-tight">Exchanges</h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                Need a different size or color? We're happy to help with exchanges! Simply email us at{' '}
                <a href="mailto:info@hafaloha.com" className="text-hafalohaRed hover:text-red-700 transition font-medium">
                  info@hafaloha.com
                </a>{' '}
                with your order number and the item you'd like instead.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Exchanges are subject to availability. If the requested item is out of stock, we'll issue a full refund instead.
              </p>
            </div>
          </div>
        </FadeIn>

        {/* CTA */}
        <FadeIn immediate>
          <div className="text-center py-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 tracking-tight">Need Help?</h2>
            <p className="mb-6 max-w-xl mx-auto text-gray-600">
              Our team is ready to assist with any return or exchange questions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="group inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition"
              >
                Contact Us
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
              <a
                href="mailto:info@hafaloha.com"
                className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Email info@hafaloha.com
              </a>
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

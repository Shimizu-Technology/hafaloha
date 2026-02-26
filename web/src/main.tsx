import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { PostHogProvider } from 'posthog-js/react'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_placeholder'

// PostHog configuration
const posthogOptions = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        <PostHogProvider 
          apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
          options={posthogOptions}
        >
          <App />
        </PostHogProvider>
      </ClerkProvider>
    </ErrorBoundary>
  </StrictMode>,
)

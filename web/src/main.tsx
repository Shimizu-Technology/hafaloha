import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { PostHogProvider } from 'posthog-js/react'
import './index.css'
import App from './App.tsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// Check if Clerk key is properly configured
const isClerkConfigured = PUBLISHABLE_KEY && !PUBLISHABLE_KEY.includes('YOUR_KEY_HERE')

// PostHog configuration
const posthogOptions = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isClerkConfigured ? (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        <PostHogProvider 
          apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
          options={posthogOptions}
        >
          <App />
        </PostHogProvider>
      </ClerkProvider>
    ) : (
      <PostHogProvider 
        apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
        options={posthogOptions}
      >
        <App />
      </PostHogProvider>
    )}
  </StrictMode>,
)

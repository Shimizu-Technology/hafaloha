import { useState, type ReactNode } from 'react';

interface AnnouncementBannerProps {
  text: string;
  style: string;
}

const STYLE_MAP: Record<string, { bg: string; text: string; border: string; closeHover: string }> = {
  gold: { bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-200', closeHover: 'hover:bg-amber-100' },
  red: { bg: 'bg-red-50', text: 'text-red-900', border: 'border-red-200', closeHover: 'hover:bg-red-100' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-200', closeHover: 'hover:bg-blue-100' },
  green: { bg: 'bg-green-50', text: 'text-green-900', border: 'border-green-200', closeHover: 'hover:bg-green-100' },
};

const ICON_MAP: Record<string, ReactNode> = {
  gold: (<svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>),
  red: (<svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>),
  blue: (<svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>),
  green: (<svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>),
};

export default function AnnouncementBanner({ text, style }: AnnouncementBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  const colors = STYLE_MAP[style] || STYLE_MAP.gold;
  const icon = ICON_MAP[style] || ICON_MAP.gold;

  return (
    <div className={`${colors.bg} ${colors.text} border-b ${colors.border}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-center gap-2 text-sm font-medium relative">
        {icon}
        <span>{text}</span>
        <button onClick={() => setDismissed(true)} className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded ${colors.closeHover} transition-colors`} aria-label="Dismiss announcement">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
}

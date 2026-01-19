import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export function useGoogleAnalytics() {
  const location = useLocation();

  useEffect(() => {
    // Initialize GA4 script if not already loaded
    if (GA_MEASUREMENT_ID && !document.getElementById('ga-script')) {
      const script = document.createElement('script');
      script.id = 'ga-script';
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag(...args: unknown[]) {
        window.dataLayer.push(args);
      };
      window.gtag('js', new Date());
      window.gtag('config', GA_MEASUREMENT_ID, {
        send_page_view: false, // We'll send manually on route change
      });
    }
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (GA_MEASUREMENT_ID && window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: location.pathname + location.search,
        page_title: document.title,
      });
    }
  }, [location]);
}

// Helper to track custom events
export function trackEvent(
  eventName: string,
  parameters?: Record<string, unknown>
) {
  if (GA_MEASUREMENT_ID && window.gtag) {
    window.gtag('event', eventName, parameters);
  }
}

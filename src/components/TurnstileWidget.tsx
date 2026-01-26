import { useEffect, useRef, useCallback } from 'react';

// Turnstile site key - using the invisible widget
// In production, replace with your actual site key
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'; // Test key for development

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileOptions) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      getResponse: (widgetId: string) => string | undefined;
    };
    onTurnstileLoad?: () => void;
  }
}

interface TurnstileOptions {
  sitekey: string;
  callback: (token: string) => void;
  'error-callback'?: (error: Error) => void;
  'expired-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'invisible';
  appearance?: 'always' | 'execute' | 'interaction-only';
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: (error: Error) => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'invisible';
}

export function TurnstileWidget({ 
  onVerify, 
  onError, 
  onExpire,
  theme = 'dark',
  size = 'invisible'
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const scriptLoadedRef = useRef(false);

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile || widgetIdRef.current) return;

    try {
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: onVerify,
        'error-callback': onError,
        'expired-callback': onExpire,
        theme,
        size,
        appearance: size === 'invisible' ? 'interaction-only' : 'always',
      });
    } catch (error) {
      console.error('[Turnstile] Failed to render widget:', error);
      onError?.(error as Error);
    }
  }, [onVerify, onError, onExpire, theme, size]);

  useEffect(() => {
    // If Turnstile is already loaded, render immediately
    if (window.turnstile) {
      renderWidget();
      return;
    }

    // Check if script is already in DOM
    if (document.querySelector('script[src*="turnstile"]')) {
      window.onTurnstileLoad = renderWidget;
      return;
    }

    // Load the Turnstile script
    if (!scriptLoadedRef.current) {
      scriptLoadedRef.current = true;
      
      window.onTurnstileLoad = renderWidget;
      
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    return () => {
      // Cleanup widget on unmount
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Widget may already be removed
        }
        widgetIdRef.current = null;
      }
    };
  }, [renderWidget]);

  // Reset function exposed for parent components
  const reset = useCallback(() => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, []);

  // Get current token
  const getToken = useCallback(() => {
    if (widgetIdRef.current && window.turnstile) {
      return window.turnstile.getResponse(widgetIdRef.current);
    }
    return undefined;
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={size === 'invisible' ? 'hidden' : 'flex justify-center my-4'}
      data-turnstile-widget
    />
  );
}

// Hook for easier integration
export function useTurnstile() {
  const tokenRef = useRef<string | null>(null);

  const handleVerify = useCallback((token: string) => {
    tokenRef.current = token;
  }, []);

  const handleExpire = useCallback(() => {
    tokenRef.current = null;
  }, []);

  const getToken = useCallback(() => tokenRef.current, []);

  return {
    token: tokenRef.current,
    handleVerify,
    handleExpire,
    getToken,
  };
}

import { useEffect, useState } from 'react';

interface BotDetectionResult {
  isBot: boolean;
  confidence: number;
  signals: string[];
}

export function useBotProtection(): BotDetectionResult {
  const [result, setResult] = useState<BotDetectionResult>({
    isBot: false,
    confidence: 0,
    signals: [],
  });

  useEffect(() => {
    const signals: string[] = [];
    let botScore = 0;

    // Check for common bot indicators
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Known bot user agents
    const botPatterns = [
      'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python',
      'java', 'perl', 'ruby', 'go-http', 'node-fetch', 'axios', 'headless',
      'phantomjs', 'selenium', 'puppeteer', 'playwright', 'ahrefs', 'semrush',
      'mj12bot', 'dotbot', 'blex', 'petal', 'bytespider', 'gptbot', 'ccbot',
      'claudebot', 'anthropic'
    ];
    
    for (const pattern of botPatterns) {
      if (userAgent.includes(pattern)) {
        signals.push(`bot_ua:${pattern}`);
        botScore += 30;
        break;
      }
    }

    // Check for missing browser features that real browsers have
    if (!(window as any).chrome && !navigator.userAgent.includes('Firefox') && !navigator.userAgent.includes('Safari')) {
      signals.push('missing_browser_object');
      botScore += 15;
    }

    // Check for webdriver (Selenium, Puppeteer, Playwright)
    if ((navigator as any).webdriver) {
      signals.push('webdriver_detected');
      botScore += 40;
    }

    // Check for automation tools
    if ((window as any).callPhantom || (window as any)._phantom) {
      signals.push('phantom_detected');
      botScore += 40;
    }

    // Check for headless Chrome
    if (/HeadlessChrome/.test(navigator.userAgent)) {
      signals.push('headless_chrome');
      botScore += 35;
    }

    // Check screen dimensions (bots often have unusual dimensions)
    if (window.screen.width === 0 || window.screen.height === 0) {
      signals.push('zero_screen_dimensions');
      botScore += 25;
    }

    // Check for plugins (most bots have none)
    if (navigator.plugins.length === 0 && !/mobile|android|iphone|ipad/i.test(userAgent)) {
      signals.push('no_plugins');
      botScore += 10;
    }

    // Check for languages
    if (!navigator.languages || navigator.languages.length === 0) {
      signals.push('no_languages');
      botScore += 15;
    }

    // Check for touch support inconsistency
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isMobileUA = /mobile|android|iphone|ipad/i.test(userAgent);
    if (isMobileUA && !hasTouchScreen) {
      signals.push('mobile_no_touch');
      botScore += 20;
    }

    // Check for DevTools automation
    if ((window as any).__selenium_unwrapped || (window as any).__driver_evaluate) {
      signals.push('selenium_automation');
      botScore += 40;
    }

    // Normalize confidence score to 0-100
    const confidence = Math.min(botScore, 100);
    
    setResult({
      isBot: confidence >= 50,
      confidence,
      signals,
    });

    // Log suspicious activity (only in development)
    if (confidence >= 30 && import.meta.env.DEV) {
      console.warn('[Bot Protection] Suspicious activity detected:', { confidence, signals });
    }
  }, []);

  return result;
}

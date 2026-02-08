import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { waitForServiceWorkerReady } from '@/lib/serviceWorker';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Detect iOS device
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// Detect if running as installed PWA
const isStandalone = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
};

// Cache for VAPID public key
let cachedVapidKey: string | null = null;

// Clear the VAPID key cache (useful when re-subscribing)
export function clearVapidKeyCache() {
  cachedVapidKey = null;
}

async function getVapidPublicKey(forceRefresh = false): Promise<string | null> {
  if (cachedVapidKey && !forceRefresh) return cachedVapidKey;
  
  try {
    const { data, error } = await supabase.functions.invoke('get-vapid-public-key');
    
    if (error) {
      console.error('Error fetching VAPID key:', error);
      return null;
    }
    
    if (data?.publicKey) {
      cachedVapidKey = data.publicKey;
      return cachedVapidKey;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching VAPID key:', error);
    return null;
  }
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);

  // Check if push notifications are supported
  useEffect(() => {
    const iosDevice = isIOS();
    const pwaInstalled = isStandalone();
    
    setIsIOSDevice(iosDevice);
    setIsPWAInstalled(pwaInstalled);
    
    // On iOS, push is only supported when installed as PWA
    const supported = 'serviceWorker' in navigator && 
      'PushManager' in window && 
      'Notification' in window;
    
    // iOS Safari doesn't support push unless installed as PWA
    const effectivelySupported = iosDevice ? (supported && pwaInstalled) : supported;
    
    setIsSupported(effectivelySupported);
    
    if (effectivelySupported) {
      setPermission(Notification.permission);
    }
    
    setIsLoading(false);
  }, []);

  // Check subscription status and clean stale entries
  const checkSubscription = useCallback(async () => {
    if (!isSupported || !user) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        // Verify it exists in our database
        const { data } = await supabase
          .from('push_subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .eq('endpoint', subscription.endpoint)
          .maybeSingle();
        
        setIsSubscribed(!!data);
      } else {
        setIsSubscribed(false);
      }

      // Clean stale subscriptions: remove DB entries for this user that don't match
      // the current browser's subscription endpoint
      const currentEndpoint = subscription?.endpoint;
      if (currentEndpoint) {
        // Keep only current device's subscription and subscriptions from other devices
        // We can't verify other devices, so we leave them
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setIsSubscribed(false);
    }
  }, [isSupported, user]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Register service worker
  const registerServiceWorker = async (): Promise<ServiceWorkerRegistration> => {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    
    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;
    return registration;
  };

  // Subscribe to push notifications
  const subscribe = async (): Promise<boolean> => {
    if (!isSupported || !user) {
      toast.error('Push notifications are not supported');
      return false;
    }

    setIsLoading(true);

    try {
      // Fetch VAPID public key from server (force refresh to ensure we have the latest key)
      const vapidPublicKey = await getVapidPublicKey(true);
      
      if (!vapidPublicKey) {
        toast.error('Push notifications not configured');
        setIsLoading(false);
        return false;
      }

      // Request permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        toast.error('Notification permission denied');
        setIsLoading(false);
        return false;
      }

      // Register service worker
      const registration = await registerServiceWorker();

      // Subscribe to push
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer
      });

      const subscriptionJson = subscription.toJSON();
      
      if (!subscriptionJson.endpoint || !subscriptionJson.keys) {
        throw new Error('Invalid subscription data');
      }

      // Save to database
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        endpoint: subscriptionJson.endpoint,
        p256dh: subscriptionJson.keys.p256dh,
        auth: subscriptionJson.keys.auth,
        platform: 'web',
        device_info: {
          userAgent: navigator.userAgent,
          language: navigator.language,
        }
      }, {
        onConflict: 'endpoint'
      });

      if (error) {
        console.error('Error saving subscription:', error);
        throw error;
      }

      setIsSubscribed(true);
      toast.success('Push notifications enabled!');
      return true;

    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to enable push notifications');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Unsubscribe from push notifications
  const unsubscribe = async (): Promise<boolean> => {
    if (!isSupported || !user) return false;

    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Remove from database first
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', subscription.endpoint);

        // Then unsubscribe from push
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      toast.success('Push notifications disabled');
      return true;

    } catch (error) {
      console.error('Unsubscribe error:', error);
      toast.error('Failed to disable push notifications');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle subscription
  const toggle = async (): Promise<boolean> => {
    return isSubscribed ? unsubscribe() : subscribe();
  };

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    isIOSDevice,
    isPWAInstalled,
    subscribe,
    unsubscribe,
    toggle,
    checkSubscription,
  };
}

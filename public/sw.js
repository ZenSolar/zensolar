// ZenSolar Push Notification Service Worker
// Version 2 - iOS Safari compatible

self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activated');
  event.waitUntil(clients.claim());
});

// Handle push notifications - iOS Safari compatible
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  // Default notification data
  let notificationData = {
    title: 'ZenSolar',
    body: 'You have a new notification',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'zensolar-notification',
    data: { url: '/' }
  };

  try {
    if (event.data) {
      const text = event.data.text();
      console.log('[SW] Push data text:', text);
      
      if (text) {
        const payload = JSON.parse(text);
        console.log('[SW] Push payload parsed:', JSON.stringify(payload));
        
        // Merge payload with defaults
        notificationData = {
          title: payload.title || notificationData.title,
          body: payload.body || notificationData.body,
          icon: payload.icon || notificationData.icon,
          badge: payload.badge || notificationData.badge,
          tag: payload.tag || notificationData.tag,
          data: payload.data || { url: payload.url || '/' }
        };
      }
    }
  } catch (e) {
    console.error('[SW] Error parsing push data:', e);
  }

  console.log('[SW] Showing notification:', notificationData.title);

  // iOS Safari requires minimal notification options
  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    data: notificationData.data,
    // iOS doesn't support actions well, so we remove them
    // Also remove vibrate as it's not supported on iOS
    requireInteraction: false // iOS ignores this anyway
  };

  // CRITICAL: Must use event.waitUntil with showNotification for iOS
  event.waitUntil((async () => {
    const receivedAt = Date.now();

    // Foreground fallback: notify any open app windows
    try {
      const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clientList) {
        client.postMessage({ type: 'PUSH_RECEIVED', payload: notificationData, receivedAt });
      }
    } catch (e) {
      console.error('[SW] Error posting message to clients:', e);
    }

    let shown = false;
    let showError;

    try {
      await self.registration.showNotification(notificationData.title, options);
      shown = true;
      console.log('[SW] Notification shown successfully');
    } catch (error) {
      showError = error?.name ? `${error.name}: ${error.message || ''}` : String(error);
      console.error('[SW] Error showing notification:', error);
    }

    // Persist last push diagnostics so we can inspect later from the app UI
    try {
      const cache = await caches.open('zensolar-push-diag');
      const record = {
        at: receivedAt,
        title: notificationData.title,
        body: notificationData.body,
        shown,
        error: showError,
        data: notificationData.data,
      };
      await cache.put('/__zensolar_last_push', new Response(JSON.stringify(record), {
        headers: { 'Content-Type': 'application/json' },
      }));

      const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clientList) {
        client.postMessage({ type: 'PUSH_DIAG', record });
      }
    } catch (e) {
      console.error('[SW] Error writing push diagnostics:', e);
    }
  })());
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();

  // Get URL from notification data
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Open new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed');
});

// Diagnostics: allow the app to ping the active service worker and confirm which script is running
self.addEventListener('message', async (event) => {
  try {
    if (event.data?.type !== 'PING') return;

    const payload = {
      type: 'PONG',
      swVersion: '2',
      scriptURL: self.location?.href,
      at: Date.now(),
    };

    // Reply to the sender if possible, otherwise broadcast
    if (event.source && 'postMessage' in event.source) {
      event.source.postMessage(payload);
      return;
    }

    const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clientList) {
      client.postMessage(payload);
    }
  } catch (e) {
    console.error('[SW] Error handling PING:', e);
  }
});

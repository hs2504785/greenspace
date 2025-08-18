"use client";

import { useEffect } from 'react';

/**
 * Global Service Worker Registration Component
 * Ensures the service worker is registered on every page load
 * This is essential for receiving push notifications even if users
 * haven't explicitly enabled notifications
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.log('🚫 Service Workers not supported');
      return;
    }

    const registerServiceWorker = async () => {
      try {
        // Check if already registered
        let registration = await navigator.serviceWorker.getRegistration('/');
        
        if (!registration) {
          // Register new service worker
          registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          });
          console.log('🔧 Service Worker registered globally:', registration.scope);
        } else {
          console.log('✅ Service Worker already registered:', registration.scope);
        }

        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        console.log('🚀 Service Worker is ready');

        // Add event listener for service worker updates
        registration.addEventListener('updatefound', () => {
          console.log('🔄 Service Worker update found');
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🔄 New service worker installed, refresh recommended');
                // Optionally, you can show a notification to refresh the page
              }
            });
          }
        });

        // Handle service worker controller change
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('🔄 Service Worker controller changed');
        });

        // Handle service worker messages
        navigator.serviceWorker.addEventListener('message', (event) => {
          console.log('📨 Message from Service Worker:', event.data);
        });

      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
      }
    };

    // Register service worker immediately
    registerServiceWorker();

    // Also register on page visibility change (when user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        registerServiceWorker();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // This component doesn't render anything
  return null;
}

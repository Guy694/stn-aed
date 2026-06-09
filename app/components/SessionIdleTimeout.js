'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { apiFetch } from '@/app/lib/client-api';

const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const ACTIVITY_PING_INTERVAL_MS = 30 * 1000;
const ACTIVITY_RECORD_INTERVAL_MS = 1000;
const ACTIVITY_TRAILING_PING_DELAY_MS = 5000;
const LAST_ACTIVITY_KEY = 'stn-aed:last-activity';
const SESSION_STARTED_EVENT = 'stn-aed:session-started';
const SESSION_ENDED_EVENT = 'stn-aed:session-ended';

const activityEvents = ['keydown', 'pointerdown', 'pointermove', 'scroll', 'touchstart'];

export default function SessionIdleTimeout() {
  const router = useRouter();
  const authenticatedRef = useRef(false);
  const logoutTimerRef = useRef(null);
  const trailingPingTimerRef = useRef(null);
  const lastActivityRef = useRef(0);
  const lastPingRef = useRef(0);
  const pingInFlightRef = useRef(false);
  const activityControllersRef = useRef(new Set());
  const trackingGenerationRef = useRef(0);

  useEffect(() => {
    const clearLogoutTimer = () => {
      if (logoutTimerRef.current) {
        window.clearTimeout(logoutTimerRef.current);
        logoutTimerRef.current = null;
      }
    };

    const clearTrailingPingTimer = () => {
      if (trailingPingTimerRef.current) {
        window.clearTimeout(trailingPingTimerRef.current);
        trailingPingTimerRef.current = null;
      }
    };

    const endSession = () => {
      trackingGenerationRef.current += 1;
      authenticatedRef.current = false;
      clearLogoutTimer();
      clearTrailingPingTimer();
      activityControllersRef.current.forEach((controller) => controller.abort());
      activityControllersRef.current.clear();
      localStorage.removeItem(LAST_ACTIVITY_KEY);
    };

    const logoutForInactivity = async () => {
      if (!authenticatedRef.current) return;

      endSession();
      await apiFetch('/api/auth/logout', { method: 'POST' });
      router.replace('/login?reason=idle');
      router.refresh();
    };

    const scheduleLogout = () => {
      clearLogoutTimer();
      if (!authenticatedRef.current) return;

      const remaining = IDLE_TIMEOUT_MS - (Date.now() - lastActivityRef.current);
      if (remaining <= 0) {
        void logoutForInactivity();
        return;
      }

      logoutTimerRef.current = window.setTimeout(logoutForInactivity, remaining);
    };

    const requestActivity = async () => {
      const controller = new AbortController();
      activityControllersRef.current.add(controller);

      try {
        return await apiFetch('/api/auth/activity', {
          method: 'POST',
          signal: controller.signal,
        });
      } finally {
        activityControllersRef.current.delete(controller);
      }
    };

    const pingActivity = async () => {
      if (!authenticatedRef.current || pingInFlightRef.current) return;

      pingInFlightRef.current = true;
      lastPingRef.current = Date.now();
      const response = await requestActivity();
      pingInFlightRef.current = false;

      if (response.status === 401) {
        await logoutForInactivity();
      }
    };

    const recordActivity = () => {
      if (!authenticatedRef.current) return;

      const now = Date.now();
      if (now - lastActivityRef.current < ACTIVITY_RECORD_INTERVAL_MS) return;

      lastActivityRef.current = now;
      localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
      scheduleLogout();

      if (now - lastPingRef.current >= ACTIVITY_PING_INTERVAL_MS) {
        void pingActivity();
      }

      clearTrailingPingTimer();
      trailingPingTimerRef.current = window.setTimeout(
        pingActivity,
        ACTIVITY_TRAILING_PING_DELAY_MS,
      );
    };

    const startSessionTracking = async () => {
      const trackingGeneration = trackingGenerationRef.current + 1;
      trackingGenerationRef.current = trackingGeneration;
      const response = await requestActivity();
      if (trackingGeneration !== trackingGenerationRef.current) return;

      if (!response.ok) {
        endSession();
        return;
      }

      const now = Date.now();
      authenticatedRef.current = true;
      lastActivityRef.current = now;
      lastPingRef.current = now;
      localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
      scheduleLogout();
    };

    const handleStorage = (event) => {
      if (event.key !== LAST_ACTIVITY_KEY || !event.newValue || !authenticatedRef.current) return;

      const sharedActivityAt = Number(event.newValue);
      if (!Number.isFinite(sharedActivityAt) || sharedActivityAt <= lastActivityRef.current) return;

      lastActivityRef.current = sharedActivityAt;
      scheduleLogout();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible' || !authenticatedRef.current) return;

      const sharedActivityAt = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
      if (Number.isFinite(sharedActivityAt) && sharedActivityAt > lastActivityRef.current) {
        lastActivityRef.current = sharedActivityAt;
      }

      if (Date.now() - lastActivityRef.current >= IDLE_TIMEOUT_MS) {
        void logoutForInactivity();
      } else {
        recordActivity();
      }
    };

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, recordActivity, { passive: true });
    });
    window.addEventListener('storage', handleStorage);
    window.addEventListener(SESSION_STARTED_EVENT, startSessionTracking);
    window.addEventListener(SESSION_ENDED_EVENT, endSession);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    void startSessionTracking();

    return () => {
      clearLogoutTimer();
      clearTrailingPingTimer();
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, recordActivity));
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(SESSION_STARTED_EVENT, startSessionTracking);
      window.removeEventListener(SESSION_ENDED_EVENT, endSession);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [router]);

  return null;
}

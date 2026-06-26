"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// Security configuration
const RATE_LIMIT_WINDOW_MS = 8000; // 8 seconds window
const MAX_REQUESTS_IN_WINDOW = 12; // max actions within window
const MIN_QUESTION_TIME_MS = 1000; // minimum time expected to read/answer a question

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
}

// Simple in-memory tracker for rate limiting
const actionTracker: Record<string, number[]> = {};

/**
 * Checks if an action is allowed under the rate limit rules.
 * @param actionKey Unique identifier for the action (e.g., "search", "quiz-answer")
 * @returns RateLimitResult with status and remaining slots
 */
export function evaluateRateLimit(actionKey: string): RateLimitResult {
  const now = Date.now();
  if (!actionTracker[actionKey]) {
    actionTracker[actionKey] = [];
  }

  // Filter out timestamps outside the active window
  actionTracker[actionKey] = actionTracker[actionKey].filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
  );

  const currentCount = actionTracker[actionKey].length;

  if (currentCount >= MAX_REQUESTS_IN_WINDOW) {
    const oldestTimestamp = actionTracker[actionKey][0];
    const resetMs = RATE_LIMIT_WINDOW_MS - (now - oldestTimestamp);
    return {
      allowed: false,
      remaining: 0,
      resetSeconds: Math.max(1, Math.ceil(resetMs / 1000)),
    };
  }

  // Record current request
  actionTracker[actionKey].push(now);

  return {
    allowed: true,
    remaining: MAX_REQUESTS_IN_WINDOW - actionTracker[actionKey].length,
    resetSeconds: 0,
  };
}

/**
 * React hook to assess client-side interactivity patterns and compute
 * a human-vs-bot confidence score based on real mouse, scroll, touch, and keyboard events.
 */
export function useBotDetection() {
  const [humanScore, setHumanScore] = useState<number>(15); // Starts with baseline 15% (not fully verified yet)
  const [isBotConfirmed, setIsBotConfirmed] = useState<boolean>(false);
  const [rateLimitStatus, setRateLimitStatus] = useState<Record<string, { blocked: boolean; resetSeconds: number }>>({});
  
  // Track unique interaction counters to prevent basic macro spams
  const interactionsRef = useRef({
    mouseMoves: 0,
    clicks: 0,
    scrolls: 0,
    keys: 0,
    touches: 0,
    startTime: 0,
  });

  // Calculate score based on event presence and natural delay
  const recalculateScore = useCallback(() => {
    const stats = interactionsRef.current;
    const now = Date.now();
    // Avoid division by zero if startTime is not yet set
    const ageSeconds = stats.startTime > 0 ? (now - stats.startTime) / 1000 : 0;

    let score = 15; // baseline

    // Bots might execute everything in less than 50ms, humans need some time
    if (ageSeconds > 0.4) score += 10;
    if (ageSeconds > 1.5) score += 10;

    // Mouse moves are a strong human indicator (automated scripts usually simulate clicks but not smooth mousemoves)
    if (stats.mouseMoves > 3) score += 20;
    if (stats.mouseMoves > 15) score += 15;

    // Scroll activity
    if (stats.scrolls > 0) score += 15;

    // Keystrokes or touches
    if (stats.keys > 0 || stats.touches > 0) score += 15;

    // Clamp score between 0 and 100
    const finalScore = Math.min(100, score);
    setHumanScore(finalScore);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    interactionsRef.current.startTime = Date.now();

    const handleMouseMove = () => {
      interactionsRef.current.mouseMoves += 1;
      if (interactionsRef.current.mouseMoves % 5 === 0) {
        recalculateScore();
      }
    };

    const handleScroll = () => {
      interactionsRef.current.scrolls += 1;
      recalculateScore();
    };

    const handleKeyDown = () => {
      interactionsRef.current.keys += 1;
      recalculateScore();
    };

    const handleTouchStart = () => {
      interactionsRef.current.touches += 1;
      recalculateScore();
    };

    // Listen to natural user interactions
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("keydown", handleKeyDown, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("touchstart", handleTouchStart);
    };
  }, [recalculateScore]);

  // Hook interface to trigger rate limits for custom operations
  const registerAction = useCallback((actionKey: string): boolean => {
    const result = evaluateRateLimit(actionKey);
    
    if (!result.allowed) {
      setRateLimitStatus((prev) => ({
        ...prev,
        [actionKey]: { blocked: true, resetSeconds: result.resetSeconds },
      }));

      // Automatically lift rate limit block after the countdown
      setTimeout(() => {
        setRateLimitStatus((prev) => {
          const next = { ...prev };
          delete next[actionKey];
          return next;
        });
      }, result.resetSeconds * 1000);

      return false;
    }
    return true;
  }, []);

  // Trigger honeypot failure
  const triggerHoneypotFlag = useCallback(() => {
    setIsBotConfirmed(true);
    setHumanScore(0);
  }, []);

  return {
    humanScore,
    isBotConfirmed,
    rateLimitStatus,
    registerAction,
    triggerHoneypotFlag,
  };
}

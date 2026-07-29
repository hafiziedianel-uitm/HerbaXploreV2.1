"use client";

import { Plant, plantsData } from "./data";

const CACHE_NAME = "herba-xplorer-cache-v1";
const METADATA_KEY = "herba-xplorer-plant-metadata";

/**
 * Check if the browser is currently offline
 */
export function isBrowserOffline(): boolean {
  if (typeof window === "undefined") return false;
  return !window.navigator.onLine;
}

/**
 * Precaches 3D models and offline assets for all compounds in the database
 */
export async function precacheAllAssets(
  onProgress?: (progress: number, currentItem: string) => void
): Promise<number> {
  if (typeof window === "undefined") return 0;
  
  // Cache the plant metadata first in localStorage
  cachePlantMetadata(plantsData);

  const targets: { name: string; url: string }[] = [];

  plantsData.forEach((plant) => {
    plant.parts.forEach((part) => {
      part.compounds.forEach((compound) => {
        if (compound.hide3D) return;
        if (compound.pdbId) {
          targets.push({
            name: `${compound.name} (3D Model)`,
            url: `https://files.rcsb.org/download/${compound.pdbId}.pdb`
          });
        } else {
          targets.push({
            name: `${compound.name} (3D Structure)`,
            url: `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(compound.name)}/SDF?record_type=3d`
          });
        }
        
        // Cache NMR shift api response
        targets.push({
          name: `${compound.name} (NMR Shifts)`,
          url: `/api/nmrshiftdb?compound=${encodeURIComponent(compound.name)}`
        });
      });
      
      // Cache publications response for plants
      targets.push({
        name: `${plant.name} Publications`,
        url: `/api/publications?plant=${encodeURIComponent(plant.name)}&compound=`
      });
    });
  });

  let completedCount = 0;
  
  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    if (onProgress) {
      onProgress(Math.round((i / targets.length) * 100), target.name);
    }
    
    try {
      await fetchWithCache(target.url);
      completedCount++;
    } catch (err) {
      console.warn(`Failed to precache ${target.name}:`, err);
    }
    
    // Tiny delay
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  if (onProgress) {
    onProgress(100, "Offline synchronization complete!");
  }

  return completedCount;
}

/**
 * Caches plant metadata in localStorage
 */
export function cachePlantMetadata(plants: Plant[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(METADATA_KEY, JSON.stringify(plants));
  } catch (err) {
    console.error("Failed to cache plant metadata to localStorage:", err);
  }
}

/**
 * Gets plant metadata from localStorage cache
 */
export function getCachedPlantMetadata(): Plant[] | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(METADATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Failed to retrieve cached plant metadata:", err);
    return null;
  }
}

/**
 * A highly resilient fetching helper that uses Cache Storage (with localStorage fallback)
 * to keep 3D models and APIs working offline.
 */
export async function fetchWithCache(url: string, options?: RequestInit): Promise<Response> {
  if (typeof window === "undefined") {
    return fetch(url, options);
  }

  const isCacheSupported = "caches" in window;
  
  // Try to use modern Cache Storage API if available
  if (isCacheSupported) {
    try {
      const cache = await window.caches.open(CACHE_NAME);
      
      // If offline, try to serve from cache immediately
      if (isBrowserOffline()) {
        const cachedResponse = await cache.match(url);
        if (cachedResponse) {
          console.log(`[Offline Cache] Serving from cache (offline mode): ${url}`);
          return cachedResponse;
        }
        throw new Error("Offline and resource not found in cache");
      }

      // If online, fetch from network first (to get latest), then cache
      try {
        const response = await fetch(url, options);
        if (response.ok && (options?.method === "GET" || !options?.method)) {
          // Clone response before putting into cache because response body can only be read once
          await cache.put(url, response.clone());
        }
        return response;
      } catch (networkError) {
        // Network request failed (e.g., DNS error, intermittent signal) - fallback to cache
        console.warn(`[Offline Cache] Network request failed. Attempting cache fallback for: ${url}`, networkError);
        const cachedResponse = await cache.match(url);
        if (cachedResponse) {
          console.log(`[Offline Cache] Success: Falling back to cached asset for ${url}`);
          return cachedResponse;
        }
        throw networkError; // Re-throw if not in cache
      }
    } catch (cacheErr) {
      console.error("[Offline Cache] Cache Storage error, falling back to network & localStorage:", cacheErr);
    }
  }

  // Fallback fallback: localStorage (for restricted iframe environments where caches is disabled)
  const localStorageCacheKey = `cache_url_${url}`;
  
  if (isBrowserOffline()) {
    const cachedData = localStorage.getItem(localStorageCacheKey);
    if (cachedData) {
      console.log(`[Offline Cache] Serving from localStorage fallback: ${url}`);
      return new Response(cachedData, {
        headers: { "Content-Type": url.includes("SDF") || url.includes("pdb") ? "text/plain" : "application/json" },
        status: 200,
        statusText: "OK",
      });
    }
  }

  // Online fallback or cache miss: normal fetch
  const response = await fetch(url, options);
  if (response.ok && (options?.method === "GET" || !options?.method)) {
    try {
      const text = await response.clone().text();
      // Only cache valid data responses (not HTML error pages) under 1.5MB
      const trimmed = text.trim();
      if (!trimmed.startsWith("<!DOCTYPE") && !trimmed.startsWith("<html")) {
        if (text.length < 1500000) {
          localStorage.setItem(localStorageCacheKey, text);
        }
      }
    } catch (e) {
      // Ignore quota errors silently
    }
  }
  return response;
}

/**
 * Detailed analysis of cached assets
 */
export interface CacheStats {
  pdbInCache: string[];
  sdfInCache: string[];
  apisInCache: string[];
  totalCached: number;
}

export async function getOfflineStats(): Promise<CacheStats> {
  const stats: CacheStats = {
    pdbInCache: [],
    sdfInCache: [],
    apisInCache: [],
    totalCached: 0
  };

  if (typeof window === "undefined") return stats;

  // 1. Scan caches API
  if ("caches" in window) {
    try {
      const cache = await window.caches.open(CACHE_NAME);
      const keys = await cache.keys();
      stats.totalCached = keys.length;

      keys.forEach((request) => {
        const url = request.url;
        if (url.endsWith(".pdb") || url.includes("/download/")) {
          const match = url.match(/([a-zA-Z0-9]{4})\.pdb/);
          stats.pdbInCache.push(match ? match[1].toUpperCase() : url);
        } else if (url.includes("SDF?record_type=3d")) {
          const match = url.match(/\/name\/([^/]+)\/SDF/);
          stats.sdfInCache.push(match ? decodeURIComponent(match[1]) : url);
        } else if (url.includes("/api/")) {
          const urlObj = new URL(url);
          stats.apisInCache.push(`${urlObj.pathname}${urlObj.search}`);
        }
      });
    } catch (err) {
      console.error("Failed to read cache keys:", err);
    }
  }

  // 2. Scan localStorage cache keys (excluding metadata and other stuff)
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("cache_url_")) {
        const url = key.replace("cache_url_", "");
        if (url.endsWith(".pdb") || url.includes("/download/")) {
          const match = url.match(/([a-zA-Z0-9]{4})\.pdb/);
          const val = match ? match[1].toUpperCase() : url;
          if (!stats.pdbInCache.includes(val)) stats.pdbInCache.push(val);
        } else if (url.includes("SDF?record_type=3d")) {
          const match = url.match(/\/name\/([^/]+)\/SDF/);
          const val = match ? decodeURIComponent(match[1]) : url;
          if (!stats.sdfInCache.includes(val)) stats.sdfInCache.push(val);
        } else if (url.includes("/api/")) {
          const urlObj = new URL(url);
          const val = `${urlObj.pathname}${urlObj.search}`;
          if (!stats.apisInCache.includes(val)) stats.apisInCache.push(val);
        }
      }
    }
  } catch (e) {
    // Ignore local storage errors
  }

  return stats;
}

/**
 * Clear cached data
 */
export async function clearOfflineCaches(): Promise<void> {
  if (typeof window === "undefined") return;

  // 1. Delete Service Worker caches
  if ("caches" in window) {
    try {
      await window.caches.delete(CACHE_NAME);
    } catch (err) {
      console.error("Failed to delete cache storage:", err);
    }
  }

  // 2. Delete localStorage cache keys
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("cache_url_") || key === METADATA_KEY)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch (e) {
    // Ignore
  }
}

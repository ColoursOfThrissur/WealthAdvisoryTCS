/**
 * Client Data Service
 * Business logic layer for client data operations
 * 
 * Production Features:
 * - In-memory caching with TTL
 * - Stale-while-revalidate pattern
 * - Cache invalidation
 * - Data transformation
 */

import apiClient from './apiClient';

class ClientDataService {
  constructor() {
    // In-memory cache
    this.cache = new Map();
    
    // Cache TTL (5 minutes)
    this.cacheTTL = 5 * 60 * 1000;
    
    // Stale time (30 seconds) - data is considered fresh for this duration
    this.staleTime = 30 * 1000;

    // In-flight lock per client — prevents concurrent full-analysis calls
    this.inFlight = new Map();
  }

  /**
   * Get cache key for client data
   */
  getCacheKey(clientId, type = 'full') {
    return `client_${clientId}_${type}`;
  }

  /**
   * Check if cached data is fresh
   */
  isFresh(cacheEntry) {
    if (!cacheEntry) return false;
    const age = Date.now() - cacheEntry.timestamp;
    return age < this.staleTime;
  }

  /**
   * Check if cached data is valid (not expired)
   */
  isValid(cacheEntry) {
    if (!cacheEntry) return false;
    const age = Date.now() - cacheEntry.timestamp;
    return age < this.cacheTTL;
  }

  /**
   * Get from cache
   */
  getFromCache(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (!this.isValid(entry)) {
      console.log(`[ClientDataService] Cache expired for ${key}`);
      this.cache.delete(key);
      return null;
    }
    
    const age = Date.now() - entry.timestamp;
    console.log(`[ClientDataService] Cache hit for ${key} (age: ${Math.floor(age / 1000)}s)`);
    return entry;
  }

  /**
   * Set cache
   */
  setCache(key, data) {
    console.log(`[ClientDataService] Caching data for ${key}`);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Invalidate cache for client
   */
  invalidateCache(clientId) {
    console.log(`[ClientDataService] Invalidating cache for client ${clientId}`);
    const keys = Array.from(this.cache.keys()).filter(key => key.includes(`client_${clientId}`));
    keys.forEach(key => this.cache.delete(key));
  }

  /**
   * Fetch full analysis for client
   * Uses stale-while-revalidate pattern
   */
  async getFullAnalysis(clientId, options = {}) {
    const {
      refresh = false,
      include_sentiment = true,
      include_fund_universe = true,
      user_prompt = ''
    } = options;

    const cacheKey = this.getCacheKey(clientId, 'full');

    // If refresh requested, invalidate cache
    if (refresh) {
      this.invalidateCache(clientId);
    }

    // Check cache
    const cached = this.getFromCache(cacheKey);
    
    // If fresh data exists, return immediately
    if (cached && this.isFresh(cached)) {
      console.log(`[ClientDataService] ⚡ Fresh cache hit for client ${clientId}`);
      return cached.data;
    }

    // If stale data exists, return it but revalidate in background only if not already in-flight
    if (cached && !refresh) {
      console.log(`[ClientDataService] 🔄 Stale cache - returning + revalidating for client ${clientId}`);
      
      const staleData = cached.data;
      const lockKey = `lock_${clientId}`;

      // Only revalidate if no call is already running
      if (!this.inFlight.has(lockKey)) {
        this.fetchAndCache(clientId, {
          include_sentiment,
          include_fund_universe,
          user_prompt,
          refresh: true
        }).catch(error => {
          console.error(`[ClientDataService] ❌ Background revalidation failed:`, error);
        });
      }
      
      return staleData;
    }

    // No cache or refresh requested - fetch fresh data
    console.log(`[ClientDataService] 🆕 Fetching fresh data for client ${clientId}`);
    return this.fetchAndCache(clientId, {
      include_sentiment,
      include_fund_universe,
      user_prompt,
      refresh
    });
  }

  /**
   * Fetch and cache full analysis — deduplicates concurrent calls per client
   * Uses direct fetch with long timeout (5 min) to bypass requestQueue's 30s limit
   */
  async fetchAndCache(clientId, options) {
    const lockKey = `lock_${clientId}`;

    // If already in-flight for this client, return the existing promise
    if (this.inFlight.has(lockKey)) {
      console.log(`[ClientDataService] 🔒 Deduplicating in-flight request for ${clientId}`);
      return this.inFlight.get(lockKey);
    }

    const { API_BASE_URL } = await import('../config/api.js');
    const url = `${API_BASE_URL}/api/client/${clientId}/full-analysis`;
    const body = JSON.stringify({
      include_sentiment: options.include_sentiment ?? true,
      include_fund_universe: options.include_fund_universe ?? true,
      user_prompt: options.user_prompt || '',
      refresh: options.refresh || false
    });

    const promise = fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: AbortSignal.timeout(360000) // 6 minute timeout
    })
    .then(async res => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      const cacheKey = this.getCacheKey(clientId, 'full');
      this.setCache(cacheKey, data);
      console.log(`[ClientDataService] ✅ Full analysis cached for ${clientId}`);
      return data;
    })
    .catch(error => {
      console.error(`[ClientDataService] Failed to fetch full analysis:`, error);
      throw error;
    })
    .finally(() => {
      this.inFlight.delete(lockKey);
    });

    this.inFlight.set(lockKey, promise);
    return promise;
  }

  /**
   * Try to slice a section from the full-analysis cache.
   * Returns { success: true, data } or { success: false }.
   */
  _sliceFromFull(clientId, section) {
    const fullEntry = this.getFromCache(this.getCacheKey(clientId, 'full'));
    if (!fullEntry) return { success: false };
    const section_data = fullEntry.data[section];
    if (!section_data) return { success: false };
    console.log(`[ClientDataService] ⚡ Sliced '${section}' from full-analysis cache for ${clientId}`);
    return { success: true, data: { success: true, _from_cache: true, data: section_data } };
  }

  /**
   * Get client detail
   */
  async getClientDetail(clientId, refresh = false) {
    if (!refresh) {
      const sliced = this._sliceFromFull(clientId, 'client_detail');
      if (sliced.success) return sliced.data;
    }

    const cacheKey = this.getCacheKey(clientId, 'detail');
    if (refresh) this.cache.delete(cacheKey);
    const cached = this.getFromCache(cacheKey);
    if (cached && this.isFresh(cached)) return cached.data;

    try {
      const data = await apiClient.get(`/api/client/${clientId}/detail`, { priority: 1, retryable: true });
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`[ClientDataService] Failed to fetch client detail:`, error);
      throw error;
    }
  }

  /**
   * Get risk analysis
   */
  async getRiskAnalysis(clientId, refresh = false) {
    if (!refresh) {
      const sliced = this._sliceFromFull(clientId, 'risk_analysis');
      if (sliced.success) return sliced.data;
    }

    const cacheKey = this.getCacheKey(clientId, 'risk');
    if (refresh) this.cache.delete(cacheKey);
    const cached = this.getFromCache(cacheKey);
    if (cached && this.isFresh(cached)) return cached.data;

    try {
      const data = await apiClient.get(`/api/client/${clientId}/risk-analysis`, { priority: 1, retryable: true });
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`[ClientDataService] Failed to fetch risk analysis:`, error);
      throw error;
    }
  }

  /**
   * Get investment details
   */
  async getInvestmentDetails(clientId, refresh = false) {
    if (!refresh) {
      const sliced = this._sliceFromFull(clientId, 'investment_details');
      if (sliced.success) return sliced.data;
    }

    const cacheKey = this.getCacheKey(clientId, 'investment');
    if (refresh) this.cache.delete(cacheKey);
    const cached = this.getFromCache(cacheKey);
    if (cached && this.isFresh(cached)) return cached.data;

    try {
      const data = await apiClient.get(`/api/client/${clientId}/investment-details`, { priority: 1, retryable: true });
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`[ClientDataService] Failed to fetch investment details:`, error);
      throw error;
    }
  }

  /**
   * Get rebalancing action
   */
  async getRebalancingAction(clientId, refresh = false) {
    if (!refresh) {
      const sliced = this._sliceFromFull(clientId, 'rebalancing_action');
      if (sliced.success) return sliced.data;
    }

    const cacheKey = this.getCacheKey(clientId, 'rebalancing');
    if (refresh) this.cache.delete(cacheKey);
    const cached = this.getFromCache(cacheKey);
    if (cached && this.isFresh(cached)) return cached.data;

    try {
      const data = await apiClient.get(`/api/action/rebalancing/${clientId}`, { priority: 1, retryable: true });
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`[ClientDataService] Failed to fetch rebalancing action:`, error);
      throw error;
    }
  }

  /**
   * Get worklist
   */
  async getWorklist(priority = 'all', search = '') {
    try {
      const params = new URLSearchParams();
      if (priority !== 'all') params.append('priority', priority);
      if (search) params.append('search', search);

      const endpoint = `/api/worklist/rebalancing${params.toString() ? '?' + params.toString() : ''}`;
      
      const data = await apiClient.get(endpoint, {
        priority: 2,
        retryable: true
      });

      return data;
    } catch (error) {
      console.error(`[ClientDataService] Failed to fetch worklist:`, error);
      throw error;
    }
  }

  /**
   * Clear cache for specific client
   */
  clearClientCache(clientId) {
    this.invalidateCache(clientId);
  }

  /**
   * Clear all cache
   */
  clearAllCache() {
    console.log(`[ClientDataService] Clearing all cache`);
    this.cache.clear();
  }

  /**
   * Get cache status
   */
  getCacheStatus() {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: Math.floor((Date.now() - entry.timestamp) / 1000),
      fresh: this.isFresh(entry),
      valid: this.isValid(entry)
    }));

    return {
      size: this.cache.size,
      entries
    };
  }
}

// Singleton instance
const clientDataService = new ClientDataService();

export default clientDataService;

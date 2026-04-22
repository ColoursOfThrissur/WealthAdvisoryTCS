/**
 * Layer 1: Request Deduplication Service
 * Prevents duplicate in-flight requests to the same endpoint
 * 
 * Production Features:
 * - Promise caching with automatic cleanup
 * - Request key generation
 * - Memory leak prevention
 */

class RequestManager {
  constructor() {
    // Map of request keys to in-flight promises
    this.inFlightRequests = new Map();
    
    // Map of request keys to timestamps (for debugging)
    this.requestTimestamps = new Map();
  }

  /**
   * Generate a unique key for a request
   * @param {string} url - Request URL
   * @param {object} options - Fetch options
   * @returns {string} Unique request key
   */
  generateKey(url, options = {}) {
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  /**
   * Execute a request with deduplication
   * If the same request is already in-flight, return the existing promise
   * 
   * @param {string} url - Request URL
   * @param {object} options - Fetch options
   * @param {Function} fetcher - Function that performs the actual fetch
   * @returns {Promise} Request promise
   */
  async dedupe(url, options, fetcher) {
    const key = this.generateKey(url, options);

    // If request is already in-flight, return existing promise
    if (this.inFlightRequests.has(key)) {
      console.log(`[RequestManager] 🔄 Deduplicating: ${key}`);
      return this.inFlightRequests.get(key);
    }

    // Create new request promise
    console.log(`[RequestManager] 🆕 New request: ${key}`);
    this.requestTimestamps.set(key, Date.now());

    const promise = fetcher()
      .then(result => {
        // Clean up after successful request
        this.cleanup(key);
        return result;
      })
      .catch(error => {
        // Clean up after failed request
        this.cleanup(key);
        throw error;
      });

    // Store in-flight promise
    this.inFlightRequests.set(key, promise);

    return promise;
  }

  /**
   * Clean up completed request
   * @param {string} key - Request key
   */
  cleanup(key) {
    const startTime = this.requestTimestamps.get(key);
    if (startTime) {
      const duration = Date.now() - startTime;
      console.log(`[RequestManager] ✅ Completed in ${duration}ms: ${key}`);
    }

    this.inFlightRequests.delete(key);
    this.requestTimestamps.delete(key);
  }

  /**
   * Cancel all in-flight requests (for cleanup on unmount)
   */
  cancelAll() {
    console.log(`[RequestManager] Cancelling ${this.inFlightRequests.size} in-flight requests`);
    this.inFlightRequests.clear();
    this.requestTimestamps.clear();
  }

  /**
   * Get status for debugging
   */
  getStatus() {
    return {
      inFlightCount: this.inFlightRequests.size,
      requests: Array.from(this.requestTimestamps.entries()).map(([key, timestamp]) => ({
        key,
        duration: Date.now() - timestamp
      }))
    };
  }
}

// Singleton instance
const requestManager = new RequestManager();

export default requestManager;

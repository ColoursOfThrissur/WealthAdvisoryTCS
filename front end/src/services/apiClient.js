/**
 * Enhanced API Client
 * Integrates request deduplication and queuing
 * 
 * Production Features:
 * - Request deduplication (Layer 1)
 * - Request queuing with retry (Layer 2)
 * - Comprehensive error handling
 * - Request/response logging
 * - AbortController support
 */

import { API_BASE_URL } from '../config/api';
import requestManager from './requestManager';
import requestQueue from './requestQueue';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    };
  }

  /**
   * Make an API request with full protection
   * @param {string} endpoint - API endpoint
   * @param {object} options - Request options
   * @returns {Promise} Response data
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const method = options.method || 'GET';
    const priority = options.priority || 0;
    const retryable = options.retryable !== false;

    // Merge headers
    const headers = {
      ...this.defaultHeaders,
      ...options.headers
    };

    // Build fetch options
    const fetchOptions = {
      method,
      headers,
      ...(options.body && { body: JSON.stringify(options.body) })
    };

    // Layer 1: Request Deduplication
    return requestManager.dedupe(url, fetchOptions, () => {
      // Layer 2: Request Queue with Retry
      return requestQueue.enqueue(
        async () => {
          console.log(`[ApiClient] 🚀 ${method} ${endpoint}`);
          const startTime = Date.now();

          try {
            const response = await fetch(url, fetchOptions);
            const duration = Date.now() - startTime;

            // Log response
            console.log(`[ApiClient] ${response.ok ? '✅' : '❌'} ${method} ${endpoint} - ${response.status} (${duration}ms)`);

            // Handle non-OK responses
            if (!response.ok) {
              const error = await this.handleErrorResponse(response);
              throw error;
            }

            // Parse JSON response
            const data = await response.json();
            return data;
          } catch (error) {
            const duration = Date.now() - startTime;
            console.error(`[ApiClient] ❌ ${method} ${endpoint} - ERROR (${duration}ms):`, error.message);
            throw error;
          }
        },
        { priority, retryable }
      );
    });
  }

  /**
   * Handle error response
   * @param {Response} response - Fetch response
   * @returns {Error} Enhanced error object
   */
  async handleErrorResponse(response) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let errorDetail = null;

    try {
      const data = await response.json();
      errorDetail = data.detail || data.message || data.error;
      if (errorDetail) {
        errorMessage = errorDetail;
      }
    } catch (e) {
      // Response is not JSON, use status text
    }

    const error = new Error(errorMessage);
    error.status = response.status;
    error.statusText = response.statusText;
    error.detail = errorDetail;
    error.response = response;

    return error;
  }

  /**
   * GET request
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  /**
   * PUT request
   */
  async put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  /**
   * DELETE request
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Get system status (for debugging)
   */
  getSystemStatus() {
    return {
      requestManager: requestManager.getStatus(),
      requestQueue: requestQueue.getStatus()
    };
  }

  /**
   * Clear all caches and queues (for cleanup)
   */
  clearAll() {
    requestManager.cancelAll();
    requestQueue.clear();
  }
}

// Singleton instance
const apiClient = new ApiClient();

export default apiClient;

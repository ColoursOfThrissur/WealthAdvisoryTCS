/**
 * Layer 2: Request Queue with Retry Logic
 * Serializes requests to prevent backend concurrency errors
 * 
 * Production Features:
 * - FIFO queue with priority support
 * - Exponential backoff retry
 * - Request timeout protection
 * - Queue overflow protection
 * - Detailed error tracking
 */

class RequestQueue {
  constructor(options = {}) {
    this.queue = [];
    this.processing = false;
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 1000; // 1 second
    this.maxDelay = options.maxDelay || 10000; // 10 seconds
    this.timeout = options.timeout || 30000; // 30 seconds
    this.maxQueueSize = options.maxQueueSize || 10;
    
    // Metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      retriedRequests: 0,
      queuedRequests: 0
    };
  }

  /**
   * Add request to queue
   * @param {Function} requestFn - Function that returns a promise
   * @param {object} options - Request options
   * @returns {Promise} Promise that resolves when request completes
   */
  async enqueue(requestFn, options = {}) {
    const priority = options.priority || 0;
    const retryable = options.retryable !== false;
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Check queue size
    if (this.queue.length >= this.maxQueueSize) {
      console.warn(`[RequestQueue] ⚠️ Queue full (${this.queue.length}/${this.maxQueueSize}), rejecting request`);
      this.metrics.failedRequests++;
      throw new Error('Too many requests in queue. Please wait and try again.');
    }

    return new Promise((resolve, reject) => {
      const queueItem = {
        id: requestId,
        requestFn,
        resolve,
        reject,
        priority,
        retryable,
        retryCount: 0,
        addedAt: Date.now()
      };

      // Add to queue (higher priority first)
      const insertIndex = this.queue.findIndex(item => item.priority < priority);
      if (insertIndex === -1) {
        this.queue.push(queueItem);
      } else {
        this.queue.splice(insertIndex, 0, queueItem);
      }

      this.metrics.totalRequests++;
      this.metrics.queuedRequests = this.queue.length;

      console.log(`[RequestQueue] 📥 Enqueued ${requestId} (priority: ${priority}, queue: ${this.queue.length})`);

      // Start processing if not already processing
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process queue sequentially
   */
  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      this.metrics.queuedRequests = this.queue.length;

      const waitTime = Date.now() - item.addedAt;
      console.log(`[RequestQueue] ⚙️ Processing ${item.id} (waited ${waitTime}ms, ${this.queue.length} remaining)`);

      try {
        const result = await this.executeWithRetry(item);
        item.resolve(result);
        this.metrics.successfulRequests++;
        console.log(`[RequestQueue] ✅ Success ${item.id}`);
      } catch (error) {
        console.error(`[RequestQueue] ❌ Failed ${item.id} after ${item.retryCount} retries:`, error.message);
        item.reject(error);
        this.metrics.failedRequests++;
      }
    }

    this.processing = false;
    console.log(`[RequestQueue] Queue empty, processing stopped`);
  }

  /**
   * Execute request with retry logic
   * @param {object} item - Queue item
   * @returns {Promise} Request result
   */
  async executeWithRetry(item) {
    let lastError;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        // Add timeout protection
        const result = await this.withTimeout(item.requestFn(), this.timeout);
        
        if (attempt > 0) {
          console.log(`[RequestQueue] Request ${item.id} succeeded on retry ${attempt}`);
          this.metrics.retriedRequests++;
        }
        
        return result;
      } catch (error) {
        lastError = error;
        item.retryCount = attempt + 1;

        // Check if error is retryable
        const isRetryable = this.isRetryableError(error);
        const shouldRetry = item.retryable && isRetryable && attempt < this.maxRetries;

        if (!shouldRetry) {
          console.error(`[RequestQueue] Request ${item.id} not retryable or max retries reached`);
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateBackoff(attempt);
        console.warn(`[RequestQueue] Request ${item.id} failed (attempt ${attempt + 1}/${this.maxRetries + 1}), retrying in ${delay}ms...`, error.message);

        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Check if error is retryable
   * @param {Error} error - Error object
   * @returns {boolean} True if retryable
   */
  isRetryableError(error) {
    // Retry on network errors
    if (error.name === 'TypeError' || error.message.includes('fetch')) {
      return true;
    }

    // Retry on 500 errors (backend concurrency issues)
    if (error.status >= 500 && error.status < 600) {
      return true;
    }

    // Retry on timeout
    if (error.name === 'TimeoutError') {
      return true;
    }

    // Retry on specific backend errors
    if (error.message && error.message.includes('ConcurrencyException')) {
      return true;
    }

    // Don't retry on 4xx errors (client errors)
    if (error.status >= 400 && error.status < 500) {
      return false;
    }

    return false;
  }

  /**
   * Calculate exponential backoff delay
   * @param {number} attempt - Attempt number
   * @returns {number} Delay in milliseconds
   */
  calculateBackoff(attempt) {
    // Exponential backoff: baseDelay * 2^attempt + random jitter
    const exponentialDelay = this.baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 1000; // 0-1000ms random jitter
    const delay = Math.min(exponentialDelay + jitter, this.maxDelay);
    return Math.floor(delay);
  }

  /**
   * Add timeout to promise
   * @param {Promise} promise - Promise to wrap
   * @param {number} ms - Timeout in milliseconds
   * @returns {Promise} Promise with timeout
   */
  withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        setTimeout(() => {
          const error = new Error(`Request timeout after ${ms}ms`);
          error.name = 'TimeoutError';
          reject(error);
        }, ms);
      })
    ]);
  }

  /**
   * Sleep utility
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} Promise that resolves after delay
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear queue (for cleanup)
   */
  clear() {
    console.log(`[RequestQueue] Clearing queue (${this.queue.length} items)`);
    this.queue.forEach(item => {
      item.reject(new Error('Queue cleared'));
    });
    this.queue = [];
    this.processing = false;
    this.metrics.queuedRequests = 0;
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      queueSize: this.queue.length,
      processing: this.processing,
      metrics: { ...this.metrics }
    };
  }
}

// Singleton instance with stricter limits
const requestQueue = new RequestQueue({
  maxRetries: 2,           // Reduced from 3
  baseDelay: 1000,
  maxDelay: 5000,          // Reduced from 10000
  timeout: 30000,
  maxQueueSize: 5          // Reduced from 10 to be more aggressive
});

export default requestQueue;

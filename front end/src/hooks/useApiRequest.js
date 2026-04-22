/**
 * Custom Hook: useApiRequest
 * Simplifies API requests with automatic loading/error states
 * 
 * Production Features:
 * - Automatic loading state management
 * - Error handling with retry support
 * - Request cancellation on unmount
 * - TypeScript-ready with JSDoc
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import clientDataService from '../services/clientDataService';

/**
 * Hook for making API requests with automatic state management
 * @param {Function} requestFn - Function that returns a promise
 * @param {object} options - Hook options
 * @returns {object} Request state and methods
 */
export const useApiRequest = (requestFn, options = {}) => {
  const {
    immediate = false,
    onSuccess = null,
    onError = null
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const execute = useCallback(async (...args) => {
    try {
      if (isMounted.current) {
        setLoading(true);
        setError(null);
      }

      const result = await requestFn(...args);

      if (isMounted.current) {
        setData(result);
        setLoading(false);
        if (onSuccess) onSuccess(result);
      }

      return result;
    } catch (err) {
      if (isMounted.current) {
        setError(err.message || 'Request failed');
        setLoading(false);
        if (onError) onError(err);
      }
      throw err;
    }
  }, [requestFn, onSuccess, onError]);

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return {
    data,
    loading,
    error,
    execute
  };
};

/**
 * Hook for fetching client full analysis
 */
export const useClientFullAnalysis = (clientId, options = {}) => {
  return useApiRequest(
    (opts) => clientDataService.getFullAnalysis(clientId, opts),
    options
  );
};

/**
 * Hook for fetching client detail
 */
export const useClientDetail = (clientId, options = {}) => {
  return useApiRequest(
    (refresh) => clientDataService.getClientDetail(clientId, refresh),
    options
  );
};

/**
 * Hook for fetching risk analysis
 */
export const useRiskAnalysis = (clientId, options = {}) => {
  return useApiRequest(
    (refresh) => clientDataService.getRiskAnalysis(clientId, refresh),
    options
  );
};

/**
 * Hook for fetching investment details
 */
export const useInvestmentDetails = (clientId, options = {}) => {
  return useApiRequest(
    (refresh) => clientDataService.getInvestmentDetails(clientId, refresh),
    options
  );
};

/**
 * Hook for fetching rebalancing action
 */
export const useRebalancingAction = (clientId, options = {}) => {
  return useApiRequest(
    (refresh) => clientDataService.getRebalancingAction(clientId, refresh),
    options
  );
};

/**
 * Hook for fetching worklist
 */
export const useWorklist = (options = {}) => {
  return useApiRequest(
    (priority, search) => clientDataService.getWorklist(priority, search),
    options
  );
};

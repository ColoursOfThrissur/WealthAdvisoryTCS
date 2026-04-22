/**
 * Layer 3: Enhanced Client Data Context
 * Single source of truth for client data across all components
 * 
 * Production Features:
 * - Centralized state management
 * - Automatic data sharing across components
 * - Loading and error states
 * - Cache invalidation support
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import clientDataService from '../services/clientDataService';

const ClientDataContext = createContext();

export const useClientData = () => {
  const context = useContext(ClientDataContext);
  if (!context) {
    throw new Error('useClientData must be used within ClientDataProvider');
  }
  return context;
};

export const ClientDataProvider = ({ clientId, children }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  
  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);

  /**
   * Fetch full analysis data
   */
  const fetchData = useCallback(async (options = {}) => {
    if (!clientId) return;

    try {
      setLoading(true);
      setError(null);

      console.log(`[ClientDataContext] Fetching data for client ${clientId}`, options);

      const result = await clientDataService.getFullAnalysis(clientId, options);

      if (isMounted.current) {
        setData(result);
        setLastFetch(Date.now());
        setError(null);
      }
    } catch (err) {
      console.error(`[ClientDataContext] Error fetching data:`, err);
      if (isMounted.current) {
        setError(err.message || 'Failed to fetch client data');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [clientId]);

  /**
   * Refresh data (bypass cache)
   */
  const refresh = useCallback(async (options = {}) => {
    console.log(`[ClientDataContext] Refreshing data for client ${clientId}`);
    return fetchData({ ...options, refresh: true });
  }, [clientId, fetchData]);

  /**
   * Invalidate cache and refetch
   */
  const invalidate = useCallback(() => {
    console.log(`[ClientDataContext] Invalidating cache for client ${clientId}`);
    clientDataService.clearClientCache(clientId);
    return fetchData({ refresh: true });
  }, [clientId, fetchData]);

  // Initial fetch on mount or clientId change
  useEffect(() => {
    isMounted.current = true;
    fetchData();

    return () => {
      isMounted.current = false;
    };
  }, [clientId, fetchData]);

  const value = {
    data,
    loading,
    error,
    lastFetch,
    refresh,
    invalidate,
    fetchData
  };

  return (
    <ClientDataContext.Provider value={value}>
      {children}
    </ClientDataContext.Provider>
  );
};

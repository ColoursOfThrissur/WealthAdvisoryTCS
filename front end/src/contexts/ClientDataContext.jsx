import React, { createContext, useContext, useState, useEffect } from 'react';
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

  useEffect(() => {
    const fetchFullAnalysis = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`[ClientDataContext] Fetching data for client ${clientId}`);
        
        // Use production-ready service with automatic deduplication and queuing
        const result = await clientDataService.getFullAnalysis(clientId, {
          refresh: false
        });
        
        setData(result);
      } catch (err) {
        console.error(`[ClientDataContext] Error:`, err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (clientId) {
      fetchFullAnalysis();
    }
  }, [clientId]);

  return (
    <ClientDataContext.Provider value={{ data, loading, error }}>
      {children}
    </ClientDataContext.Provider>
  );
};

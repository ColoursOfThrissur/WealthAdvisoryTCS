/**
 * Debug Panel - Monitor Request System
 * Shows real-time status of request manager, queue, and cache
 * 
 * Usage: Add <DebugPanel /> to your app during development
 */

import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import clientDataService from '../services/clientDataService';

const DebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      const systemStatus = apiClient.getSystemStatus();
      const cacheStatus = clientDataService.getCacheStatus();
      setStatus({ ...systemStatus, cache: cacheStatus });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '10px 20px',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          zIndex: 9999,
          fontWeight: 'bold',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}
      >
        🔍 Debug
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '400px',
      maxHeight: '600px',
      background: 'white',
      border: '2px solid #3b82f6',
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
      zIndex: 9999,
      overflow: 'hidden',
      fontFamily: 'monospace',
      fontSize: '12px'
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        background: '#3b82f6',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <strong>🔍 Request System Monitor</strong>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            fontSize: '18px'
          }}
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '16px', maxHeight: '540px', overflow: 'auto' }}>
        {status && (
          <>
            {/* Request Manager */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>
                📡 Request Manager
              </h4>
              <div style={{ background: '#f3f4f6', padding: '8px', borderRadius: '6px' }}>
                <div>In-Flight: <strong>{status.requestManager.inFlightCount}</strong></div>
                {status.requestManager.requests.map((req, i) => (
                  <div key={i} style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>
                    {req.key.substring(0, 50)}... ({req.duration}ms)
                  </div>
                ))}
              </div>
            </div>

            {/* Request Queue */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>
                📋 Request Queue
              </h4>
              <div style={{ background: '#f3f4f6', padding: '8px', borderRadius: '6px' }}>
                <div>Queue Size: <strong>{status.requestQueue.queueSize}</strong></div>
                <div>Processing: <strong>{status.requestQueue.processing ? '✅ Yes' : '❌ No'}</strong></div>
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #d1d5db' }}>
                  <div>Total: {status.requestQueue.metrics.totalRequests}</div>
                  <div style={{ color: '#10b981' }}>Success: {status.requestQueue.metrics.successfulRequests}</div>
                  <div style={{ color: '#ef4444' }}>Failed: {status.requestQueue.metrics.failedRequests}</div>
                  <div style={{ color: '#f59e0b' }}>Retried: {status.requestQueue.metrics.retriedRequests}</div>
                </div>
              </div>
            </div>

            {/* Cache */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>
                💾 Cache
              </h4>
              <div style={{ background: '#f3f4f6', padding: '8px', borderRadius: '6px' }}>
                <div>Entries: <strong>{status.cache.size}</strong></div>
                {status.cache.entries.map((entry, i) => (
                  <div key={i} style={{ fontSize: '10px', marginTop: '4px' }}>
                    <div style={{ color: '#1f2937' }}>{entry.key}</div>
                    <div style={{ color: '#6b7280' }}>
                      Age: {entry.age}s | 
                      {entry.fresh ? ' ⚡ Fresh' : entry.valid ? ' 🔄 Stale' : ' ❌ Expired'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  clientDataService.clearAllCache();
                  console.log('🗑️ Cache cleared');
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '11px'
                }}
              >
                Clear Cache
              </button>
              <button
                onClick={() => {
                  apiClient.clearAll();
                  console.log('🗑️ All cleared');
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '11px'
                }}
              >
                Clear All
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DebugPanel;

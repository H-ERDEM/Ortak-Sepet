/**
 * @file BildirimBaglami.jsx
 * @description Uygulama genelinde anlık görsel bildirimler (toast alerts - başarı, hata, uyarı, bilgi)
 * göstermek için kullanılan React Context API sağlayıcısı (ToastProvider) ve hook (useToast) yapısını barındırır.
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertOctagon, Info, AlertTriangle, X } from 'lucide-react';

const BildirimBaglami = createContext(null);

export const useToast = () => {
  const context = useContext(BildirimBaglami);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} color="#22c55e" />;
      case 'error':
        return <AlertOctagon size={18} color="#ef4444" />;
      case 'warning':
        return <AlertTriangle size={18} color="#f59e0b" />;
      case 'info':
      default:
        return <Info size={18} color="#3b82f6" />;
    }
  };

  const getStyle = (type) => {
    switch (type) {
      case 'success':
        return { borderLeft: '4px solid #22c55e', boxShadow: '0 8px 30px rgba(34, 197, 94, 0.15)' };
      case 'error':
        return { borderLeft: '4px solid #ef4444', boxShadow: '0 8px 30px rgba(239, 68, 68, 0.15)' };
      case 'warning':
        return { borderLeft: '4px solid #f59e0b', boxShadow: '0 8px 30px rgba(245, 158, 11, 0.15)' };
      case 'info':
      default:
        return { borderLeft: '4px solid #3b82f6', boxShadow: '0 8px 30px rgba(59, 130, 246, 0.15)' };
    }
  };

  return (
    <BildirimBaglami.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Portal Container */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        pointerEvents: 'none',
        maxWidth: '380px',
        width: '100%'
      }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 20px',
              backgroundColor: 'rgba(30, 41, 59, 0.85)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              color: '#f8fafc',
              fontSize: '0.92rem',
              fontWeight: '500',
              lineHeight: '1.4',
              animation: 'toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              position: 'relative',
              ...getStyle(toast.type)
            }}
          >
            {getIcon(toast.type)}
            <span style={{ flex: 1, marginRight: '16px' }}>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.color = '#f8fafc'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; }}
              onMouseOut={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes toastSlideIn {
          from {
            transform: translateX(100%) translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateX(0) translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </BildirimBaglami.Provider>
  );
};

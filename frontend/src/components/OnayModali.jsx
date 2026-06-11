/**
 * @file OnayModali.jsx
 * @description Proje genelinde kullanılan ve kritik işlemlerden (örn: sepetten ürün çıkarma, grup silme) önce
 * kullanıcının onayını almak için tasarlanmış global bir modal sağlayıcısı (ConfirmProvider) ve kancasıdır (useConfirm).
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';

const ConfirmContext = createContext(null);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};

export const ConfirmProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    resolveRef: null
  });

  const confirm = useCallback((message, title = 'Emin misiniz?') => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        resolveRef: resolve
      });
    });
  }, []);

  const handleClose = useCallback((value) => {
    if (modalState.resolveRef) {
      modalState.resolveRef(value);
    }
    setModalState({
      isOpen: false,
      title: '',
      message: '',
      resolveRef: null
    });
  }, [modalState]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {modalState.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000,
          animation: 'confirmFadeIn 0.2s ease-out'
        }}>
          <div style={{
            backgroundColor: 'rgba(30, 41, 59, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '28px',
            maxWidth: '440px',
            width: '90%',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
            animation: 'confirmScaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            color: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                borderRadius: '12px',
                padding: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f59e0b',
                flexShrink: 0
              }}>
                <AlertTriangle size={24} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <h3 style={{
                  margin: 0,
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  letterSpacing: '-0.02em',
                  color: '#f8fafc'
                }}>{modalState.title}</h3>
                <p style={{
                  margin: 0,
                  color: '#94a3b8',
                  fontSize: '0.95rem',
                  lineHeight: '1.5'
                }}>{modalState.message}</p>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '8px'
            }}>
              <button
                onClick={() => handleClose(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: 'transparent',
                  color: '#e2e8f0',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                İptal
              </button>
              <button
                onClick={() => handleClose(true)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#dc2626'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#ef4444'; }}
              >
                Onayla
              </button>
            </div>
          </div>
          <style>{`
            @keyframes confirmFadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes confirmScaleIn {
              from { transform: scale(0.95); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

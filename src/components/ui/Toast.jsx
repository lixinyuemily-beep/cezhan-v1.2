import React from 'react';

export function ToastProvider({ children, toast, theme }) {
  const C = theme;
  
  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {children}
      {toast?.visible && (
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 1000,
          minWidth: 160, padding: "14px 24px", borderRadius: 8, boxShadow: "0 4px 20px rgba(0,0,0,.15)",
          background: toast.type === 'success' ? C.success : toast.type === 'error' ? '#e74c3c' : C.accentPrimary,
          color: "#fff", fontSize: 14, fontWeight: 500, textAlign: "center",
          animation: "toastSlideUp 0.3s ease",
        }}>
          {toast.message}
        </div>
      )}
      <style>{`
        @keyframes toastSlideUp {
          from { opacity: 0; transform: translate(-50%, -30%); }
          to { opacity: 1; transform: translate(-50%, -50%); }
        }
      `}</style>
    </div>
  );
}

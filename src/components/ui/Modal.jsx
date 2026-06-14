import React from 'react';

export const Modal = ({ 
  children, 
  title, 
  onClose, 
  width = 400,
  showFooter = true,
  footer,
  C,
}) => {
  return (
    <div style={{
      position: "fixed", 
      inset: 0, 
      background: "rgba(0,0,0,.5)",
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      zIndex: 400,
    }}>
      <div style={{ 
        background: "#fff", 
        borderRadius: 12, 
        padding: 24, 
        width: width,
        maxHeight: "90vh",
        overflow: "auto",
      }}>
        {title && (
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
            {title}
          </h3>
        )}
        {children}
        {showFooter && (
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

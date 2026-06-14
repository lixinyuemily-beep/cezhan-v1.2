import React from 'react';

export const Card = ({ children, style = {}, highlighted = false, onClick, theme }) => {
  const C = theme || {
    aiGenerated: "#EEF4FB",
    bgSecondary: "#FFFFFF",
    accentPrimary: "#2B5F8E",
    border: "#E0DDD6",
  };
  
  return (
    <div 
      onClick={onClick}
      style={{
        background: highlighted ? C.aiGenerated : C.bgSecondary,
        borderRadius: 10, border: `1.5px solid`,
        borderColor: highlighted ? C.accentPrimary : C.border,
        overflow: "hidden", ...style,
      }}
    >{children}</div>
  );
};

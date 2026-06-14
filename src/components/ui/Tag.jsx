import React from 'react';

export const Tag = ({ label, color, textColor = "#fff", theme }) => {
  const defaultColor = theme?.accentPrimary || "#2B5F8E";
  
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: 4,
      fontSize: 11, fontWeight: 700, background: color || defaultColor, color: textColor,
    }}>{label}</span>
  );
};

import React from 'react';

export const Btn = ({ children, onClick, variant = "primary", disabled = false, small = false, theme, style }) => {
  const C = theme || {
    accentPrimary: "#2B5F8E",
    textSecondary: "#6B6B6B",
    border: "#E0DDD6",
    textPrimary: "#1C1C1E",
    stepInactive: "#D1CFC9",
  };
  
  const base = {
    padding: small ? "6px 14px" : "10px 24px",
    borderRadius: 6, border: "none", cursor: disabled ? "not-allowed" : "pointer",
    fontSize: small ? 12 : 14, fontFamily: "'Noto Sans SC', sans-serif",
    fontWeight: 700, transition: "opacity .15s",
    opacity: disabled ? 0.45 : 1,
  };
  const variants = {
    primary:  { background: C.accentPrimary,   color: "#fff" },
    ghost:    { background: "#fff",             color: C.textSecondary, border: `1px solid ${C.border}` },
    danger:   { background: "#FEE2E2",          color: "#B91C1C" },
    success:  { background: C.accentPrimary,    color: "#fff" },
    outline:  { background: "#fff",             color: C.textPrimary, border: `1px solid ${C.border}` },
    disabled: { background: C.stepInactive,     color: "#fff" },
  };
  return (
    <button style={{ ...base, ...(disabled ? variants.disabled : variants[variant]), ...style }}
      onClick={disabled ? undefined : onClick}>{children}</button>
  );
};

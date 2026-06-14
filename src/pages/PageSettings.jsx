import React from 'react';
import { Divider } from '../components/ui';

export const PageSettings = ({ 
  darkMode,
  setDarkMode,
  navigateTo,
  theme,
}) => {
  const C = theme;
  
  return (
    <main style={{ padding: "28px 36px", maxWidth: 800 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: C.textPrimary, fontFamily: "'Noto Serif SC', serif" }}>
        设置
      </h1>
      <p style={{ color: C.textSecondary, fontSize: 14, marginTop: 6, marginBottom: 24 }}>
        配置系统外观和行为
      </p>
      <Divider style={{ background: C.border }} />

      <div style={{ marginTop: 24 }}>
        <div style={{
          background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, color: C.textPrimary }}>深色模式</div>
              <div style={{ fontSize: 13, color: C.textSecondary }}>
                切换界面配色方案，适合在暗光环境下使用
              </div>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{
                width: 48, height: 28, borderRadius: 14, border: "none", cursor: "pointer",
                background: darkMode ? C.accentPrimary : "#e5e5e5",
                position: "relative", transition: "background 0.2s",
              }}
            >
              <div style={{
                width: 24, height: 24, borderRadius: 12, background: "#fff",
                position: "absolute", top: 2,
                left: darkMode ? 22 : 2,
                transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }} />
            </button>
          </div>
        </div>

        <div style={{
          background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20, marginTop: 16,
        }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: C.textPrimary }}>关于</div>
          <div style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.8 }}>
            <div>智能策展助手 v1.0.0</div>
            <div style={{ marginTop: 8 }}>基于 AI 的展览策划工具，帮助您快速生成策展大纲、分配展品、撰写展陈文本。</div>
          </div>
        </div>
      </div>
    </main>
  );
};

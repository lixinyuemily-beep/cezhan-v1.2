import React, { useState, useRef, useEffect } from 'react';
import { Btn, Divider, Tag, Modal } from '../components/ui';
import { api } from '../api/client';

const RefreshIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
  </svg>
);

const ToolbarBtn = ({ onClick, active, children, title, C }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    style={{
      padding: "4px 10px", border: "none", borderRadius: 4, cursor: "pointer",
      background: active ? C.accentPrimary : "transparent", color: active ? "#fff" : C.textSecondary,
      fontSize: 13, fontWeight: 600, marginRight: 4,
    }}
  >
    {children}
  </button>
);

const RichTextToolbar = ({ onFormat, editorRef, C }) => (
  <div style={{ display: "flex", gap: 4, marginBottom: 8, padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
    <ToolbarBtn onClick={() => onFormat('bold')} title="加粗" C={C}><strong>B</strong></ToolbarBtn>
    <ToolbarBtn onClick={() => onFormat('italic')} title="斜体" C={C}><em>I</em></ToolbarBtn>
    <ToolbarBtn onClick={() => onFormat('underline')} title="下划线" C={C}><u>U</u></ToolbarBtn>
    <span style={{ width: 1, background: C.border, margin: "0 8px" }} />
    <ToolbarBtn onClick={() => onFormat('h1')} title="标题1" C={C}>H1</ToolbarBtn>
    <ToolbarBtn onClick={() => onFormat('h2')} title="标题2" C={C}>H2</ToolbarBtn>
    <ToolbarBtn onClick={() => onFormat('h3')} title="标题3" C={C}>H3</ToolbarBtn>
    <span style={{ width: 1, background: C.border, margin: "0 8px" }} />
    <ToolbarBtn onClick={() => onFormat('ul')} title="无序列表" C={C}>•</ToolbarBtn>
    <ToolbarBtn onClick={() => onFormat('ol')} title="有序列表" C={C}>1.</ToolbarBtn>
    <ToolbarBtn onClick={() => onFormat('quote')} title="引用" C={C}>"</ToolbarBtn>
  </div>
);

export const PageStep4 = ({ 
  setPage,
  goNextStep,
  goPrevStep,
  textSections,
  setTextSections,
  keptExhibits,
  setKeptExhibits,
  currentProject,
  isGenerating,
  theme,
  units,
  setUnits,
  selectedNarrative,
  narrativeOptions,
}) => {
  const C = theme;
  const [editing, setEditing] = useState(null);
  const [regenerateModal, setRegenerateModal] = useState(null);
  const [regeneratingKey, setRegeneratingKey] = useState(null);
  const editorRef = useRef(null);

  useEffect(() => {
    if (currentProject) {
      if (currentProject.units && currentProject.units.length > 0 && (!units || units.length === 0)) {
        setUnits(currentProject.units);
      }
      if (currentProject.keptExhibits && Object.keys(currentProject.keptExhibits).length > 0 && (!keptExhibits || Object.keys(keptExhibits).length === 0)) {
        setKeptExhibits(currentProject.keptExhibits);
      }
      if (currentProject.textSections && currentProject.textSections.length > 0 && (!textSections || textSections.length === 0)) {
        setTextSections(currentProject.textSections);
      }
    }
  }, [currentProject]);

  const handleFormat = (command) => {
    if (command === 'h1') {
      document.execCommand('formatBlock', false, 'h1');
    } else if (command === 'h2') {
      document.execCommand('formatBlock', false, 'h2');
    } else if (command === 'h3') {
      document.execCommand('formatBlock', false, 'h3');
    } else if (command === 'ul') {
      document.execCommand('insertUnorderedList', false, null);
    } else if (command === 'ol') {
      document.execCommand('insertOrderedList', false, null);
    } else if (command === 'quote') {
      document.execCommand('formatBlock', false, 'blockquote');
    } else {
      document.execCommand(command, false, null);
    }
    editorRef.current?.focus();
  };

  const handleRegenerate = (sectionKey) => {
    setRegenerateModal({
      key: sectionKey,
      title: textSections.find(s => s.key === sectionKey)?.title || sectionKey
    });
  };

  const confirmRegenerate = async () => {
    if (!regenerateModal) return;
    
    const sectionKey = regenerateModal.key;
    setRegeneratingKey(sectionKey);
    setRegenerateModal(null);
    
    try {
      const narrative = narrativeOptions[selectedNarrative] || { title: '', desc: '' };
      const narrativeRhythm = currentProject?.llmParams?.narrative_rhythm || null;
      const regularUnits = (units || []).filter(u => u.tag !== '序章' && u.tag !== '尾声');
      const exhibitionTitle =
        currentProject?.exhibitionTitle ||
        currentProject?.llmParams?.exhibition_title ||
        currentProject?.title ||
        narrative?.title ||
        '展览';

      if (sectionKey === 'preface') {
        const response = await api.ai.generatePreface(
          exhibitionTitle,
          regularUnits.length,
          narrative,
          narrativeRhythm
        );

        setTextSections(textSections.map(s =>
          s.key === sectionKey
            ? { ...s, text: response.content || '<p>序言生成失败，请手动编辑</p>', edited: false }
            : s
        ));
        return;
      }

      if (sectionKey === 'epilogue') {
        const response = await api.ai.generateEpilogue(
          exhibitionTitle,
          regularUnits.length,
          narrative,
          narrativeRhythm
        );

        setTextSections(textSections.map(s =>
          s.key === sectionKey
            ? { ...s, text: response.content || '<p>尾声生成失败，请手动编辑</p>', edited: false }
            : s
        ));
        return;
      }

      const unit = regularUnits[Number(sectionKey)];
      const unitExhibits = keptExhibits?.[sectionKey] || [];
      const response = await api.ai.generateTextSection({
        unit: unit,
        exhibits: unitExhibits,
        narrative: narrative,
        narrative_rhythm: narrativeRhythm,
      });

      let content = response.content || '';
      let exhibitSummaries = [];
      let summary = '';

      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.intro) {
            content = `<p>${parsed.intro}</p>`;
          }
          if (parsed.exhibits && Array.isArray(parsed.exhibits)) {
            exhibitSummaries = parsed.exhibits;
          }
          if (parsed.summary) {
            summary = `<p>${parsed.summary}</p>`;
          }
        }
      } catch (e) {
        console.error('解析文本响应失败:', e);
      }

      setTextSections(textSections.map(s =>
        s.key === sectionKey
          ? { ...s, text: content + summary, exhibits: exhibitSummaries, edited: false }
          : s
      ));
    } catch (error) {
      console.error('重新生成文本失败:', error);
    } finally {
      setRegeneratingKey(null);
    }
  };

  return (
    <main style={{ padding: "28px 36px", maxWidth: 900 }}>
      {isGenerating && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(255,255,255,.9)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          zIndex: 300,
        }}>
          <div style={{ 
            width: 48, height: 48, border: `4px solid ${C.border}`, borderTopColor: C.accentPrimary,
            borderRadius: "50%", animation: "spin 1s linear infinite",
          }} />
          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
          <div style={{ marginTop: 20, fontSize: 15, color: C.textPrimary, fontWeight: 600 }}>
            AI 正在生成策展文本...
          </div>
          <div style={{ marginTop: 8, fontSize: 13, color: C.textSecondary }}>
            正在为每个单元生成文本内容
          </div>
        </div>
      )}
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.textPrimary, fontFamily: "'Noto Serif SC', serif" }}>
            Step 4：审核并编辑策展文本
          </h1>
          <p style={{ color: C.textSecondary, fontSize: 14, margin: "6px 0 0" }}>
            AI 已生成序言和各单元文本，请逐段审核
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, fontSize: 12, alignItems: "center" }}>
          <span style={{ background: C.aiGenerated, padding: "4px 10px", borderRadius: 4 }}>蓝色背景为AI生成原文</span>
          <span style={{ background: C.humanEdited, padding: "4px 10px", borderRadius: 4 }}>黄色背景为您已修改</span>
        </div>
      </div>

      <Divider style={{ margin: "20px 0" }} />

      {textSections.map((sec, i) => (
        <div key={sec.key} style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: C.textPrimary, fontFamily: "'Noto Serif SC', serif" }}>
                {sec.title}
              </h2>
              {sec.edited && <Tag label="[已修改]" color={C.humanEdited} textColor={C.accentSecondary} />}
            </div>
            <span 
              onClick={() => handleRegenerate(sec.key)}
              style={{ color: C.accentPrimary, cursor: "pointer", fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}
              disabled={regeneratingKey !== null}
            >
              <RefreshIcon /> 重新生成
            </span>
          </div>

          {editing === sec.key ? (
            <div style={{ border: `1.5px solid ${C.accentPrimary}`, borderRadius: 6, overflow: 'hidden' }}>
              <RichTextToolbar onFormat={handleFormat} editorRef={editorRef} C={C} />
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                dangerouslySetInnerHTML={{ __html: sec.text }}
                onBlur={e => {
                  setTextSections(textSections.map(s => s.key === sec.key ? { ...s, text: e.currentTarget.innerHTML, edited: true } : s));
                  setEditing(null);
                }}
                style={{
                  width: "100%", padding: "14px 16px", boxSizing: "border-box",
                  fontSize: 14, lineHeight: 1.8, minHeight: 120,
                  fontFamily: "'Noto Sans SC', sans-serif", resize: "vertical",
                  background: C.humanEdited, outline: 'none',
                }}
              />
            </div>
          ) : (
            <div
              onClick={() => setEditing(sec.key)}
              style={{
                padding: "14px 16px", borderRadius: 6, cursor: "text",
                background: sec.edited ? C.humanEdited : C.aiGenerated,
                fontSize: 14, lineHeight: 1.8, color: C.textPrimary,
                border: `1px solid ${sec.edited ? C.accentSecondary + "44" : C.accentPrimary + "22"}`,
              }}>
              {sec.text}
            </div>
          )}

          {sec.key !== 'preface' && sec.key !== 'epilogue' && (() => {
            const unitId = sec.key;
            const exhibitsForSection = keptExhibits?.[unitId] || [];
            const hasExhibits = exhibitsForSection.length > 0;
            return hasExhibits && (
              <div style={{ marginTop: 10, paddingLeft: 8 }}>
                <div style={{ fontSize: 12, color: C.textSecondary, fontWeight: 700, marginBottom: 4 }}>展品摘要：</div>
                <div style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.6 }}>
                  {exhibitsForSection.slice(0, 3).map((ex, idx) => (
                    <span key={idx}>· {ex.name} {ex.desc && `— ${ex.desc.slice(0, 20)}${ex.desc.length > 20 ? '...' : ''}`}{idx < Math.min(exhibitsForSection.length, 3) - 1 ? '；' : ''}</span>
                  ))}
                  {exhibitsForSection.length > 3 && <span> 等{exhibitsForSection.length}件展品</span>}
                </div>
              </div>
            );
          })()}
          <Divider />
        </div>
      ))}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
        <Btn variant="ghost" onClick={goPrevStep}>← 返回 Step3</Btn>
        <Btn onClick={goNextStep}>确认文本，生成完整大纲 →</Btn>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: C.warning }}>
        ⚠️ 确认后将进入完整大纲，请确保文本已审核完毕
      </div>

      {regenerateModal && (
        <Modal onClose={() => setRegenerateModal(null)}>
          <div style={{ padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: C.textPrimary }}>重新生成确认</h3>
            <p style={{ fontSize: 14, color: C.textSecondary, marginBottom: 20, lineHeight: 1.6 }}>
              确定要重新生成「{regenerateModal.title}」的策展文本吗？<br/>
              当前文本内容将被覆盖，无法恢复。
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Btn variant="ghost" onClick={() => setRegenerateModal(null)}>取消</Btn>
              <Btn onClick={confirmRegenerate}>确认重新生成</Btn>
            </div>
          </div>
        </Modal>
      )}

      {regeneratingKey && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(255,255,255,.9)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          zIndex: 350,
        }}>
          <div style={{ 
            width: 40, height: 40, border: `3px solid ${C.border}`, borderTopColor: C.accentPrimary,
            borderRadius: "50%", animation: "spin 1s linear infinite",
          }} />
          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
          <div style={{ marginTop: 16, fontSize: 14, color: C.textPrimary }}>
            正在重新生成...
          </div>
        </div>
      )}
    </main>
  );
};

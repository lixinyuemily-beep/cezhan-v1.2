import React, { useState, useEffect } from 'react';
import { Card, Btn, Divider } from '../components/ui';

export const PageStep5 = ({ 
  setPage,
  goPrevStep,
  warningVisible,
  setWarningVisible,
  showExport,
  setShowExport,
  completeProject,
  currentProject,
  theme,
  keptExhibits,
  setKeptExhibits,
  units,
  setUnits,
  textSections,
  setTextSections,
}) => {
  const C = theme;
  const [activeSection, setActiveSection] = useState('preface');
  const [selectedFormat, setSelectedFormat] = useState('Markdown');
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  useEffect(() => {
    if (currentProject) {
      if (currentProject.units && currentProject.units.length > 0 && (!units || units.length === 0)) {
        setUnits(currentProject.units);
      }
      if (currentProject.keptExhibits && Object.keys(currentProject.keptExhibits).length > 0) {
        setKeptExhibits(currentProject.keptExhibits);
      }
      if (currentProject.textSections && currentProject.textSections.length > 0 && (!textSections || textSections.length === 0)) {
        setTextSections(currentProject.textSections);
      }
    }
  }, [currentProject]);

  const narrative = currentProject?.narrative || {};
  const projectTitle = narrative?.title || currentProject?.title || '策展大纲';
  const allUnits = units || [];
  const unitsData = allUnits.filter(u => u.tag !== '序章' && u.tag !== '尾声');

  const resolveRegularUnit = (sectionId) => {
    const sectionIndex = Number(sectionId);
    if (!Number.isInteger(sectionIndex) || sectionIndex < 0) return null;
    return unitsData[sectionIndex] || null;
  };

  const resolveUnitExhibits = (sectionId) => {
    const unit = resolveRegularUnit(sectionId);
    const sectionIndex = Number(sectionId);
    const candidateKeys = [];

    if (sectionId !== undefined && sectionId !== null) {
      candidateKeys.push(String(sectionId));
    }
    if (unit?.id !== undefined && unit?.id !== null) {
      candidateKeys.push(String(unit.id));
    }
    if (Number.isInteger(sectionIndex)) {
      candidateKeys.push(String(sectionIndex));
      // 兼容历史项目里按原始单元顺序存储的 key（第一个正文单元可能是 "1"）
      candidateKeys.push(String(sectionIndex + 1));
    }

    const triedKeys = [...new Set(candidateKeys)];
    for (const key of triedKeys) {
      const exhibits = keptExhibits?.[key];
      if (Array.isArray(exhibits) && exhibits.length > 0) {
        return exhibits;
      }
    }

    return [];
  };

  const resolveTextSection = (sectionId) => {
    const unit = resolveRegularUnit(sectionId);
    const sectionIndex = Number(sectionId);
    const candidateKeys = [];

    if (sectionId !== undefined && sectionId !== null) {
      candidateKeys.push(String(sectionId));
    }
    if (unit?.id !== undefined && unit?.id !== null) {
      candidateKeys.push(String(unit.id));
    }
    if (Number.isInteger(sectionIndex)) {
      candidateKeys.push(String(sectionIndex));
      candidateKeys.push(String(sectionIndex + 1));
    }

    const triedKeys = [...new Set(candidateKeys)];
    return triedKeys
      .map((key) => textSections?.find((section) => String(section.key) === key))
      .find(Boolean) || null;
  };
  
  const outlineToc = [
    { id: 'preface', title: '序言', page: 1 },
    ...unitsData.map((u, i) => ({ id: String(i), title: u.tag ? `${u.tag}：${u.title}` : u.title, page: i + 2 })),
    { id: 'epilogue', title: '尾声', page: unitsData.length + 2 },
  ];

  const getSectionContent = (sectionId) => {
    if (sectionId === 'preface') {
      const prefaceSection = textSections?.find(s => s.key === 'preface');
      if (prefaceSection && prefaceSection.text) {
        return {
          title: '序言',
          content: prefaceSection.text,
          isAI: !prefaceSection.edited,
          exhibits: [],
        };
      }
      return {
        title: '序言',
        content: narrative?.preface?.content || currentProject?.narrative?.preface?.content || '',
        isAI: true,
        exhibits: [],
      };
    }
    if (sectionId === 'epilogue') {
      const epilogueSection = textSections?.find(s => s.key === 'epilogue');
      if (epilogueSection && epilogueSection.text) {
        return {
          title: '尾声',
          content: epilogueSection.text,
          isAI: !epilogueSection.edited,
          exhibits: [],
        };
      }
      return {
        title: '尾声',
        content: narrative?.epilogue?.content || currentProject?.narrative?.epilogue?.content || '',
        isAI: true,
        exhibits: [],
      };
    }
    const section = resolveTextSection(sectionId);
    if (section) {
      const exhibits = resolveUnitExhibits(sectionId);
      return {
        title: section.title,
        content: section.text || section.content || '',
        isAI: !section.edited,
        exhibits: exhibits,
      };
    }
    const fallbackUnit = resolveRegularUnit(sectionId);
    return {
      title: fallbackUnit?.title || '',
      content: '',
      isAI: false,
      exhibits: resolveUnitExhibits(sectionId),
    };
  };

  const currentSection = getSectionContent(activeSection);

  const handleComplete = () => {
    setShowCompleteModal(true);
  };

  const confirmComplete = () => {
    setShowCompleteModal(false);
    completeProject();
  };

  const convertHtmlToMarkdown = (html) => {
    let md = html
      .replace(/<h1>(.*?)<\/h1>/g, '# $1\n\n')
      .replace(/<h2>(.*?)<\/h2>/g, '## $1\n\n')
      .replace(/<h3>(.*?)<\/h3>/g, '### $1\n\n')
      .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
      .replace(/<b>(.*?)<\/b>/g, '**$1**')
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<i>(.*?)<\/i>/g, '*$1*')
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/&nbsp;/g, ' ')
      .trim();
    return md;
  };

  const generateFullOutline = () => {
    let fullContent = `# ${projectTitle}\n\n`;
    fullContent += '## 目录\n\n';
    outlineToc.forEach(item => {
      fullContent += `${item.page}. ${item.title}\n`;
    });
    fullContent += '\n---\n\n';

    const sections = [
      { id: 'preface', ...getSectionContent('preface') },
      ...unitsData.map((u, i) => ({ id: String(i), ...getSectionContent(String(i)) })),
      { id: 'epilogue', ...getSectionContent('epilogue') },
    ];

    sections.forEach(section => {
      fullContent += `## ${section.title}\n\n`;
      fullContent += convertHtmlToMarkdown(section.content);
      fullContent += '\n\n';

      if (section.exhibits && section.exhibits.length > 0) {
        fullContent += '### 展品列表\n\n';
        fullContent += '| ID | 名称 | 年代 | 材质 | 尺寸 | 推荐权重 | 来源 |\n';
        fullContent += '|---|---|---|---|---|---|---|\n';
        section.exhibits.forEach(ex => {
          fullContent += `| ${ex.id || '-'} | ${ex.name || '-'} | ${ex.era || '-'} | ${ex.mat || ex.material || '-'} | ${ex.sz || ex.size || '-'} | ${ex.stars || '-'} | ${ex.ctx || ex.source || '-'} |\n`;
        });
        fullContent += '\n';
      }
    });

    return fullContent;
  };

  const handleExportClick = () => {
    if (selectedFormat === 'Markdown') {
      downloadMarkdown();
    } else if (selectedFormat === 'PDF') {
      downloadPDF();
    } else if (selectedFormat === 'Word') {
      downloadWord();
    }
  };

  const convertMarkdownToHtml = (md) => {
    let html = md;
    
    html = html.replace(/\|(.+)\|\n\|[-|]+\|\n((?:\|.+\|\n?)+)/g, (match, header, body) => {
      const headers = header.split('|').filter(h => h.trim()).map(h => `<th>${h.trim()}</th>`).join('');
      const rows = body.trim().split('\n').map(row => {
        const cells = row.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('');
        return `<tr>${cells}</tr>`;
      }).join('');
      return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
    });
    
    html = html
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/---/g, '<hr>')
      .replace(/\n(?=<[^h])/g, '<br>')
      .replace(/\n(?=<h)/g, '');
    
    return html;
  };

  const downloadPDF = () => {
    const content = generateFullOutline();
    const htmlContent = convertMarkdownToHtml(content);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${projectTitle}</title>
          <style>
            body { font-family: 'Noto Serif SC', serif; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.8; }
            h1 { font-size: 24px; text-align: center; }
            h2 { font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 8px; margin-top: 24px; }
            h3 { font-size: 14px; margin-top: 16px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background: #f5f5f5; }
            hr { border: none; border-top: 1px solid #ccc; margin: 20px 0; }
          </style>
        </head>
        <body>${htmlContent}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    setShowExport(false);
  };

  const downloadWord = () => {
    const content = generateFullOutline();
    const blob = new Blob([content], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectTitle}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExport(false);
  };

  const handleExport = (format) => {
    setSelectedFormat(format);
  };

  const downloadMarkdown = () => {
    const content = generateFullOutline();
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectTitle}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExport(false);
  };

  return (
    <main style={{ padding: "28px 36px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: C.textPrimary, fontFamily: "'Noto Serif SC', serif" }}>
        Step 5：展览大纲生成
      </h1>
      <p style={{ color: C.textSecondary, fontSize: 14, margin: "6px 0 16px" }}>
        请完整审核后导出
      </p>

      {warningVisible && (
        <div style={{
          background: "#FFFBEB", border: `1px solid ${C.warning}`, borderLeft: `4px solid ${C.warning}`,
          borderRadius: 6, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: C.warning,
        }}>
          ⚠️ 这是最终导出前的人工审核环节。AI 生成内容已标注来源，建议您完整浏览后再导出。导出前请确认学术内容的准确性。
        </div>
      )}

      <div style={{ display: "flex", gap: 24 }}>
        <div style={{ width: 260, flexShrink: 0 }}>
          <Card style={{ padding: "12px 0" }}>
            <div style={{ padding: "0 16px 8px", fontWeight: 700, fontSize: 13, color: C.textSecondary }}>大纲目录</div>
            <Divider />
            <div style={{ padding: "8px 16px 4px", fontWeight: 700, fontSize: 12, color: C.textSecondary }}>{projectTitle}</div>
            {outlineToc.map((item) => (
              <div 
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                style={{
                  padding: "8px 16px", fontSize: 13, cursor: "pointer",
                  color: activeSection === item.id ? C.accentPrimary : C.textSecondary,
                  fontWeight: activeSection === item.id ? 600 : 400,
                  background: activeSection === item.id ? `${C.aiGenerated}88` : "transparent",
                  borderLeft: activeSection === item.id ? `3px solid ${C.accentPrimary}` : "3px solid transparent",
                }}
              >
                {item.title}
              </div>
            ))}
            <Divider />
            <div style={{ padding: "8px 16px" }}>
              <Btn small onClick={() => setShowExport(true)}>⬇ 导出 .md</Btn>
            </div>
          </Card>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 12, fontSize: 12, marginBottom: 16, justifyContent: "flex-end" }}>
            <span style={{ background: C.aiGenerated, padding: "3px 10px", borderRadius: 4 }}>蓝色背景为AI生成原文</span>
            <span style={{ background: C.humanEdited, padding: "3px 10px", borderRadius: 4 }}>黄色背景为您已修改</span>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 700, color: C.textPrimary, fontFamily: "'Noto Serif SC', serif", marginBottom: 16 }}>
            {projectTitle}
          </h1>
          <Divider />

          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.textPrimary, marginTop: 16, marginBottom: 12 }}>
            {currentSection.title}
          </h2>
          
          <div 
            dangerouslySetInnerHTML={{ __html: currentSection.content }}
            style={{ 
              background: currentSection.isAI ? C.aiGenerated : C.humanEdited, 
              borderRadius: 6, 
              padding: "14px 16px", 
              fontSize: 14, 
              lineHeight: 1.8, 
              color: C.textPrimary, 
              marginBottom: 20 
            }}
          />

          {(() => {
            const unitExhibits = resolveUnitExhibits(activeSection);
            
            return unitExhibits.length > 0 && (
            <>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary, marginBottom: 8 }}>展品列表</h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: C.bgPrimary }}>
                      {["名称", "年代", "材质", "尺寸"].map(h => (
                        <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: C.textSecondary, borderBottom: `1px solid ${C.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {unitExhibits.map((ex, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : C.bgPrimary }}>
                        <td style={{ padding: "8px 12px", borderBottom: `1px solid ${C.border}`, color: C.textPrimary, fontWeight: 600 }}>{ex.name || '-'}</td>
                        <td style={{ padding: "8px 12px", borderBottom: `1px solid ${C.border}`, color: C.textPrimary }}>{ex.era || '-'}</td>
                        <td style={{ padding: "8px 12px", borderBottom: `1px solid ${C.border}`, color: C.textPrimary }}>{ex.mat || ex.material || '-'}</td>
                        <td style={{ padding: "8px 12px", borderBottom: `1px solid ${C.border}`, color: C.textPrimary }}>{ex.sz || ex.size || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          );
          })()}
        </div>
      </div>

      {showExport && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.4)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200,
        }}>
          <div style={{ background: "#fff", borderRadius: 10, padding: 28, width: 380, boxShadow: "0 8px 32px rgba(0,0,0,.2)" }}>
            <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, color: C.textPrimary }}>导出策展大纲</h3>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.textSecondary, marginBottom: 8 }}>导出格式</div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                <input type="radio" name="format" checked={selectedFormat === 'Markdown'} onChange={() => handleExport('Markdown')} /> Markdown (.md)
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", marginTop: 6 }}>
                <input type="radio" name="format" checked={selectedFormat === 'Word'} onChange={() => handleExport('Word')} /> Word (.docx)
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", marginTop: 6 }}>
                <input type="radio" name="format" checked={selectedFormat === 'PDF'} onChange={() => handleExport('PDF')} /> PDF (.pdf)
              </label>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
              <Btn variant="ghost" onClick={() => setShowExport(false)}>取消</Btn>
              <Btn onClick={handleExportClick}>导出</Btn>
            </div>
          </div>
        </div>
      )}

      {showCompleteModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.4)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200,
        }}>
          <div style={{ background: "#fff", borderRadius: 10, padding: 28, width: 400, boxShadow: "0 8px 32px rgba(0,0,0,.2)" }}>
            <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 12, color: C.textPrimary }}>确认完成</h3>
            <p style={{ fontSize: 14, color: C.textSecondary, marginBottom: 20, lineHeight: 1.6 }}>
              确定要完成此策展项目吗？项目将移至已完成列表，您可以随时在"已完成项目"中查看。
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => setShowCompleteModal(false)}>取消</Btn>
              <Btn variant="success" onClick={confirmComplete}>确认完成</Btn>
            </div>
          </div>
        </div>
      )}

      <Divider style={{ margin: "24px 0" }} />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Btn variant="ghost" onClick={goPrevStep}>← 返回 Step4</Btn>
        <Btn variant="success" onClick={handleComplete}>✓ 完成</Btn>
      </div>
    </main>
  );
};

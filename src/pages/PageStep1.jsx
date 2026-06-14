import React, { useState } from 'react';
import { Card, Btn, Divider, Tag } from '../components/ui';
import { generateUnitStructure } from '../api/curationApi';
import { api } from '../api/client';

export const PageStep1 = ({ 
  navigateTo,
  goNextStep,
  goPrevStep,
  selectedNarrative,
  setSelectedNarrative,
  currentProject,
  setCurrentProject,
  setCurrentStep,
  setCurrentPage,
  projects,
  setProjects,
  units,
  setUnits,
  generateStep2Data,
  llmParams,
  theme,
}) => {
  const C = theme;
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customLogic, setCustomLogic] = useState('');

  const plans = currentProject?.narrativeOptions || [
    { label: "方案 A", title: "未生成方案",
      logic: "请先创建项目",
      units: "-", items: "-" },
  ];

  const handleSelectPlan = (index) => {
    setSelectedNarrative(index);
  };

  const handleConfirm = async () => {
    if (!currentProject || !currentProject.llmParams) {
      alert('请先创建项目');
      return;
    }

    const selectedPlan = currentProject.narrativeOptions?.[selectedNarrative];
    const projectTitle =
      currentProject?.llmParams?.exhibition_title ||
      currentProject?.exhibitionTitle ||
      selectedPlan?.title ||
      '未命名策展项目';

    if (currentProject.id) {
      try {
        await api.projects.update(currentProject.id, {
          title: projectTitle,
          selected_narrative: selectedNarrative,
          step: 2,
          narrative: selectedPlan,
          narrative_options: currentProject.narrativeOptions,
        });
      } catch (error) {
        console.error('更新项目失败:', error);
      }
    }

    setIsGenerating(true);

    try {
      const params = {
        selectedNarrative: selectedNarrative,
        narrativeOptions: currentProject.narrativeOptions,
        exhibits: currentProject.llmParams.exhibits,
        additional_intent: currentProject.llmParams.additional_intent,
        narrative_rhythm: currentProject.llmParams.narrative_rhythm,
        advanced_settings: currentProject.llmParams.advanced_settings,
      };

      const result = await generateUnitStructure(params);

      if (result.success) {
        const updatedProject = { 
          ...currentProject, 
          title: projectTitle,
          selectedNarrative,
          step: 2,
          units: result.data.units,
          textSections: result.data.textSections,
          exhibitRecommendations: result.data.exhibitRecommendations,
        };
        
        setCurrentProject(updatedProject);
        setProjects(projects.map(p => p.id === currentProject.id ? updatedProject : p));
        setUnits(result.data.units || []);
        
        setCurrentStep(2);
        setCurrentPage('step2');
      } else {
        alert(result.error || '生成失败，请重试');
      }
    } catch (error) {
      console.error('生成失败:', error);
      alert('生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCustomDirection = () => {
    setShowCustomModal(true);
  };

  const handleSaveCustom = () => {
    if (!customTitle.trim() || !customLogic.trim()) {
      alert('请填写完整的叙事方向');
      return;
    }

    const customPlan = {
      label: "自定义",
      title: customTitle,
      logic: customLogic,
    };

    const newNarrativeOptions = [...(currentProject?.narrativeOptions || []), customPlan];
    const customIndex = newNarrativeOptions.length - 1;

    const updatedProject = {
      ...currentProject,
      narrativeOptions: newNarrativeOptions,
      selectedNarrative: customIndex,
    };

    setCurrentProject(updatedProject);
    setProjects(projects.map(p => p.id === currentProject.id ? updatedProject : p));
    setSelectedNarrative(customIndex);
    setShowCustomModal(false);
    setCustomTitle('');
    setCustomLogic('');
  };

  const handleCustomCancel = () => {
    setShowCustomModal(false);
    setCustomTitle('');
    setCustomLogic('');
  };

  return (
    <main style={{ padding: "28px 36px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: C.textPrimary, fontFamily: "'Noto Serif SC', serif" }}>
        Step 1：选择叙事方向
      </h1>
      <p style={{ color: C.textSecondary, fontSize: 14, margin: "6px 0 24px" }}>
        AI 根据您的展品生成了 3 个叙事方向，请选择一个作为策展主线（也可修改后使用，或完全自定义）
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
        {plans.map((p, i) => (
          <Card key={i} highlighted={selectedNarrative === i} style={{ cursor: "pointer" }}
            onClick={() => handleSelectPlan(i)}>
            <div style={{ padding: 20, background: selectedNarrative === i ? C.aiGenerated : "transparent" }}>
              <div style={{ fontSize: 11, color: C.textSecondary, fontWeight: 700, marginBottom: 4 }}>{p.label}</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: C.textPrimary, marginBottom: 12, fontFamily: "'Noto Serif SC', serif" }}>
                {p.title}
              </div>
              <Divider />
              <div style={{ fontSize: 12, color: C.textSecondary, fontWeight: 700, marginBottom: 4 }}>核心逻辑：</div>
              <div style={{ fontSize: 13, color: C.textPrimary, marginBottom: 20, lineHeight: 1.7 }}>{p.logic}</div>
              <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 4 }}>预计单元数：{currentProject?.llmParams?.advanced_settings?.unitCount || 3} 个</div>
              <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 20 }}>涉及展品：{currentProject?.exhibitCount || 0} 件</div>
            </div>
          </Card>
        ))}
      </div>

      <button
        onClick={handleCustomDirection}
        style={{
          marginTop: 12, padding: "8px 16px", borderRadius: 6, border: `1px solid ${C.border}`,
          background: "transparent", color: C.accentPrimary, cursor: "pointer", fontSize: 13, fontWeight: 700,
        }}>
        + 自定义叙事方向
      </button>

      <Divider style={{ margin: "20px 0" }} />

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Btn variant="ghost" onClick={() => navigateTo("p0")}>← 返回</Btn>
        <Btn onClick={handleConfirm} disabled={isGenerating}>
          {isGenerating ? '正在生成单元结构...' : '确认方向，进入下一步 →'}
        </Btn>
      </div>

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
            AI 正在生成单元结构...
          </div>
          <div style={{ marginTop: 8, fontSize: 13, color: C.textSecondary }}>
            根据您选择的叙事方向，正在构建策展内容
          </div>
        </div>
      )}

      {showCustomModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.4)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200,
        }}>
          <div style={{ background: "#fff", borderRadius: 10, padding: 24, width: 480, boxShadow: "0 8px 32px rgba(0,0,0,.2)" }}>
            <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, color: C.textPrimary }}>
              自定义叙事方向
            </h3>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.textSecondary, marginBottom: 6 }}>
                展览题目
              </div>
              <input
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="例如：青铜之路：丝路文明的金属叙事"
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 6,
                  border: `1px solid ${C.border}`, fontSize: 14,
                  outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.textSecondary, marginBottom: 6 }}>
                核心逻辑
              </div>
              <textarea
                value={customLogic}
                onChange={(e) => setCustomLogic(e.target.value)}
                placeholder="描述展览的叙事逻辑和核心观点..."
                rows={4}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 6, resize: "vertical",
                  border: `1px solid ${C.border}`, fontSize: 13,
                  outline: "none", boxSizing: "border-box", fontFamily: "'Noto Sans SC', sans-serif",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={handleCustomCancel}>取消</Btn>
              <Btn onClick={handleSaveCustom}>保存</Btn>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

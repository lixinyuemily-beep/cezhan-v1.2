import React, { useState } from 'react';
import { STEPS } from '../constants/theme';
import { Card, Btn, Divider } from '../components/ui';
import { api } from '../api/client';

const RHYTHM_PRESET_LABELS = {
  steady: '平稳铺陈',
  rise: '渐进抬升',
  dramatic: '跌宕起伏',
  release: '先抑后扬',
  custom: '自定义节奏',
};

const RHYTHM_PREVIEW_WIDTH = 280;
const RHYTHM_PREVIEW_HEIGHT = 96;
const RHYTHM_PREVIEW_PADDING_X = 16;
const RHYTHM_PREVIEW_PADDING_Y = 14;
const RHYTHM_BASELINE = 50;

export const PageP0 = ({
  projects,
  completedProjects,
  navigateTo,
  openProject,
  createNewProject,
  setProjects,
  setCompletedProjects,
  showToast,
  refreshProjects,
  setCurrentStep,
  setCurrentPage,
  theme,
}) => {
  const C = theme;
  const [viewingProject, setViewingProject] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [loadingProject, setLoadingProject] = useState(null);

  const getCreativityLabel = (value) => {
    if (value == null || Number.isNaN(Number(value))) return '未记录';
    const temperature = Number(value);
    if (temperature < 0.5) return '保守';
    if (temperature > 0.8) return '创意';
    return '平衡';
  };

  const getRhythmPreviewPoints = (points = []) => {
    if (!points.length) return [];
    const plotWidth = RHYTHM_PREVIEW_WIDTH - RHYTHM_PREVIEW_PADDING_X * 2;
    const plotHeight = RHYTHM_PREVIEW_HEIGHT - RHYTHM_PREVIEW_PADDING_Y * 2;
    return points.map((value, index) => {
      const x = RHYTHM_PREVIEW_PADDING_X + (index / Math.max(points.length - 1, 1)) * plotWidth;
      const y = RHYTHM_PREVIEW_HEIGHT - RHYTHM_PREVIEW_PADDING_Y - (Number(value) / 100) * plotHeight;
      return { x, y };
    });
  };

  const renderSetupContent = (project) => {
    const llmParams = project?.llmParams || {};
    const advancedSettings = llmParams.advanced_settings || {};
    const temperature = advancedSettings.temperature;
    const hasTemperature = temperature != null && !Number.isNaN(Number(temperature));
    const creativityPercent = hasTemperature ? Math.round(((Number(temperature) - 0.1) / 0.9) * 100) : 0;
    const rhythm = llmParams.narrative_rhythm || null;
    const rhythmEnabled = rhythm?.enabled !== false;
    const rhythmPoints = Array.isArray(rhythm?.points) ? rhythm.points : [];
    const previewPoints = getRhythmPreviewPoints(rhythmPoints);
    const rhythmPath = previewPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
    const baselineY = RHYTHM_PREVIEW_HEIGHT - RHYTHM_PREVIEW_PADDING_Y - (RHYTHM_BASELINE / 100) * (RHYTHM_PREVIEW_HEIGHT - RHYTHM_PREVIEW_PADDING_Y * 2);
    const rhythmLabel = rhythm
      ? (rhythmEnabled ? (RHYTHM_PRESET_LABELS[rhythm.presetKey] || '自定义节奏') : '已关闭，AI 自主发挥')
      : '未记录';

    return (
      <div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.25fr)",
          gap: 14,
        }}>
          <div style={{
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 14,
            background: C.bgSecondary,
          }}>
            <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 6 }}>AI 创意程度</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: C.accentPrimary }}>
                {hasTemperature ? Number(temperature).toFixed(1) : '--'}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.accentSecondary }}>
                {getCreativityLabel(temperature)}
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: C.sliderTrack || C.border, overflow: "hidden" }}>
              <div style={{
                width: `${Math.min(Math.max(creativityPercent, 0), 100)}%`,
                height: "100%",
                borderRadius: 999,
                background: C.accentPrimary,
              }} />
            </div>
            <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 8 }}>
              影响 AI 生成时的发散程度，数值越高越偏创意表达。
            </div>
          </div>

          <div style={{
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 14,
            background: C.bgSecondary,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 4 }}>叙事节奏</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: rhythmEnabled ? C.textPrimary : C.textSecondary }}>
                  {rhythmLabel}
                </div>
              </div>
              <span style={{
                alignSelf: "flex-start",
                border: `1px solid ${rhythmEnabled ? C.accentPrimary : C.border}`,
                borderRadius: 999,
                padding: "3px 8px",
                color: rhythmEnabled ? C.accentPrimary : C.textSecondary,
                fontSize: 11,
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}>
                {rhythm ? (rhythmEnabled ? '已启用' : '已关闭') : '未记录'}
              </span>
            </div>

            {previewPoints.length > 0 ? (
              <svg
                width="100%"
                viewBox={`0 0 ${RHYTHM_PREVIEW_WIDTH} ${RHYTHM_PREVIEW_HEIGHT}`}
                role="img"
                aria-label="叙事节奏预览"
                style={{ display: "block", marginTop: 4 }}
              >
                <line
                  x1={RHYTHM_PREVIEW_PADDING_X}
                  x2={RHYTHM_PREVIEW_WIDTH - RHYTHM_PREVIEW_PADDING_X}
                  y1={baselineY}
                  y2={baselineY}
                  stroke={C.accentSecondary}
                  strokeDasharray="6 5"
                  strokeWidth="1.5"
                  opacity={rhythmEnabled ? 0.75 : 0.4}
                />
                <text
                  x={RHYTHM_PREVIEW_WIDTH - RHYTHM_PREVIEW_PADDING_X - 2}
                  y={baselineY - 5}
                  textAnchor="end"
                  style={{ fontSize: 9, fill: C.accentSecondary, fontWeight: 700 }}
                >
                  基线 50
                </text>
                <path
                  d={rhythmPath}
                  fill="none"
                  stroke={rhythmEnabled ? C.accentPrimary : C.textSecondary}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={rhythmEnabled ? 1 : 0.45}
                />
                {previewPoints.map((point, index) => (
                  <circle
                    key={`${point.x}-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r="3.5"
                    fill="#fff"
                    stroke={rhythmEnabled ? C.accentPrimary : C.textSecondary}
                    strokeWidth="2"
                    opacity={rhythmEnabled ? 1 : 0.55}
                  />
                ))}
              </svg>
            ) : (
              <div style={{ fontSize: 12, color: C.textPlaceholder, padding: "18px 0" }}>
                暂无叙事节奏记录
              </div>
            )}

            <div style={{ fontSize: 11, color: C.textSecondary, lineHeight: 1.6, marginTop: 6 }}>
              {rhythm?.summary || (rhythmEnabled ? '用于控制叙事方案、单元结构和文案语气。' : '关闭后生成不受节奏曲线约束。')}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleContinueEdit = async (project) => {
    setLoadingProject(project.id);
    try {
      let enrichedProject = null;
      
      let fullProject = null;
      try {
        fullProject = await api.projects.get(project.id);
      } catch (e) {
        // 项目可能已完成
      }
      
      if (fullProject) {
        enrichedProject = {
          ...project,
          _fromApi: true,
          step: fullProject.step || project.step,
          narrative: fullProject.narrative,
          narrativeOptions: fullProject.narrative_options,
          selectedNarrative: fullProject.selected_narrative,
          llmParams: fullProject.llm_params,
          exhibitionTitle: fullProject.exhibition_title,
          uploadedExhibits: fullProject.uploaded_exhibits,
          units: fullProject.units,
          keptExhibits: fullProject.kept_exhibits,
          textSections: fullProject.text_sections,
          exhibitConfirmations: fullProject.exhibit_confirmations,
        };
      } else {
        const completedProject = await api.projects.getCompleted(project.id);
        if (completedProject) {
          enrichedProject = {
            ...project,
            step: 5,
            narrative: completedProject.narrative,
            narrativeOptions: completedProject.narrative_options,
            selectedNarrative: completedProject.selected_narrative,
            llmParams: completedProject.llm_params,
            exhibitionTitle: completedProject.exhibition_title,
            uploadedExhibits: completedProject.uploaded_exhibits,
            units: completedProject.units,
            keptExhibits: completedProject.kept_exhibits,
            textSections: completedProject.text_sections,
          };
        }
      }
      
      if (enrichedProject) {
        if (enrichedProject.step === 0 || !enrichedProject.narrative || !enrichedProject.narrative.title) {
          try {
            await api.projects.delete(project.id);
            setProjects(projects.filter(p => p.id !== project.id));
            showToast('方向未选定，请重新创建项目', 'info');
          } catch (e) {
            showToast('删除失败', 'error');
          }
          return;
        }
        const backStep = Math.max(1, enrichedProject.step - 1);
        enrichedProject.step = backStep;
        openProject(enrichedProject);
        setLoadingProject(null);
      } else {
        openProject(project);
        setLoadingProject(null);
      }
    } catch (error) {
      console.error('获取项目详情失败:', error);
      openProject(project);
      setLoadingProject(null);
    }
  };

  const handleViewOutline = async (project) => {
    setLoadingProject(project.id);
    try {
      const completedProject = await api.projects.getCompleted(project.id);
      if (completedProject) {
        const enrichedProject = {
          ...project,
          step: 5,
          narrative: completedProject.narrative,
          narrativeOptions: completedProject.narrative_options,
          selectedNarrative: completedProject.selected_narrative,
          llmParams: completedProject.llm_params,
          exhibitionTitle: completedProject.exhibition_title,
          uploadedExhibits: completedProject.uploaded_exhibits,
          exhibitConfirmations: completedProject.exhibit_confirmations,
          units: completedProject.units,
          keptExhibits: completedProject.kept_exhibits,
          textSections: completedProject.text_sections,
        };
        openProject(enrichedProject);
        setCurrentStep(5);
        setCurrentPage('step5');
      } else {
        showToast('项目不存在', 'error');
      }
    } catch (error) {
      console.error('获取项目详情失败:', error);
      showToast('加载失败', 'error');
    }
    setLoadingProject(null);
  };

  const handleViewProject = async (project) => {
    setLoadingProject(project.id);
    try {
      let enrichedProject = null;
      
      let fullProject = null;
      try {
        fullProject = await api.projects.get(project.id);
      } catch (e) {
        // 项目可能已完成，从进行中表删除
      }
      
      if (fullProject) {
        enrichedProject = {
          ...project,
          step: fullProject.step || project.step,
          narrative: fullProject.narrative,
          narrativeOptions: fullProject.narrative_options,
          selectedNarrative: fullProject.selected_narrative,
          llmParams: fullProject.llm_params,
          exhibitionTitle: fullProject.exhibition_title,
          uploadedExhibits: fullProject.uploaded_exhibits,
          exhibitConfirmations: fullProject.exhibit_confirmations,
          units: fullProject.units,
          keptExhibits: fullProject.kept_exhibits,
          textSections: fullProject.text_sections,
        };
      } else {
        const completedProject = await api.projects.getCompleted(project.id);
        if (completedProject) {
          enrichedProject = {
            ...project,
            step: 5,
            narrative: completedProject.narrative,
            narrativeOptions: completedProject.narrative_options,
            selectedNarrative: completedProject.selected_narrative,
            llmParams: completedProject.llm_params,
            exhibitionTitle: completedProject.exhibition_title,
            uploadedExhibits: completedProject.uploaded_exhibits,
            exhibitConfirmations: completedProject.exhibit_confirmations,
            units: completedProject.units,
            keptExhibits: completedProject.kept_exhibits,
            textSections: completedProject.text_sections,
          };
        }
      }
      
      if (enrichedProject) {
        setViewingProject(enrichedProject);
        setLoadingProject(null);
      } else {
        setViewingProject({ ...project, step: 5 });
        setLoadingProject(null);
      }
    } catch (error) {
      console.error('获取项目详情失败:', error);
      setViewingProject({ ...project, step: 5 });
      setLoadingProject(null);
    }
  };

  const handleCloseView = () => {
    setViewingProject(null);
    setLoadingProject(null);
  };

  const handleEditFromView = async (project) => {
    try {
      let fullProject = null;
      try {
        fullProject = await api.projects.get(project.id);
      } catch (e) {
        // 项目可能已完成，从已完成表获取
      }
      
      if (fullProject) {
        const enrichedProject = {
          ...project,
          step: fullProject.step || project.step,
          narrative: fullProject.narrative,
          narrativeOptions: fullProject.narrative_options,
          selectedNarrative: fullProject.selected_narrative,
          llmParams: fullProject.llm_params,
          exhibitionTitle: fullProject.exhibition_title,
          uploadedExhibits: fullProject.uploaded_exhibits,
          exhibitConfirmations: fullProject.exhibit_confirmations,
          units: fullProject.units,
          keptExhibits: fullProject.kept_exhibits,
          textSections: fullProject.text_sections,
        };
        openProject(enrichedProject);
        setCurrentStep(enrichedProject.step);
        setCurrentPage(`step${enrichedProject.step}`);
        setLoadingProject(null);
      } else {
        // 尝试从已完成项目表获取
        const completedProject = await api.projects.getCompleted(project.id);
        if (completedProject) {
          const enrichedProject = {
            ...project,
            step: 5,
            narrative: completedProject.narrative,
            narrativeOptions: completedProject.narrative_options,
            selectedNarrative: completedProject.selected_narrative,
            llmParams: completedProject.llm_params,
            exhibitionTitle: completedProject.exhibition_title,
            uploadedExhibits: completedProject.uploaded_exhibits,
            exhibitConfirmations: completedProject.exhibit_confirmations,
            units: completedProject.units,
            keptExhibits: completedProject.kept_exhibits,
            textSections: completedProject.text_sections,
          };
          openProject(enrichedProject);
          setCurrentStep(5);
          setCurrentPage('step5');
        } else {
          openProject({ ...project, step: 5 });
          setCurrentStep(5);
          setCurrentPage('step5');
        }
        setLoadingProject(null);
      }
    } catch (error) {
      console.error('获取项目详情失败:', error);
      openProject({ ...project, step: 5 });
      setCurrentStep(5);
      setCurrentPage('step5');
      setLoadingProject(null);
    }
    setViewingProject(null);
  };

  const handleDeleteClick = (project, e) => {
    e.stopPropagation();
    setDeleteModal({ id: project.id, title: project.title, isCompleted: project.step >= 5 });
    setDeletingId(project.id);
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;

    setIsDeleting(true);
    try {
      if (deleteModal.isCompleted) {
        try {
          await api.projects.deleteCompleted(deleteModal.id);
        } catch (e) {
          await api.projects.delete(deleteModal.id);
        }
      } else {
        await api.projects.delete(deleteModal.id);
      }
      showToast('项目已删除', 'success');
      setDeleteModal(null);
      setDeletingId(null);
      if (viewingProject?.id === deleteModal.id) {
        setViewingProject(null);
      }
      refreshProjects();
    } catch (error) {
      console.error('删除项目失败:', error);
      showToast('删除失败，请重试', 'error');
      setDeletingId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderStepContent = (project, step) => {
    switch (step) {
      case 1:
        const selectedOption = project.narrativeOptions?.[project.selectedNarrative];
        return (
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>叙事方向</div>
            <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 8 }}>
              {selectedOption?.title || project.narrative?.title || '未设置'}
            </div>
            {selectedOption?.desc && (
              <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 8 }}>
                {selectedOption.desc}
              </div>
            )}
            {selectedOption?.logic && (
              <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 8 }}>
                {selectedOption.logic}
              </div>
            )}
            {project.llmParams && project.llmParams.exhibits && (
              <div style={{ fontSize: 12, color: C.textSecondary }}>
                展品数量: {project.llmParams.exhibits.length} 件
              </div>
            )}
            {project.narrativeOptions && project.narrativeOptions.length > 0 && (
              <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 4 }}>
                方案数量: {project.narrativeOptions.length}（已选择: {project.selectedNarrative + 1}）
              </div>
            )}
          </div>
        );
      case 2:
        return (
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>单元结构</div>
            <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 8 }}>
              {project.units?.length || 0} 个单元
            </div>
            {project.units && project.units.length > 0 && (
              <div style={{ fontSize: 12, color: C.textSecondary }}>
                {project.units.map((u, i) => (
                  <div key={i} style={{ marginTop: 4, paddingLeft: 8, borderLeft: `2px solid ${C.accentPrimary}44` }}>
                    {u.tag}: {u.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 3:
        return (
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>展品筛选</div>
            <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 8 }}>
              {project.exhibitCount || 0} 件展品
            </div>
            {project.exhibitRecommendations && project.exhibitRecommendations.length > 0 && (
              <div style={{ fontSize: 12, color: C.textSecondary }}>
                <div>推荐展品: {project.exhibitRecommendations.length} 件</div>
              </div>
            )}
            {project.units && project.units.length > 0 && (
              <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 8 }}>
                {project.units.map((u, i) => (
                  <div key={i} style={{ marginTop: 4 }}>
                    {u.title}: {u.items || 0} 件
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 4:
        return (
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>文本撰写</div>
            <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 8 }}>
              {project.textSections?.length || 0} 个文本段落
            </div>
            {project.textSections && project.textSections.length > 0 && (
              <div style={{ fontSize: 12, color: C.textSecondary }}>
                {project.textSections.map((s, i) => (
                  <div key={i} style={{ marginTop: 4, paddingLeft: 8, borderLeft: `2px solid ${s.edited ? C.humanEdited : C.aiGenerated}` }}>
                    {s.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 5:
        return (
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>最终大纲</div>
            <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 8 }}>
              策展大纲已完成
            </div>
            {project.textSections && project.textSections.length > 0 && (
              <div style={{ fontSize: 12, color: C.textSecondary }}>
                <div>包含 {project.textSections.length} 个章节</div>
              </div>
            )}
            {project.units && project.units.length > 0 && (
              <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 4 }}>
                <div>共 {project.units.length} 个展览单元</div>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main style={{ padding: "28px 36px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: C.textPrimary, fontFamily: "'Noto Serif SC', serif" }}>
          我的项目
        </h1>
        <Btn onClick={() => createNewProject()}>+ 新建策展项目</Btn>
      </div>

      <div style={{ marginBottom: 8, fontWeight: 700, color: C.textSecondary, fontSize: 13 }}>进行中</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 32 }}>
        {projects.map((p, i) => (
          <Card key={p.id || i} style={{ width: '100%' }}>
            <div style={{ height: 5, background: C.accentPrimary }} />
            <div style={{ padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: C.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
              <div style={{ color: C.accentSecondary, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>
                Step {p.step} / 5
              </div>
              <div style={{ height: 6, background: C.stepInactive, borderRadius: 3, marginBottom: 8, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(p.step / 5) * 100}%`, background: C.accentPrimary, borderRadius: 3 }} />
              </div>
              <div style={{ fontSize: 11, color: C.textSecondary, marginBottom: 12 }}>最近编辑：{p.time}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn small onClick={() => handleContinueEdit(p)} disabled={loadingProject === p.id}>
                  {loadingProject === p.id ? '加载中...' : '继续编辑'}
                </Btn>
                <Btn small variant="ghost" onClick={() => handleViewProject(p)} disabled={loadingProject === p.id}>查看</Btn>
                <Btn small variant="ghost" onClick={(e) => handleDeleteClick(p, e)} disabled={deletingId === p.id} style={{ color: '#e74c3c' }}>
                  {deletingId === p.id ? '删除中...' : '删除'}
                </Btn>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ marginBottom: 8, fontWeight: 700, color: C.textSecondary, fontSize: 13 }}>已完成</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
        {completedProjects.map((p, i) => (
          <Card key={p.id || i} style={{ width: '100%' }}>
            <div style={{ height: 5, background: C.success }} />
            <div style={{ padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.textSecondary, marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
              <div style={{ color: C.success, fontSize: 12, marginBottom: 12 }}>Step 5 / 5 ✓</div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn small onClick={() => handleViewOutline(p)} disabled={loadingProject === p.id}>
                  {loadingProject === p.id ? '加载中...' : '查看大纲'}
                </Btn>
                <Btn small variant="ghost" onClick={() => handleViewProject(p)} disabled={loadingProject === p.id}>查看</Btn>
                <Btn small variant="ghost" onClick={(e) => handleDeleteClick(p, e)} disabled={deletingId === p.id} style={{ color: '#e74c3c' }}>
                  {deletingId === p.id ? '删除中...' : '删除'}
                </Btn>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {viewingProject && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 500, padding: 40,
        }}>
          <div style={{
            background: "#fff", borderRadius: 12, width: "100%", maxWidth: 800,
            maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.3)",
          }}>
            <div style={{ padding: "24px 28px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: C.textPrimary, fontFamily: "'Noto Serif SC', serif" }}>
                    {viewingProject.title}
                  </h2>
                  <div style={{ fontSize: 13, color: C.textSecondary, marginTop: 4 }}>
                    最近编辑：{viewingProject.time}
                  </div>
                </div>
                <button
                  onClick={handleCloseView}
                  style={{
                    width: 32, height: 32, borderRadius: 6, border: "none",
                    background: C.bgSecondary, cursor: "pointer", fontSize: 18,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >×</button>
              </div>
            </div>

            <div style={{ padding: "24px 28px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                <div style={{ display: "flex", gap: 20 }}>
                  <div style={{ width: 80, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 8 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: C.accentSecondary,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontWeight: 700, fontSize: 12,
                    }}>
                      配
                    </div>
                    <div style={{
                      width: 2, flex: 1, minHeight: 76, marginTop: 8,
                      background: C.success,
                    }} />
                  </div>
                  <div style={{ flex: 1, paddingBottom: 24 }}>
                    <div style={{
                      fontWeight: 700, fontSize: 14, marginBottom: 8,
                      color: C.textPrimary,
                    }}>
                      新建策展：生成配置
                    </div>
                    {renderSetupContent(viewingProject)}
                  </div>
                </div>

                {STEPS.map((label, i) => {
                  const step = i + 1;
                  const isDone = step <= viewingProject.step;
                  const isCurrent = step === viewingProject.step;

                  return (
                    <div key={step} style={{ display: "flex", gap: 20 }}>
                      <div style={{ width: 80, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 8 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%",
                          background: isDone ? (isCurrent ? C.accentPrimary : C.success) : C.stepInactive,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontWeight: 700, fontSize: 13,
                        }}>
                          {isDone ? (isCurrent ? step : "✓") : step}
                        </div>
                        {step < STEPS.length && (
                          <div style={{
                            width: 2, flex: 1, minHeight: 60, marginTop: 8,
                            background: isDone ? C.success : C.stepInactive,
                          }} />
                        )}
                      </div>
                      <div style={{ flex: 1, paddingBottom: step < STEPS.length ? 24 : 0 }}>
                        <div style={{
                          fontWeight: 700, fontSize: 14, marginBottom: 8,
                          color: isDone ? C.textPrimary : C.textSecondary,
                        }}>
                          Step {step}：{label}
                        </div>
                        {isDone ? (
                          renderStepContent(viewingProject, step)
                        ) : (
                          <div style={{ fontSize: 13, color: C.textPlaceholder }}>
                            尚未完成
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ padding: "20px 28px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <Btn variant="ghost" onClick={handleCloseView}>关闭</Btn>
              {viewingProject.step < 5 ? (
                <Btn onClick={() => handleEditFromView(viewingProject)}>继续编辑</Btn>
              ) : (
                <Btn onClick={() => handleEditFromView(viewingProject)}>查看大纲</Btn>
              )}
            </div>
          </div>
        </div>
      )}

      {deleteModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300,
        }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 24, width: 360 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>确认删除</h3>
            <p style={{ fontSize: 14, color: C.textSecondary, marginBottom: 20 }}>
              确定要删除项目「{deleteModal.title}」吗？此操作不可撤销。
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => setDeleteModal(null)} disabled={isDeleting}>取消</Btn>
              <Btn variant="danger" onClick={confirmDelete} disabled={isDeleting}>
                {isDeleting ? "删除中..." : "确认删除"}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {loadingProject && (
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
            加载项目...
          </div>
        </div>
      )}
    </main>
  );
};

import React, { useState, useEffect } from 'react';
import { Card, Btn, Divider, Tag } from '../components/ui';
import { api } from '../api/client';

export const PageStep2 = ({
  navigateTo,
  goNextStep,
  goPrevStep,
  units,
  setUnits,
  currentProject,
  setCurrentProject,
  projects,
  setProjects,
  setCurrentStep,
  setCurrentPage,
  setKeptExhibits,
  keptExhibits,
  showToast,
  theme,
}) => {
  const C = theme;
  const [editingUnit, setEditingUnit] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteModal, setDeleteModal] = useState(null);
  const [isDistributing, setIsDistributing] = useState(false);

  useEffect(() => {
    if (currentProject) {
      if (currentProject.units && currentProject.units.length > 0 && (!units || units.length === 0)) {
        setUnits(currentProject.units);
      }
      if (currentProject.keptExhibits && Object.keys(currentProject.keptExhibits).length > 0 && (!keptExhibits || Object.keys(keptExhibits).length === 0)) {
        setKeptExhibits(currentProject.keptExhibits);
      }
    }
  }, [currentProject]);

  const tagOptions = [
    { tag: "序章", tagColor: "#C8873A" },
    { tag: "第一单元", tagColor: "#2B5F8E" },
    { tag: "第二单元", tagColor: "#2B5F8E" },
    { tag: "第三单元", tagColor: "#2B5F8E" },
    { tag: "第四单元", tagColor: "#2B5F8E" },
    { tag: "第五单元", tagColor: "#2B5F8E" },
    { tag: "第六单元", tagColor: "#2B5F8E" },
    { tag: "第七单元", tagColor: "#2B5F8E" },
    { tag: "第八单元", tagColor: "#2B5F8E" },
    { tag: "尾声", tagColor: "#2D7D52" },
  ];

  const toChineseNum = (num) => {
    const cn = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
    if (num <= 10) return cn[num];
    if (num <= 99) {
      const shi = Math.floor(num / 10);
      const ge = num % 10;
      return (shi > 1 ? cn[shi] : "") + "十" + (ge > 0 ? cn[ge] : "");
    }
    return num.toString();
  };

  const getTagOrder = (tag) => {
    if (tag === "序章") return 0;
    if (tag === "尾声") return 100;
    const match = tag.match(/第(.*)单元/);
    if (match) {
      const numStr = match[1];
      const numMap = { "一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9, "十": 10 };
      return numMap[numStr] ? numMap[numStr] + 1 : 50;
    }
    return 50;
  };

  const sortUnitsByTag = (unitList) => {
    const sorted = [...unitList].sort((a, b) => getTagOrder(a.tag) - getTagOrder(b.tag));
    return sorted.map((u, idx) => ({ ...u, id: u.id || `unit-${Date.now()}-${idx}` }));
  };

  const handleEditUnit = (unit, index) => {
    const isPrologueOrEpilogue = unit.tag === '序章' || unit.tag === '尾声';
    setEditingUnit({ ...unit, index });
    setEditForm({
      title: unit.title,
      tag: unit.tag,
      tagColor: unit.tagColor,
      desc: unit.desc,
      items: isPrologueOrEpilogue ? 0 : (unit.items || 5)
    });
  };

  const handleSaveEdit = () => {
    if (!editForm.title.trim()) {
      alert('请填写单元标题');
      return;
    }

    const newUnits = [...units];
    newUnits[editingUnit.index] = {
      ...newUnits[editingUnit.index],
      title: editForm.title,
      tag: editForm.tag,
      tagColor: editForm.tagColor,
      desc: editForm.desc,
      items: editForm.items,
    };
    const sortedUnits = sortUnitsByTag(newUnits);
    setUnits(sortedUnits);
    updateProjectInStore(sortedUnits);
    setEditingUnit(null);
  };

  const handleCancelEdit = () => {
    setEditingUnit(null);
    setEditForm({});
  };

  const handleAddUnit = () => {
    const newUnit = {
      id: Date.now(),
      tag: `第${toChineseNum(units.length + 1)}单元`,
      tagColor: "#2B5F8E",
      title: "新单元标题",
      desc: "请填写叙事定位",
      items: 0
    };
    const newUnits = sortUnitsByTag([...units, newUnit]);
    setUnits(newUnits);
    updateProjectInStore(newUnits);
  };

  const handleDeleteUnit = (index) => {
    setDeleteModal({ index, name: units[index].title });
  };

  const confirmDelete = () => {
    if (deleteModal) {
      const newUnits = sortUnitsByTag(units.filter((_, i) => i !== deleteModal.index));
      setUnits(newUnits);
      updateProjectInStore(newUnits);
      setDeleteModal(null);
    }
  };

  const updateProjectInStore = (newUnits) => {
    if (currentProject) {
      const updatedProject = { ...currentProject, units: newUnits };
      setCurrentProject(updatedProject);
      setProjects(projects.map(p => p.id === currentProject.id ? updatedProject : p));
    }
  };

  const handleNext = async () => {
    if (!currentProject?.llmParams?.exhibits || currentProject.llmParams.exhibits.length === 0) {
      showToast('没有展品数据，无法分配', 'error');
      return;
    }

    setIsDistributing(true);

    try {
      const mainUnits = units.filter(u => u.tag !== '序章' && u.tag !== '尾声');
      const unitsWithItems = mainUnits.map(u => ({
        ...u,
        items: u.items || 5
      }));
      
      console.log('Step2 handleNext - unitsWithItems:', unitsWithItems);
      console.log('Step2 handleNext - exhibit_pool count:', currentProject.llmParams.exhibits.length);
      
      const result = await api.ai.recommendExhibitsBatch({
        units: unitsWithItems,
        exhibit_pool: currentProject.llmParams.exhibits,
        narrative: currentProject.narrative || { title: '', desc: '' }
      });

      console.log('AI返回的推荐结果:', result);
      console.log('AI返回的leftovers数量:', result.leftovers?.length || 0);
      
      if (result.recommendations) {
        const newKeptExhibits = result.recommendations;
        if (result.leftovers && result.leftovers.length > 0) {
          newKeptExhibits['_leftovers'] = result.leftovers.map(ex => ({ ...ex, kept: false, ctx: '备选', src: '备选' }));
        }
        setKeptExhibits(newKeptExhibits);
        
        const updatedProject = { ...currentProject, step: 3, units: unitsWithItems, keptExhibits: newKeptExhibits };
        setCurrentProject(updatedProject);
        setProjects(projects.map(p => p.id === currentProject.id ? updatedProject : p));
        
        if (currentProject.id) {
          try {
            await api.projects.update(currentProject.id, {
              step: 3,
              units: unitsWithItems,
              kept_exhibits: newKeptExhibits,
            });
          } catch (e) {
            console.error('保存step失败:', e);
          }
        }
        
        setCurrentStep(3);
        setCurrentPage('step3');
      } else {
        throw new Error('AI推荐失败');
      }
    } catch (error) {
      console.error('分配展品失败:', error);
      showToast('分配展品失败，请重试', 'error');
    } finally {
      setIsDistributing(false);
    }
  };
  
  return (
    <main style={{ padding: "28px 36px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: C.textPrimary, fontFamily: "'Noto Serif SC', serif" }}>
        Step 2：审核并调整单元结构
      </h1>
      <p style={{ color: C.textSecondary, fontSize: 14, margin: "6px 0 24px" }}>
        AI 已根据叙事方向生成单元结构，请审核调整
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, userSelect: "none" }}>
        {units.map((u, i) => {
          const isPrologueOrEpilogue = u.tag === '序章' || u.tag === '尾声';
          return (
          <div
            key={u.id || i}
            style={{
              display: "flex", alignItems: "center", gap: 16,
              background: C.bgSecondary,
              borderRadius: 10,
              border: `1.5px solid ${C.border}`,
              padding: "12px 16px",
            }}
          >
            <div style={{
              fontSize: 18, color: C.textPlaceholder, padding: "4px 8px", userSelect: "none",
            }}>☰</div>
            <Tag label={u.tag} color={u.tagColor} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: C.textPrimary, fontFamily: "'Noto Serif SC', serif" }}>
                {u.title}
              </div>
              <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>
                叙事定位：{u.desc}
              </div>
            </div>
            {!isPrologueOrEpilogue && (
              <div style={{ fontSize: 12, color: C.textSecondary, marginRight: 8 }}>
                {u.items} 件展品
              </div>
            )}
            {!isPrologueOrEpilogue && (
              <>
                <Btn small variant="ghost" onClick={() => handleEditUnit(u, i)}>编辑</Btn>
                <Btn small variant="ghost" onClick={() => handleDeleteUnit(i)} style={{ color: '#e74c3c' }}>删除</Btn>
              </>
            )}
          </div>
        )})}
      </div>

      <button
        onClick={handleAddUnit}
        style={{
          marginTop: 16, padding: "10px 20px", borderRadius: 6, border: `1px dashed ${C.accentPrimary}`,
          background: "transparent", color: C.accentPrimary, cursor: "pointer", fontSize: 13, fontWeight: 700,
        }}>
        + 添加单元
      </button>

      <Divider style={{ margin: "24px 0" }} />

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Btn variant="ghost" onClick={() => navigateTo("step1")}>← 返回</Btn>
        <Btn onClick={handleNext} disabled={isDistributing}>
          {isDistributing ? "正在分配展品..." : "确认单元结构，进入下一步 →"}
        </Btn>
      </div>

      {editingUnit && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.4)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200,
        }}>
          <div style={{ background: "#fff", borderRadius: 10, padding: 24, width: 520, boxShadow: "0 8px 32px rgba(0,0,0,.2)" }}>
            <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: C.textPrimary }}>
              编辑单元
            </h3>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.textSecondary, marginBottom: 6 }}>
                单元标签
              </div>
              <select
                value={editForm.tag}
                onChange={(e) => {
                  const selected = tagOptions.find(t => t.tag === e.target.value);
                  setEditForm({
                    ...editForm,
                    tag: e.target.value,
                    tagColor: selected?.tagColor || "#2B5F8E"
                  });
                }}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 6,
                  border: `1px solid ${C.border}`, fontSize: 14,
                  outline: "none", boxSizing: "border-box", background: "#fff",
                }}
              >
                {tagOptions.map(opt => (
                  <option key={opt.tag} value={opt.tag}>{opt.tag}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.textSecondary, marginBottom: 6 }}>
                单元标题
              </div>
              <input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="例如：文明的序章"
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 6,
                  border: `1px solid ${C.border}`, fontSize: 14,
                  outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.textSecondary, marginBottom: 6 }}>
                叙事定位
              </div>
              <textarea
                value={editForm.desc}
                onChange={(e) => setEditForm({ ...editForm, desc: e.target.value })}
                placeholder="描述这个单元的叙事定位和核心内容..."
                rows={3}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 6, resize: "vertical",
                  border: `1px solid ${C.border}`, fontSize: 13,
                  outline: "none", boxSizing: "border-box", fontFamily: "'Noto Sans SC', sans-serif",
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.textSecondary, marginBottom: 6 }}>
                展品数量
              </div>
              {editingUnit && (editingUnit.tag === '序章' || editingUnit.tag === '尾声') ? (
                <div style={{ color: C.textSecondary, fontSize: 13 }}>
                  序章和尾声不分配展品
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button
                    onClick={() => setEditForm({ ...editForm, items: Math.max(0, (editForm.items || 0) - 1) })}
                    style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${C.border}`, background: "#fff", cursor: "pointer", fontSize: 18 }}
                  >-</button>
                  <span style={{ minWidth: 40, textAlign: "center", fontWeight: 700 }}>{editForm.items || 0}</span>
                  <button
                    onClick={() => setEditForm({ ...editForm, items: (editForm.items || 0) + 1 })}
                    style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${C.border}`, background: "#fff", cursor: "pointer", fontSize: 18 }}
                  >+</button>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={handleCancelEdit}>取消</Btn>
              <Btn onClick={handleSaveEdit}>保存</Btn>
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
              确定要删除单元「{deleteModal.name}」吗？此操作可撤销。
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => setDeleteModal(null)}>取消</Btn>
              <Btn variant="danger" onClick={confirmDelete}>确认删除</Btn>
            </div>
          </div>
        </div>
      )}

      {isDistributing && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(255,255,255,.9)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          zIndex: 350,
        }}>
          <div style={{ 
            width: 48, height: 48, border: `4px solid ${C.border}`, borderTopColor: C.accentPrimary,
            borderRadius: "50%", animation: "spin 1s linear infinite",
          }} />
          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
          <div style={{ marginTop: 20, fontSize: 15, color: C.textPrimary, fontWeight: 600 }}>
            正在分配展品...
          </div>
          <div style={{ marginTop: 8, fontSize: 13, color: C.textSecondary }}>
            AI 正在为每个单元匹配合适的展品
          </div>
        </div>
      )}
    </main>
  );
};

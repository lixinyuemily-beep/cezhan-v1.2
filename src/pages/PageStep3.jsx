import React, { useState, useEffect } from 'react';
import { Card, Btn, Divider, Tag } from '../components/ui';

export const PageStep3 = ({ 
  navigateTo,
  goNextStep,
  goPrevStep,
  exhibitConfirmations,
  setExhibitConfirmations,
  keptExhibits,
  setKeptExhibits,
  units,
  setUnits,
  currentProject,
  showToast,
  theme,
}) => {
  const C = theme;
  const [showAlt, setShowAlt] = useState(false);
  const [activeUnitId, setActiveUnitId] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [addFromAltModal, setAddFromAltModal] = useState(null);
  const [manualAddModal, setManualAddModal] = useState(false);
  const [searchModal, setSearchModal] = useState(false);
  const [exhibitsByUnit, setExhibitsByUnit] = useState({});
  const [deletingKey, setDeletingKey] = useState(null);
  const [nextStepModal, setNextStepModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (units.length > 0 && !activeUnitId) {
      setActiveUnitId(units[0].id);
    }
  }, [units, activeUnitId]);

  useEffect(() => {
    if (currentProject) {
      if (currentProject.units && currentProject.units.length > 0 && (!units || units.length === 0)) {
        setUnits(currentProject.units);
      }
      if (currentProject.keptExhibits && Object.keys(currentProject.keptExhibits).length > 0 && (!keptExhibits || Object.keys(keptExhibits).length === 0)) {
        setKeptExhibits(currentProject.keptExhibits);
        setExhibitsByUnit(currentProject.keptExhibits);
      }
      if (currentProject.exhibitConfirmations) {
        setExhibitConfirmations(currentProject.exhibitConfirmations);
      }
    }
  }, [currentProject]);

  useEffect(() => {
    if (units.length > 0 && keptExhibits && Object.keys(keptExhibits).length > 0) {
      const hasData = units.some(u => keptExhibits[u.id] && keptExhibits[u.id].length > 0);
      if (hasData && Object.keys(exhibitsByUnit).length === 0) {
        setExhibitsByUnit(keptExhibits);
      }
    }
  }, [units.length]);

  const activeUnit = units.find(u => u.id === activeUnitId) || units[0];
  const activeUnitIndex = units.findIndex(u => u.id === activeUnitId);
  const allExhibits = exhibitsByUnit[activeUnitId] || [];
  const keptExhibitsList = keptExhibits[activeUnitId] || [];
  const confirmedCount = Object.keys(exhibitConfirmations).length;

  const isExhibitKept = (index) => {
    const exhibit = allExhibits[index];
    return keptExhibitsList.some(e => e.id === exhibit.id);
  };

  const handleKeepExhibit = (index) => {
    const exhibit = allExhibits[index];
    if (!exhibit) return;
    setKeptExhibits(prev => {
      const unitKept = prev[activeUnitId] || [];
      if (unitKept.some(e => e.id === exhibit.id)) {
        return prev;
      }
      return { ...prev, [activeUnitId]: [...unitKept, exhibit] };
    });
  };

  const handleRemoveExhibit = (index) => {
    const exhibit = allExhibits[index];
    if (!exhibit) return;
    setDeleteModal({ index, name: exhibit.name });
  };

  const confirmDelete = () => {
    if (deleteModal) {
      setDeletingKey(deleteModal.index);
      setTimeout(() => {
        const exhibit = allExhibits[deleteModal.index];
        setExhibitsByUnit(prev => {
          const unitExhibits = [...(prev[activeUnitId] || [])];
          unitExhibits.splice(deleteModal.index, 1);
          return { ...prev, [activeUnitId]: unitExhibits };
        });
        if (exhibit) {
          setKeptExhibits(prev => {
            const unitKept = prev[activeUnitId] || [];
            return { ...prev, [activeUnitId]: unitKept.filter(e => e.id !== exhibit.id && e.name !== exhibit.name) };
          });
        }
        setDeleteModal(null);
        setDeletingKey(null);
        showToast('展品已删除', 'success');
      }, 300);
    }
  };

  const handleAddExhibit = (exhibit) => {
    setExhibitsByUnit(prev => ({
      ...prev,
      [activeUnitId]: [...(prev[activeUnitId] || []), { ...exhibit, src: "手动添加" }]
    }));
    showToast('展品添加成功', 'success');
  };

  const handleAddFromAlt = (exhibit, index) => {
    setAddFromAltModal({ exhibit, index });
  };

  const confirmAddFromAlt = () => {
    if (!addFromAltModal) return;
    const { exhibit, index } = addFromAltModal;
    setExhibitsByUnit(prev => ({
      ...prev,
      [activeUnitId]: [...(prev[activeUnitId] || []), { ...exhibit, src: "从备选添加" }]
    }));
    setKeptExhibits(prev => {
      const leftovers = [...(prev['_leftovers'] || [])];
      leftovers.splice(index, 1);
      return { ...prev, '_leftovers': leftovers };
    });
    setAddFromAltModal(null);
    showToast('展品已添加到主推', 'success');
  };

  const handleConfirmUnit = () => {
    if (exhibitConfirmations[activeUnitId]) return;
    setExhibitConfirmations(prev => ({ ...prev, [activeUnitId]: true }));
    showToast('单元已确认', 'success');
  };

  const handlePrevUnit = () => {
    if (activeUnitIndex > 0) {
      setActiveUnitId(units[activeUnitIndex - 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextUnit = () => {
    if (activeUnitIndex >= 0 && activeUnitIndex < units.length - 1) {
      setActiveUnitId(units[activeUnitIndex + 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <main style={{ padding: "28px 36px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: C.textPrimary, fontFamily: "'Noto Serif SC', serif" }}>
        Step 3：审核展品推荐
      </h1>
      <p style={{ color: C.textSecondary, fontSize: 14, margin: "6px 0 20px" }}>
        AI 已为每个单元推荐展品，请审核并调整
      </p>

      <div style={{ display: "flex", gap: 24 }}>
        <div style={{ width: 200, flexShrink: 0, alignSelf: "flex-start", position: "sticky", top: 84 }}>
          <Card style={{ padding: "12px 0", maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}>
            <div style={{ padding: "0 16px 8px", fontSize: 11, color: C.textSecondary, fontWeight: 700 }}>单元导航</div>
            <Divider />
            {units.map(u => {
              const isConfirmed = exhibitConfirmations[u.id];
              const isActive = u.id === activeUnitId;
              return (
                <div 
                  key={u.id} 
                  onClick={() => setActiveUnitId(u.id)}
                  style={{
                    padding: "8px 16px", background: isActive ? C.aiGenerated : "transparent",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    cursor: "pointer", fontSize: 12,
                    color: isActive ? C.accentPrimary : C.textSecondary,
                    fontWeight: isActive ? 700 : 400,
                  }}
                >
                  <span>
                    {isConfirmed ? "●" : isActive ? "●" : "○"} {u.title}
                  </span>
                  {isConfirmed && <span style={{ color: C.success }}>✓</span>}
                </div>
              );
            })}
            <Divider />
            <div style={{ padding: "0 16px", fontSize: 11, color: C.textSecondary }}>整体进度：</div>
            <div style={{ padding: "2px 16px 8px", fontSize: 11, color: C.accentPrimary, fontWeight: 700 }}>
              {confirmedCount} / {units.length} 单元已确认
            </div>
            {confirmedCount < units.length && (
              <div style={{ padding: "8px 16px 16px" }}>
                <Btn small onClick={() => {
                  const allConfirmed = {};
                  units.forEach(u => { allConfirmed[u.id] = true; });
                  setExhibitConfirmations(allConfirmed);
                  showToast('已确认所有单元', 'success');
                }} style={{ width: '100%' }}>
                  一键确认全部
                </Btn>
              </div>
            )}
          </Card>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 700, fontSize: 18, color: C.textPrimary, fontFamily: "'Noto Serif SC', serif" }}>
                {activeUnit?.title || '请选择单元'}
              </span>
              {activeUnit?.tag && <Tag label={activeUnit.tag} color={activeUnit.tagColor || C.accentSecondary} />}
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <Btn small variant="ghost" disabled={activeUnitIndex <= 0} onClick={handlePrevUnit}>
                ← 上一个单元
              </Btn>
              <Btn small variant="ghost" disabled={activeUnitIndex === -1 || activeUnitIndex >= units.length - 1} onClick={handleNextUnit}>
                下一个单元 →
              </Btn>
            </div>
          </div>
          <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 16 }}>
            叙事定位：{activeUnit?.desc || '暂无'}
          </div>
          <Divider />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: C.textSecondary }}>
              主推展品（已分配到该单元）
            </div>
            {activeUnit && activeUnit.items && allExhibits.length > 0 && allExhibits.length < activeUnit.items && (
              <div style={{ fontSize: 12, color: '#e74c3c', fontWeight: 600 }}>
                ⚠️ 适配该单元的展品数量不足（当前{allExhibits.length}件/目标{activeUnit.items}件）
              </div>
            )}
          </div>

          {allExhibits.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: C.textPlaceholder }}>
              该单元暂无推荐展品
            </div>
          ) : (
            allExhibits.map((e, i) => {
              const isKept = isExhibitKept(i);
              const isDeleting = deletingKey === i;
              const exhibitSize = e.size || e.sz || '-';
              const displaySize = exhibitSize !== '-' && !String(exhibitSize).includes('cm') ? `${exhibitSize}cm` : exhibitSize;
              const isAiRecommended = e.src === "AI推荐";
              const displayReason = isAiRecommended ? String(e.reason || "").trim() : "";
              const sourceTagColor = isAiRecommended ? C.aiGenerated : C.humanEdited;
              return (
                <Card key={i} style={{ 
                  marginBottom: 12, 
                  opacity: isDeleting ? 0 : 1,
                  transform: isDeleting ? "translateX(100px)" : "translateX(0)",
                  transition: "opacity 0.3s, transform 0.3s",
                }}>
                  <div style={{ padding: 16 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                      {isAiRecommended && (
                        <>
                          <span style={{ fontSize: 12, color: C.textSecondary, fontWeight: 700 }}>
                            AI推荐程度
                          </span>
                          <span style={{ color: C.accentSecondary, fontSize: 14 }}>
                            {"★".repeat(e.stars)}{"☆".repeat(5 - e.stars)}
                          </span>
                        </>
                      )}
                      <Tag
                        label={`来源：${e.src}`}
                        color={sourceTagColor}
                        textColor={C.textPrimary}
                      />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: C.textPrimary }}>{e.name}</div>
                    <div style={{ fontSize: 11, color: C.textSecondary, marginBottom: 8, lineHeight: 1.7, textAlign: "left" }}>
                      <div>ID: {e.id || '-'}</div>
                      <div>朝代：{e.era || '-'}</div>
                      <div>材质：{e.material || e.mat || '-'}</div>
                      <div>尺寸：{displaySize}</div>
                    </div>
                    {displayReason && (
                      <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 8, lineHeight: 1.6, padding: '8px 10px', background: C.bgSecondary, borderRadius: 4, textAlign: "left" }}>
                        <strong>推荐理由：</strong>{displayReason}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8 }}>
                      <Btn
                        small
                        variant={isKept ? "success" : "outline"}
                        disabled={isKept}
                        onClick={() => handleKeepExhibit(i)}
                        style={isKept ? {
                          background: "#E8F5EA",
                          color: "#4F8A61",
                          opacity: 1,
                          border: "1px solid #BFDCC7",
                        } : undefined}
                      >
                        {isKept ? "✓ 已保留" : "✓ 保留"}
                      </Btn>
                      <Btn small variant="danger" onClick={() => handleRemoveExhibit(i)}>
                        ✗ 删除
                      </Btn>
                    </div>
                  </div>
                </Card>
              );
            })
          )}

          <button
            onClick={() => setShowAlt(!showAlt)}
            style={{
              padding: "8px 14px", background: C.bgPrimary, border: `1px solid ${C.border}`,
              borderRadius: 6, cursor: "pointer", fontSize: 12, color: C.textSecondary, marginBottom: 12,
            }}
          >
            {showAlt ? "▼" : "▶"} 展开查看备选展品（未被分配到单元）
          </button>

          {showAlt && (
            <div style={{ marginBottom: 20 }}>
              {keptExhibits['_leftovers'] && keptExhibits['_leftovers'].length > 0 ? (
                <>
                  <div style={{ 
                    fontSize: 13, fontWeight: 700, color: C.textSecondary, 
                    marginBottom: 12, padding: '8px 12px', background: C.bgSecondary, borderRadius: 6 
                  }}>
                    备选展品（{keptExhibits['_leftovers'].length} 件）
                  </div>
                  {keptExhibits['_leftovers'].map((e, i) => (
                    <Card key={i} style={{ marginBottom: 8, background: C.bgSecondary }}>
                      <div style={{ padding: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <Tag label="备选" color={C.textPlaceholder} textColor="#fff" />
                          <span style={{ fontSize: 11, color: C.textSecondary }}>{e.ctx || 'AI推荐'}</span>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{e.name}</div>
                        <div style={{ fontSize: 11, color: C.textSecondary }}>
                          {e.era || '-'} / {e.material || e.mat || '-'} / {e.size || e.sz || '-'}
                        </div>
                        <Btn small variant="primary" onClick={() => handleAddFromAlt(e, i)} style={{ marginTop: 8 }}>
                          + 添加到主推展品
                        </Btn>
                      </div>
                    </Card>
                  ))}
                </>
              ) : (
                <div style={{ 
                  fontSize: 13, color: C.textSecondary, 
                  padding: '8px 12px', background: C.bgSecondary, borderRadius: 6 
                }}>
                  无备选展品（所有展品已分配到各单元）
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <Btn small variant="ghost" onClick={() => setSearchModal(true)}>+ 从展品库添加</Btn>
            <Btn small variant="ghost" onClick={() => setManualAddModal(true)}>+ 手动输入展品信息</Btn>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <Btn variant="ghost" onClick={() => navigateTo("step2")}>← 返回</Btn>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <Btn small variant="ghost" disabled={activeUnitIndex <= 0} onClick={handlePrevUnit}>
                ← 上一个单元
              </Btn>
              <Btn small variant="ghost" disabled={activeUnitIndex === -1 || activeUnitIndex >= units.length - 1} onClick={handleNextUnit}>
                下一个单元 →
              </Btn>
              {!exhibitConfirmations[activeUnitId] && (
                <Btn onClick={handleConfirmUnit}>
                  确认该单元展品
                </Btn>
              )}
              {confirmedCount === units.length && (
                <Btn onClick={() => setNextStepModal(true)}>
                  进入下一步 →
                </Btn>
              )}
            </div>
          </div>
        </div>
      </div>

      {deleteModal && (
        <div style={{
          position: "fixed", inset: 0, background: C.bgOverlay || "rgba(0,0,0,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300,
        }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 24, width: 360 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>确认删除</h3>
            <p style={{ fontSize: 14, color: C.textSecondary, marginBottom: 20 }}>
              确定要删除展品「{deleteModal.name}」吗？此操作可撤销。
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => setDeleteModal(null)}>取消</Btn>
              <Btn variant="danger" onClick={confirmDelete}>确认删除</Btn>
            </div>
          </div>
        </div>
      )}

      {addFromAltModal && (
        <div style={{
          position: "fixed", inset: 0, background: C.bgOverlay || "rgba(0,0,0,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300,
        }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 24, width: 360 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>确认添加</h3>
            <p style={{ fontSize: 14, color: C.textSecondary, marginBottom: 20 }}>
              确定要将展品「{addFromAltModal.exhibit.name}」添加到主推展品吗？
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => setAddFromAltModal(null)}>取消</Btn>
              <Btn variant="primary" onClick={confirmAddFromAlt}>确认添加</Btn>
            </div>
          </div>
        </div>
      )}

      {manualAddModal && (
        <ManualAddModal C={C} onClose={() => setManualAddModal(false)} onAdd={handleAddExhibit} />
      )}

      {searchModal && (
        <SearchModal C={C} onClose={() => setSearchModal(false)} onAdd={handleAddExhibit} uploadedExhibits={exhibitsByUnit[activeUnitId] || []} />
      )}

      {nextStepModal && !isGenerating && (
        <NextStepModal 
          C={C}
          onClose={() => setNextStepModal(false)} 
          onConfirm={() => { 
            setIsGenerating(true);
            goNextStep(); 
          }} 
        />
      )}

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
            正在生成策展文本...
          </div>
        </div>
      )}
    </main>
  );
};

const ManualAddModal = ({ C, onClose, onAdd }) => {
  const [form, setForm] = useState({ name: '', era: '', mat: '', ctx: '', stars: 5, sz: '' });

  const handleSubmit = () => {
    if (!form.name.trim()) {
      return;
    }
    onAdd({
      name: form.name,
      era: form.era,
      mat: form.mat,
      ctx: form.ctx,
      id: `MAN-${Date.now()}`,
      stars: form.stars,
      sz: form.sz,
    });
    onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.5)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 400,
    }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: 24, width: 400, maxHeight: "80vh", overflow: "auto" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>手动输入展品信息</h3>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, color: C.textSecondary }}>展品名称 *</div>
          <input 
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="请输入展品名称"
            style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${C.border}`, boxSizing: "border-box" }} 
          />
        </div>
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, color: C.textSecondary }}>所属时代</div>
            <input 
              value={form.era}
              onChange={e => setForm({ ...form, era: e.target.value })}
              placeholder="如：唐代"
              style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${C.border}`, boxSizing: "border-box" }} 
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, color: C.textSecondary }}>尺寸</div>
            <div style={{ position: "relative" }}>
              <input 
                value={form.sz}
                onChange={e => setForm({ ...form, sz: e.target.value })}
                placeholder="如：32"
                style={{ width: "100%", padding: "8px 36px 8px 12px", borderRadius: 6, border: `1px solid ${C.border}`, boxSizing: "border-box" }} 
              />
              <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: C.textSecondary }}>cm</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, color: C.textSecondary }}>材质</div>
            <input 
              value={form.mat}
              onChange={e => setForm({ ...form, mat: e.target.value })}
              placeholder="如：青铜"
              style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${C.border}`, boxSizing: "border-box" }} 
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, color: C.textSecondary }}>推荐星级</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 0" }}>
              {[1, 2, 3, 4, 5].map(n => (
                <span 
                  key={n}
                  onClick={() => setForm({ ...form, stars: n })}
                  style={{ 
                    fontSize: 20, cursor: "pointer", 
                    color: n <= form.stars ? C.accentSecondary : C.stepInactive 
                  }}
                >
                  {n <= form.stars ? "★" : "☆"}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, color: C.textSecondary }}>策展语境</div>
          <textarea 
            value={form.ctx}
            onChange={e => setForm({ ...form, ctx: e.target.value })}
            placeholder="请输入展品的策展语境说明"
            rows={3}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${C.border}`, boxSizing: "border-box", resize: "vertical" }} 
          />
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <Btn variant="ghost" onClick={onClose}>取消</Btn>
          <Btn onClick={handleSubmit}>添加</Btn>
        </div>
      </div>
    </div>
  );
};

const SearchModal = ({ C, onClose, onAdd, uploadedExhibits }) => {
  const [keyword, setKeyword] = useState('');
  const [allExhibits, setAllExhibits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
     const loadAllExhibits = async () => {
       setLoading(true);
       try {
         const { api } = await import('../api/client');
         const data = await api.exhibits.getAll();
         setAllExhibits(data || []);
       } catch (err) {
         console.error('加载展品失败:', err);
       } finally {
         setLoading(false);
       }
     };
     loadAllExhibits();
   }, []);

  const searchResults = keyword 
    ? allExhibits.filter(r => 
        r.name?.includes(keyword) || 
        r.era?.includes(keyword) ||
        r.material?.includes(keyword) ||
        r.id?.includes(keyword)
      )
    : [];

  const handleAdd = (item) => {
    onAdd({
      name: item.name,
      era: item.era || '年份未上传',
      mat: item.material || '材质未上传',
      ctx: "从展品库添加",
      id: item.id,
      stars: 5,
      sz: item.size || item.sz || "尺寸未上传",
    });
    onClose();
  };

  const isAlreadyAdded = (item) => {
    return uploadedExhibits?.some(ex => ex.id === item.id);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.5)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 400,
    }}>
      <div style={{ background: C.bgSecondary, borderRadius: 12, padding: 24, width: 560, maxHeight: "80vh", overflow: "auto" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: C.textPrimary }}>从展品库添加</h3>
        <div style={{ marginBottom: 16 }}>
          <input 
            value={keyword}
            onChange={e => { setKeyword(e.target.value); setSearched(true); }}
            placeholder="输入关键词搜索展品名称、时代、材质..." 
            style={{ 
              width: "100%", padding: "10px 14px", borderRadius: 6, 
              border: `1px solid ${C.border}`, boxSizing: "border-box", fontSize: 14,
              background: C.bgPrimary, color: C.textPrimary 
            }} 
          />
        </div>
        <div style={{ maxHeight: 300, overflow: "auto", border: `1px solid ${C.border}`, borderRadius: 6, marginBottom: 20 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: C.textPlaceholder, fontSize: 13 }}>
              加载展品库中...
            </div>
          ) : !searched ? (
            <div style={{ padding: 40, textAlign: "center", color: C.textPlaceholder, fontSize: 13 }}>
              输入关键词进行搜索
            </div>
          ) : searchResults.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: C.textPlaceholder, fontSize: 13 }}>
              未找到相关展品
            </div>
          ) : (
            searchResults.map((r, i) => {
              const added = isAlreadyAdded(r);
              return (
                <div 
                  key={i}
                  style={{ 
                    padding: "12px 16px", borderBottom: `1px solid ${C.border}`, cursor: "pointer",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    background: added ? C.bgPrimary : 'transparent',
                    opacity: added ? 0.6 : 1,
                  }}
                  onClick={() => !added && handleAdd(r)}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: C.textPrimary }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: C.textSecondary }}>{r.id} · {r.era || '-'} · {r.material || '-'}</div>
                  </div>
                  {added ? (
                    <span style={{ fontSize: 12, color: C.textSecondary }}>已添加</span>
                  ) : (
                    <Btn small variant="ghost">添加</Btn>
                  )}
                </div>
              );
            })
          )}
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <Btn variant="ghost" onClick={onClose}>取消</Btn>
        </div>
      </div>
    </div>
  );
};

const NextStepModal = ({ C, onClose, onConfirm }) => (
  <div style={{
    position: "fixed", inset: 0, background: "rgba(0,0,0,.5)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 400,
  }}>
    <div style={{ background: "#fff", borderRadius: 12, padding: 24, width: 400 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>进入下一步</h3>
      <p style={{ fontSize: 14, color: C.textSecondary, marginBottom: 20 }}>
        所有单元展品已确认，是否进入下一步审核策展文本？
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
        <Btn variant="ghost" onClick={onClose}>取消</Btn>
        <Btn onClick={onConfirm}>确认进入</Btn>
      </div>
    </div>
  </div>
);

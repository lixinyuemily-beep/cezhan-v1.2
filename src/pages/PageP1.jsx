import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Btn, Divider } from '../components/ui';
import { generateCurationOutline } from '../api/curationApi';
import { api } from '../api/client';

const RHYTHM_STAGE_LABELS = ['开场', '铺垫', '转折', '深入', '高潮', '余韵'];
const RHYTHM_PRESETS = [
  { key: 'steady', label: '平稳铺陈', points: [56, 52, 48, 54, 60, 58] },
  { key: 'rise', label: '渐进抬升', points: [38, 44, 50, 60, 72, 78] },
  { key: 'dramatic', label: '跌宕起伏', points: [62, 40, 70, 34, 82, 58] },
  { key: 'release', label: '先抑后扬', points: [34, 28, 24, 42, 76, 66] },
];

const RHYTHM_WIDTH = 360;
const RHYTHM_HEIGHT = 232;
const RHYTHM_PADDING_X = 22;
const RHYTHM_PADDING_Y = 18;
const RHYTHM_BASELINE = 50;
const UNIT_COUNT_MIN = 2;
const ITEMS_PER_UNIT_MIN = 2;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const getSliderFillPercentage = (value, min, max) => (max <= min ? 100 : ((value - min) / (max - min)) * 100);

function buildRhythmPath(points) {
  const stepX = (RHYTHM_WIDTH - RHYTHM_PADDING_X * 2) / (points.length - 1);
  const coords = points.map((value, index) => {
    const x = RHYTHM_PADDING_X + stepX * index;
    const y = RHYTHM_HEIGHT - RHYTHM_PADDING_Y - (value / 100) * (RHYTHM_HEIGHT - RHYTHM_PADDING_Y * 2);
    return { x, y };
  });

  let path = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i += 1) {
    const current = coords[i];
    const next = coords[i + 1];
    const controlX = (current.x + next.x) / 2;
    path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
  }

  return { path, coords };
}

function getRhythmSummary(points) {
  const peak = Math.max(...points);
  const valley = Math.min(...points);
  const peakIndex = points.indexOf(peak);
  const start = points[0];
  const end = points[points.length - 1];
  const amplitude = peak - valley;

  const trendText = end > start + 12 ? '整体情绪逐步抬升' : end < start - 12 ? '整体由强转缓' : '整体节奏较为均衡';
  const peakText = peakIndex >= 4 ? '高潮靠后，适合层层递进' : peakIndex <= 2 ? '前段较早出现亮点' : '中段转折清晰';
  const amplitudeText = amplitude > 38 ? '起伏明显，观众感受更具戏剧性' : amplitude > 22 ? '有清楚的强弱变化' : '变化克制，偏学术叙述';

  return `${trendText}，${peakText}，${amplitudeText}。`;
}

function RhythmDesigner({ C, value, onChange }) {
  const [dragIndex, setDragIndex] = useState(null);
  const enabled = value?.enabled !== false;
  const points = value?.points || RHYTHM_PRESETS[0].points;
  const presetKey = value?.presetKey || RHYTHM_PRESETS[0].key;
  const currentPreset = RHYTHM_PRESETS.find((preset) => preset.key === presetKey);
  const modeLabel = presetKey === 'custom' ? '自定义曲线' : `当前模板：${currentPreset?.label || '平稳铺陈'}`;

  useEffect(() => {
    if (!enabled) return undefined;
    if (dragIndex === null) return undefined;

    const handleMouseMove = (event) => {
      const svg = document.getElementById('narrative-rhythm-board');
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const relativeY = clamp(event.clientY - rect.top, RHYTHM_PADDING_Y, rect.height - RHYTHM_PADDING_Y);
      const normalized = Math.round(((rect.height - RHYTHM_PADDING_Y - relativeY) / (rect.height - RHYTHM_PADDING_Y * 2)) * 100);
      const nextPoints = points.map((point, index) => (index === dragIndex ? clamp(normalized, 8, 92) : point));
      onChange({
        enabled: true,
        presetKey: 'custom',
        points: nextPoints,
        stages: [...RHYTHM_STAGE_LABELS],
        summary: getRhythmSummary(nextPoints),
      });
    };

    const handleMouseUp = () => setDragIndex(null);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragIndex, enabled, onChange, points]);

  const { path, coords } = buildRhythmPath(points);
  const summary = getRhythmSummary(points);
  const baselineY = RHYTHM_HEIGHT - RHYTHM_PADDING_Y - (RHYTHM_BASELINE / 100) * (RHYTHM_HEIGHT - RHYTHM_PADDING_Y * 2);

  return (
    <div style={{
      background: C.bgSecondary,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: 16,
      boxShadow: `0 8px 20px ${C.accentPrimary}10`,
      display: 'flex',
      flexDirection: 'column',
      opacity: enabled ? 1 : 0.82,
    }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>叙事节奏</div>
          <button
            type="button"
            aria-pressed={enabled}
            onClick={() => onChange({
              enabled: !enabled,
              presetKey,
              points: [...points],
              stages: [...RHYTHM_STAGE_LABELS],
              summary,
            })}
            style={{
              width: 42,
              height: 22,
              border: `1px solid ${enabled ? C.accentPrimary : C.border}`,
              background: enabled ? C.accentPrimary : C.stepInactive,
              borderRadius: 999,
              padding: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: enabled ? 'flex-end' : 'flex-start',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'all .18s ease',
              boxShadow: enabled ? `0 6px 14px ${C.accentPrimary}22` : 'none',
            }}
          >
            <span style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#fff',
              display: 'block',
              boxShadow: '0 2px 6px rgba(0,0,0,.18)',
            }} />
          </button>
        </div>
        <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 6, lineHeight: 1.5 }}>
          拖动节点，定义展览从铺垫、转折到高潮的情绪推进；关闭后由 AI 自主组织节奏。
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        marginTop: 14,
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.textPrimary }}>节奏模板</span>
        <span style={{
          border: `1px solid ${presetKey === 'custom' ? C.accentSecondary : C.border}`,
          background: presetKey === 'custom' ? `${C.accentSecondary}12` : C.bgSecondary,
          color: presetKey === 'custom' ? C.accentSecondary : C.textSecondary,
          borderRadius: 999,
          padding: '5px 10px',
          fontSize: 11,
          fontWeight: 700,
          whiteSpace: 'nowrap',
          opacity: enabled ? 1 : 0.55,
        }}>
          {modeLabel}
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: 6,
        marginTop: 10,
      }}>
        {RHYTHM_PRESETS.map((preset) => {
          const active = preset.key === presetKey;
          return (
            <button
              key={preset.key}
              type="button"
              disabled={!enabled}
              onClick={() => {
                onChange({
                  enabled: true,
                  presetKey: preset.key,
                  points: [...preset.points],
                  stages: [...RHYTHM_STAGE_LABELS],
                  summary: getRhythmSummary(preset.points),
                });
              }}
              style={{
                border: `1px solid ${active ? C.accentPrimary : C.border}`,
                background: active ? `${C.accentPrimary}12` : C.bgSecondary,
                color: active ? C.accentPrimary : C.textSecondary,
                borderRadius: 10,
                padding: '7px 6px',
                fontSize: 11,
                fontWeight: active ? 700 : 500,
                cursor: enabled ? 'pointer' : 'not-allowed',
                opacity: enabled ? 1 : 0.5,
                minHeight: 32,
                whiteSpace: 'nowrap',
              }}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <div style={{
        marginTop: 16,
        borderRadius: 10,
        overflow: 'hidden',
        background: enabled
          ? 'linear-gradient(180deg, rgba(43,95,142,0.05) 0%, rgba(200,135,58,0.06) 100%)'
          : 'linear-gradient(180deg, rgba(120,120,120,0.04) 0%, rgba(120,120,120,0.08) 100%)',
        border: `1px solid ${C.border}`,
      }}>
        <svg
          id="narrative-rhythm-board"
          viewBox={`0 0 ${RHYTHM_WIDTH} ${RHYTHM_HEIGHT}`}
          style={{ width: '100%', height: 230, display: 'block', userSelect: 'none' }}
        >
          <text
            x={RHYTHM_PADDING_X}
            y={RHYTHM_PADDING_Y - 2}
            style={{ fontSize: 10, fill: C.textSecondary, letterSpacing: '0.08em' }}
          >
            张力
          </text>

          {[25, 50, 75].map((line) => {
            const y = RHYTHM_HEIGHT - RHYTHM_PADDING_Y - (line / 100) * (RHYTHM_HEIGHT - RHYTHM_PADDING_Y * 2);
            return (
              <line
                key={line}
                x1={RHYTHM_PADDING_X}
                x2={RHYTHM_WIDTH - RHYTHM_PADDING_X}
                y1={y}
                y2={y}
                stroke={C.border}
                strokeDasharray="4 6"
                strokeWidth="1"
              />
            );
          })}

          <line
            x1={RHYTHM_PADDING_X}
            x2={RHYTHM_WIDTH - RHYTHM_PADDING_X}
            y1={baselineY}
            y2={baselineY}
            stroke={C.accentSecondary}
            strokeDasharray="8 6"
            strokeWidth="2"
            opacity={enabled ? 0.85 : 0.45}
          />
          <rect
            x={RHYTHM_WIDTH - RHYTHM_PADDING_X - 76}
            y={baselineY - 18}
            width="74"
            height="16"
            rx="8"
            fill={enabled ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.72)'}
            stroke={`${C.accentSecondary}55`}
          />
          <text
            x={RHYTHM_WIDTH - RHYTHM_PADDING_X - 39}
            y={baselineY - 6}
            textAnchor="middle"
            style={{ fontSize: 9, fill: C.accentSecondary, fontWeight: 700, pointerEvents: 'none' }}
          >
            基线 50
          </text>

          {coords.map((coord, index) => (
            <line
              key={RHYTHM_STAGE_LABELS[index]}
              x1={coord.x}
              x2={coord.x}
              y1={RHYTHM_PADDING_Y}
              y2={RHYTHM_HEIGHT - RHYTHM_PADDING_Y}
              stroke={`${C.border}`}
              strokeWidth="1"
              opacity="0.6"
            />
          ))}

          <path
            d={`${path} L ${coords[coords.length - 1].x} ${RHYTHM_HEIGHT - RHYTHM_PADDING_Y} L ${coords[0].x} ${RHYTHM_HEIGHT - RHYTHM_PADDING_Y} Z`}
            fill="url(#rhythmFill)"
            opacity={enabled ? 0.9 : 0.28}
          />
          <path
            d={path}
            fill="none"
            stroke={enabled ? C.accentPrimary : C.textSecondary}
            strokeWidth="3"
            strokeLinecap="round"
            opacity={enabled ? 1 : 0.45}
          />
          <defs>
            <linearGradient id="rhythmFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={C.accentPrimary} stopOpacity="0.18" />
              <stop offset="100%" stopColor={C.accentSecondary} stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {coords.map((coord, index) => {
            const isActive = dragIndex === index;
            return (
              <g key={`node-${RHYTHM_STAGE_LABELS[index]}`} style={{ cursor: enabled ? 'ns-resize' : 'not-allowed' }}>
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r={isActive ? 11 : 9}
                  fill="#fff"
                  stroke={enabled ? (isActive ? C.accentSecondary : C.accentPrimary) : C.textSecondary}
                  strokeWidth="3"
                  opacity={enabled ? 1 : 0.55}
                  onMouseDown={() => enabled && setDragIndex(index)}
                />
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r="4"
                  fill={enabled ? (isActive ? C.accentSecondary : C.accentPrimary) : C.textSecondary}
                  opacity={enabled ? 1 : 0.55}
                  onMouseDown={() => enabled && setDragIndex(index)}
                />
                <rect
                  x={coord.x - 24}
                  y={RHYTHM_HEIGHT - 34}
                  width="48"
                  height="18"
                  rx="9"
                  fill={isActive ? `${C.accentSecondary}22` : 'rgba(255,255,255,0.86)'}
                  stroke={isActive ? `${C.accentSecondary}55` : `${C.border}`}
                />
                <text
                  x={coord.x}
                  y={RHYTHM_HEIGHT - 21}
                  textAnchor="middle"
                  style={{ fontSize: 10, fill: C.textSecondary, pointerEvents: 'none' }}
                >
                  {RHYTHM_STAGE_LABELS[index]}
                </text>
              </g>
            );
          })}

          <text
            x={RHYTHM_WIDTH / 2}
            y={RHYTHM_HEIGHT - 4}
            textAnchor="middle"
            style={{ fontSize: 10, fill: C.textSecondary, letterSpacing: '0.08em' }}
          >
            叙事阶段
          </text>
        </svg>
      </div>

      <div style={{
        marginTop: 14,
        padding: '12px 14px',
        background: '#F8F8F7',
        border: `1px solid ${C.border}`,
        borderRadius: 10,
      }}>
        <div style={{ fontSize: 12, color: C.accentPrimary, fontWeight: 700, marginBottom: 4 }}>节奏解读</div>
        <div style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.6 }}>
          {enabled
            ? `${summary} 高于基线代表叙事更紧张、更聚焦；低于基线代表叙事更舒缓、更沉淀。`
            : '当前已关闭叙事节奏控制，AI 将根据展品信息和策展意图自主组织叙事推进。'}
        </div>
        <div style={{ fontSize: 11, color: C.textPlaceholder, lineHeight: 1.6, marginTop: 8 }}>
          {enabled
            ? '将直接影响叙事方案、单元结构、序言、单元文案与尾声；展品推荐主要受单元主题间接影响。'
            : '关闭后不会向 AI 传递节奏曲线，生成结果不再受这组节点约束。'}
        </div>
      </div>
    </div>
  );
}

export const PageP1 = ({ 
  navigateTo,
  setUploaded,
  setShowAdvanced,
  uploaded,
  showAdvanced,
  createNewProject,
  setCurrentProject,
  exhibitTitle,
  setExhibitTitle,
  uploadedFile,
  setUploadedFile,
  uploadedExhibits,
  setUploadedExhibits,
  additionalIntent,
  setAdditionalIntent,
  advancedSettings,
  setAdvancedSettings,
  buildLLMParams,
  goToStep,
  setCurrentStep,
  setCurrentPage,
  saveAIGeneratedData,
  setProjects,
  setUnits,
  setTextSections,
  setSelectedNarrative,
  narrativeRhythm,
  setNarrativeRhythm,
  showToast,
  theme,
}) => {
  const C = theme;
  const fileInputRef = useRef(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [parseError, setParseError] = useState(null);
  const [knowledgeExhibits, setKnowledgeExhibits] = useState([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [knowledgeSearch, setKnowledgeSearch] = useState('');
  const [selectedFromKnowledge, setSelectedFromKnowledge] = useState([]);
  const [advancedCardAnchorHeight, setAdvancedCardAnchorHeight] = useState(0);
  const unitCountMax = Math.max(UNIT_COUNT_MIN, Number(advancedSettings.unitCountMax ?? 6));
  const itemsPerUnitMax = Math.max(ITEMS_PER_UNIT_MIN, Number(advancedSettings.itemsPerUnitMax ?? 20));
  const advancedCardRef = useRef(null);

  useEffect(() => {
    const loadKnowledgeExhibits = async () => {
      try {
        const exhibits = await api.exhibits.getAll();
        setKnowledgeExhibits(exhibits);
      } catch (error) {
        console.error('加载知识库展品失败:', error);
      }
    };
    loadKnowledgeExhibits();
  }, []);

  useEffect(() => {
    if (showAdvanced && advancedCardRef.current) {
      setAdvancedCardAnchorHeight(advancedCardRef.current.offsetHeight);
    }
  }, [showAdvanced, advancedSettings]);

  const filteredKnowledgeExhibits = knowledgeSearch
    ? knowledgeExhibits.filter(ex => 
        (ex.name && ex.name.includes(knowledgeSearch)) || 
        (ex.era && ex.era.includes(knowledgeSearch))
      )
    : knowledgeExhibits;

  const handleSelectFromKnowledge = (exhibit) => {
    if (!selectedFromKnowledge.find(e => e.id === exhibit.id)) {
      setSelectedFromKnowledge([...selectedFromKnowledge, exhibit]);
      setUploadedExhibits([...uploadedExhibits, exhibit]);
      setUploaded(true);
    }
  };

  const handleRemoveFromKnowledge = (exhibitId) => {
    setSelectedFromKnowledge(selectedFromKnowledge.filter(e => e.id !== exhibitId));
    setUploadedExhibits(uploadedExhibits.filter(e => e.id !== exhibitId));
    if (uploadedExhibits.length <= 1) {
      setUploaded(false);
    }
  };

  const parseExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const isCSV = file.name.toLowerCase().endsWith('.csv');
      
      if (isCSV) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const text = e.target.result;
            const workbook = XLSX.read(text, { type: 'string' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (jsonData.length < 2) {
              reject(new Error('文件内容为空或格式不正确'));
              return;
            }
            
            const headers = jsonData[0];
            const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== null && cell !== ''));
            
            const exhibits = rows.map((row, index) => {
              const obj = {};
              headers.forEach((header, i) => {
                obj[header] = row[i];
              });
              obj._rowIndex = index;
              return obj;
            });
            
            resolve({ headers, exhibits, total: exhibits.length });
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsText(file, 'utf-8');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length < 2) {
            reject(new Error('文件内容为空或格式不正确'));
            return;
          }
          
          const headers = jsonData[0];
          const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== null && cell !== ''));
          
          const exhibits = rows.map((row, index) => {
            const obj = {};
            headers.forEach((header, i) => {
              obj[header] = row[i];
            });
            obj._rowIndex = index;
            return obj;
          });
          
          resolve({ headers, exhibits, total: exhibits.length });
        } catch (err) {
          reject(err);
        }
      };
      
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isValid) {
      setParseError('请上传 Excel (.xlsx, .xls) 或 CSV 格式的文件');
      return;
    }

    setIsParsing(true);
    setParseError(null);

    try {
      const result = await parseExcelFile(file);
      
      setUploadedFile(file);
      setUploadedExhibits(result.exhibits);
      setUploaded(true);
    } catch (err) {
      setParseError(err.message || '文件解析失败');
      setUploaded(false);
      setUploadedFile(null);
      setUploadedExhibits([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleReupload = () => {
    setUploaded(false);
    setUploadedFile(null);
    setUploadedExhibits([]);
    setParseError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleStartGeneration = async () => {
    if (!uploaded || !uploadedExhibits.length) return;

    setIsGenerating(true);
    
    try {
      const llmParams = buildLLMParams();
      
      const result = await generateCurationOutline(llmParams);
      
      if (result.success) {
        await saveAIGeneratedData(null, result, llmParams);
        showToast('策展大纲生成成功！请选择叙事方向', 'success');
        navigateTo('step1');
      } else {
        showToast(result.error || '生成失败，请重试', 'error');
      }
    } catch (error) {
      console.error('生成失败:', error);
      showToast('生成失败，请重试', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAdvancedChange = (key, value) => {
    setAdvancedSettings(prev => {
      const next = { ...prev, [key]: value };
      const nextUnitCountMax = Math.max(UNIT_COUNT_MIN, Number(next.unitCountMax ?? 6));
      const nextItemsPerUnitMax = Math.max(ITEMS_PER_UNIT_MIN, Number(next.itemsPerUnitMax ?? 20));

      return {
        ...next,
        unitCountMax: nextUnitCountMax,
        itemsPerUnitMax: nextItemsPerUnitMax,
        unitCount: clamp(Number(next.unitCount ?? 3), UNIT_COUNT_MIN, nextUnitCountMax),
        itemsPerUnit: clamp(Number(next.itemsPerUnit ?? 10), ITEMS_PER_UNIT_MIN, nextItemsPerUnitMax),
        temperature: clamp(Number(next.temperature ?? 0.9), 0.1, 1.0),
      };
    });
  };

  return (
    <main style={{ padding: "28px 36px", maxWidth: 1200 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: C.textPrimary, fontFamily: "'Noto Serif SC', serif" }}>
        开始新策展
      </h1>
      <p style={{ color: C.textSecondary, fontSize: 14, marginTop: 6, marginBottom: 24 }}>
        告诉我们这次展览的基本信息，AI 将据此生成策展大纲
      </p>
      <Divider />

      <div style={{ display: "flex", gap: 40, marginTop: 24, alignItems: "stretch" }}>
        <div style={{ flex: 3, display: "flex", flexDirection: "column" }}>
          <label style={{ display: "block", fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
            展览题目（可选）
          </label>
          <input 
            placeholder="留空则由 AI 根据展品内容自动生成题目"
            value={exhibitTitle}
            onChange={(e) => setExhibitTitle(e.target.value)}
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 6,
              border: `1px solid ${C.border}`, fontSize: 14, fontFamily: "'Noto Sans SC', sans-serif",
              outline: "none", boxSizing: "border-box", background: "#fff",
            }} 
          />

          <label style={{ display: "block", fontWeight: 700, fontSize: 13, marginTop: 20, marginBottom: 8 }}>
            展品清单上传（必填）
          </label>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          
          {!uploaded ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${C.border}`, borderRadius: 8, padding: "40px 20px",
                textAlign: "center", cursor: "pointer", background: "#fafaf9",
                transition: "border-color 0.2s",
              }}
            >
              {isParsing ? (
                <>
                  <div style={{ fontSize: 32, marginBottom: 8, color: C.accentPrimary }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spin">
                      <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
                    </svg>
                  </div>
                  <div style={{ fontWeight: 600, color: C.textPrimary, marginBottom: 4 }}>
                    正在解析文件...
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 32, marginBottom: 8, color: C.textSecondary }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
                    </svg>
                  </div>
                  <div style={{ fontWeight: 600, color: C.textPrimary, marginBottom: 4 }}>
                    拖拽文件到此或点击选择
                  </div>
                  <div style={{ color: C.textSecondary, fontSize: 13 }}>支持 Excel (.xlsx, .xls) 或 CSV 格式</div>
                  <div style={{ marginTop: 12 }}>
                    <Btn small variant="ghost" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>选择文件</Btn>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={{
              background: "#F0FDF4", border: `1px solid ${C.success}`, borderRadius: 8, padding: "16px 20px",
            }}>
              <div style={{ fontWeight: 700, color: C.success, fontSize: 14, marginBottom: 8 }}>
                ✓ 已上传：{uploadedExhibits.length} 件展品
              </div>
              <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 4 }}>
                文件名：{uploadedFile?.name}
              </div>
              <div style={{ marginTop: 8, display: "flex", gap: 12 }}>
                <span 
                  style={{ color: C.accentPrimary, cursor: "pointer", fontSize: 13 }}
                  onClick={() => setShowPreviewModal(true)}
                >
                  [查看清单]
                </span>
                <span 
                  style={{ color: C.accentPrimary, cursor: "pointer", fontSize: 13 }}
                  onClick={handleReupload}
                >
                  [重新上传]
                </span>
              </div>
            </div>
          )}

          {parseError && (
            <div style={{
              marginTop: 8, padding: "10px 14px", background: "#FEF2F2",
              border: `1px solid ${C.danger}`, borderRadius: 6, fontSize: 13, color: C.danger,
            }}>
              ⚠️ {parseError}
            </div>
          )}

          <div
            style={{
              marginTop: "auto",
              paddingTop: 16,
              minHeight: !showAdvanced && advancedCardAnchorHeight ? advancedCardAnchorHeight : undefined,
            }}
          >
            <div
              ref={advancedCardRef}
              style={{
              background: C.bgSecondary,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              boxShadow: `0 8px 20px ${C.accentPrimary}10`,
              overflow: "hidden",
            }}
            >
              <div
                onClick={() => setShowAdvanced(!showAdvanced)}
                style={{
                  padding: "14px 16px",
                  background: C.bgSecondary,
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = C.hoverBg}
                onMouseLeave={(e) => e.currentTarget.style.background = C.bgSecondary}
              >
                <span style={{ fontSize: 13, color: C.textPrimary, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                  生成参数（高级设置）
                </span>
                <span style={{ 
                  color: C.textSecondary,
                  transition: "transform 0.2s ease",
                  transform: showAdvanced ? "rotate(180deg)" : "rotate(0deg)"
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </span>
              </div>
              <div style={{ 
                overflow: "hidden",
                maxHeight: showAdvanced ? "560px" : "0",
                opacity: showAdvanced ? 1 : 0,
                transition: "all 0.3s ease",
                borderTop: showAdvanced ? `1px solid ${C.border}` : "none",
              }}>
                <div style={{ padding: "16px" }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 13, color: C.textPrimary }}>展览单元数量</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ 
                      fontSize: 14, fontWeight: 700, color: C.accentPrimary,
                      background: C.accentPrimary + "15", padding: "2px 10px", borderRadius: 12
                    }}>{advancedSettings.unitCount} 个</span>
                    <label style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 10px",
                      borderRadius: 999,
                      border: `1px solid ${C.accentPrimary}24`,
                      background: `${C.accentPrimary}12`,
                      color: C.accentPrimary,
                      fontSize: 12,
                      fontWeight: 600,
                    }}>
                      <span>上限</span>
                      <input
                        type="number"
                        min={UNIT_COUNT_MIN}
                        value={unitCountMax}
                        onChange={(e) => handleAdvancedChange('unitCountMax', parseInt(e.target.value || `${UNIT_COUNT_MIN}`, 10))}
                        style={{
                          width: 32,
                          padding: 0,
                          border: "none",
                          fontSize: 12,
                          fontWeight: 700,
                          color: C.accentPrimary,
                          background: "transparent",
                          outline: "none",
                          textAlign: "center",
                          MozAppearance: "textfield",
                        }}
                      />
                    </label>
                  </div>
                </div>
                <input 
                  type="range" 
                  min={UNIT_COUNT_MIN} 
                  max={unitCountMax} 
                  value={advancedSettings.unitCount}
                  onChange={(e) => handleAdvancedChange('unitCount', parseInt(e.target.value))}
                  style={{ 
                    width: "100%", 
                    accentColor: C.accentPrimary,
                    cursor: "pointer",
                    height: 6,
                    borderRadius: 3,
                    background: `linear-gradient(to right, ${C.accentPrimary} 0%, ${C.accentPrimary} ${getSliderFillPercentage(advancedSettings.unitCount, UNIT_COUNT_MIN, unitCountMax)}%, ${C.sliderTrack || C.border} ${getSliderFillPercentage(advancedSettings.unitCount, UNIT_COUNT_MIN, unitCountMax)}%, ${C.sliderTrack || C.border} 100%)`,
                  }} 
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.textSecondary, marginTop: 4 }}>
                  <span>{UNIT_COUNT_MIN}</span><span>{unitCountMax}</span>
                </div>
              </div>
              
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 13, color: C.textPrimary }}>每单元展品数</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ 
                      fontSize: 14, fontWeight: 700, color: C.accentPrimary,
                      background: C.accentPrimary + "15", padding: "2px 10px", borderRadius: 12
                    }}>{advancedSettings.itemsPerUnit} 件</span>
                    <label style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 10px",
                      borderRadius: 999,
                      border: `1px solid ${C.accentPrimary}24`,
                      background: `${C.accentPrimary}12`,
                      color: C.accentPrimary,
                      fontSize: 12,
                      fontWeight: 600,
                    }}>
                      <span>上限</span>
                      <input
                        type="number"
                        min={ITEMS_PER_UNIT_MIN}
                        value={itemsPerUnitMax}
                        onChange={(e) => handleAdvancedChange('itemsPerUnitMax', parseInt(e.target.value || `${ITEMS_PER_UNIT_MIN}`, 10))}
                        style={{
                          width: 32,
                          padding: 0,
                          border: "none",
                          fontSize: 12,
                          fontWeight: 700,
                          color: C.accentPrimary,
                          background: "transparent",
                          outline: "none",
                          textAlign: "center",
                          MozAppearance: "textfield",
                        }}
                      />
                    </label>
                  </div>
                </div>
                <input 
                  type="range" 
                  min={ITEMS_PER_UNIT_MIN} 
                  max={itemsPerUnitMax} 
                  value={advancedSettings.itemsPerUnit}
                  onChange={(e) => handleAdvancedChange('itemsPerUnit', parseInt(e.target.value))}
                  style={{ 
                    width: "100%", 
                    accentColor: C.accentPrimary,
                    cursor: "pointer",
                    height: 6,
                    borderRadius: 3,
                    background: `linear-gradient(to right, ${C.accentPrimary} 0%, ${C.accentPrimary} ${getSliderFillPercentage(advancedSettings.itemsPerUnit, ITEMS_PER_UNIT_MIN, itemsPerUnitMax)}%, ${C.sliderTrack || C.border} ${getSliderFillPercentage(advancedSettings.itemsPerUnit, ITEMS_PER_UNIT_MIN, itemsPerUnitMax)}%, ${C.sliderTrack || C.border} 100%)`,
                  }} 
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.textSecondary, marginTop: 4 }}>
                  <span>{ITEMS_PER_UNIT_MIN}</span><span>{itemsPerUnitMax}</span>
                </div>
              </div>
              
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 13, color: C.textPrimary }}>AI 创意程度</span>
                  <span style={{ 
                    fontSize: 14, fontWeight: 700, color: C.accentPrimary,
                    background: C.accentPrimary + "15", padding: "2px 10px", borderRadius: 12
                  }}>{(advancedSettings.temperature ?? 0.9).toFixed(1)} 
                    <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 4 }}>
                      ({(advancedSettings.temperature ?? 0.9) < 0.5 ? "保守" : (advancedSettings.temperature ?? 0.9) > 0.8 ? "创意" : "平衡"})
                    </span>
                  </span>
                </div>
                <input 
                  type="range" 
                  min={0.1} 
                  max={1.0} 
                  step={0.1}
                  value={advancedSettings.temperature ?? 0.9}
                  onChange={(e) => handleAdvancedChange('temperature', parseFloat(e.target.value))}
                  style={{ 
                    width: "100%", 
                    accentColor: C.accentPrimary,
                    cursor: "pointer",
                    height: 6,
                    borderRadius: 3,
                    background: `linear-gradient(to right, ${C.accentPrimary} 0%, ${C.accentPrimary} ${((advancedSettings.temperature - 0.1) / 0.9) * 100}%, ${C.sliderTrack || C.border} ${((advancedSettings.temperature - 0.1) / 0.9) * 100}%, ${C.sliderTrack || C.border} 100%)`,
                  }} 
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.textSecondary, marginTop: 4 }}>
                  <span>保守</span>
                  <span>平衡</span>
                  <span>创意</span>
                </div>
              </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ flex: 2, display: "flex", flexDirection: "column" }}>
          <div>
            <label style={{ display: "block", fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
              补充策展意图（可选）
            </label>
            <textarea
              placeholder="用自然语言描述您的策展思路、希望强调的重点、希望规避的内容等……

例如：希望以时间为主线，重点突出清代文物。"
              rows={8}
              value={additionalIntent}
              onChange={(e) => setAdditionalIntent(e.target.value)}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 6, resize: "vertical",
                border: `1px solid ${C.border}`, fontSize: 13, fontFamily: "'Noto Sans SC', sans-serif",
                outline: "none", boxSizing: "border-box", background: "#fff", color: C.textPrimary,
              }} 
            />
            <div style={{ color: C.textSecondary, fontSize: 11, textAlign: "right", marginTop: 4 }}>
              {additionalIntent.length} / 500
            </div>
          </div>
          <div style={{ marginTop: "auto", paddingTop: 16 }}>
            <RhythmDesigner
              C={C}
              value={narrativeRhythm}
              onChange={setNarrativeRhythm}
            />
          </div>
        </div>
      </div>

      <div style={{
        marginTop: 28, background: "#F3F3F1", borderRadius: 6, padding: "12px 16px",
        display: "flex", flexDirection: "column", gap: 6,
      }}>
        <div style={{ fontSize: 12, color: C.textSecondary, display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          当前展品库：{uploadedExhibits.length > 0 ? `已上传 ${uploadedExhibits.length} 件展品` : '暂未上传展品'}
        </div>
        <div style={{ fontSize: 12, color: C.textSecondary, display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          AI 生成内容基于上述数据，冷门或高度专业领域可能生成质量有限，建议上传展品后查看推荐置信度
        </div>
      </div>

      <div style={{ marginTop: 28 }}>
        <Btn 
          disabled={!uploaded || !uploadedExhibits.length || isGenerating} 
          onClick={handleStartGeneration}
        >
          {isGenerating ? '正在生成中...' : '开始生成策展大纲 →'}
        </Btn>
        
        {isGenerating && (
          <div style={{ 
            position: "fixed", inset: 0, background: "rgba(255,255,255,.9)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            zIndex: 300
          }}>
            <div style={{ 
              width: 48, 
              height: 48, 
              border: `4px solid ${C.border}`, 
              borderTopColor: C.accentPrimary,
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite'
            }} />
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
            <div style={{ color: C.textPrimary, fontSize: 15, fontWeight: 600, marginTop: 20 }}>
              正在调用 AI 生成策展大纲...
            </div>
            <div style={{ color: C.textSecondary, fontSize: 13, marginTop: 8 }}>
              这可能需要几秒钟时间
            </div>
          </div>
        )}
      </div>

      {showPreviewModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 400,
        }}>
          <div style={{ background: C.bgSecondary, borderRadius: 12, padding: 24, width: 700, maxHeight: "80vh", overflow: "auto" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: C.textPrimary }}>展品清单</h3>
            <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 16 }}>
              共解析到 <span style={{ color: C.accentPrimary, fontWeight: 700 }}>{uploadedExhibits.length}</span> 件展品
            </div>
            <div style={{ maxHeight: 400, overflow: "auto", border: `1px solid ${C.border}`, borderRadius: 8 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: C.bgPrimary, borderBottom: `1px solid ${C.border}` }}>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: C.textSecondary, fontWeight: 600 }}>序号</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: C.textSecondary, fontWeight: 600 }}>名称</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: C.textSecondary, fontWeight: 600 }}>年代</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: C.textSecondary, fontWeight: 600 }}>材质</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: C.textSecondary, fontWeight: 600 }}>尺寸</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadedExhibits.slice(0, 20).map((ex, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: "10px 12px", color: C.textSecondary }}>{i + 1}</td>
                      <td style={{ padding: "10px 12px", color: C.textPrimary, fontWeight: 600 }}>{ex.名称 || ex.name || ex.品名 || '-'}</td>
                      <td style={{ padding: "10px 12px", color: C.textPrimary }}>{ex.年代 || ex.era || '-'}</td>
                      <td style={{ padding: "10px 12px", color: C.textPrimary }}>{ex.材质 || ex.material || '-'}</td>
                      <td style={{ padding: "10px 12px", color: C.textSecondary, fontSize: 12 }}>{ex.尺寸 || ex.size || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {uploadedExhibits.length > 20 && (
                <div style={{ padding: 12, textAlign: "center", color: C.textSecondary, fontSize: 12, background: C.bgPrimary }}>
                  ... 还有 {uploadedExhibits.length - 20} 件展品
                </div>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
              <Btn onClick={() => setShowPreviewModal(false)}>关闭</Btn>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

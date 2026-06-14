import { api } from './client';

export async function generateCurationOutline(params) {
  if (!params || !params.exhibits || params.exhibits.length === 0) {
    return {
      success: false,
      error: "请先上传展品清单",
    };
  }

  try {
    const exhibitInfo = params.exhibits
      .slice(0, 20)
      .map(ex => `${ex.name || '未知'} (${ex.era || ''} ${ex.material || ''})`)
      .join('、');

    const result = await api.ai.generateNarrative({
      theme: params.exhibition_title || "策展主题",
      exhibit_count: params.exhibits.length,
      exhibit_info: exhibitInfo,
      additional_intent: params.additional_intent || "",
      narrative_rhythm: params.narrative_rhythm || null,
      unit_count: params.advanced_settings?.unitCount || 3,
      temperature: params.advanced_settings?.temperature || 0.9,
    });

    const options = (result.options || []).map((opt, i) => ({
      label: `方案 ${String.fromCharCode(65 + i)}`,
      title: opt.title || "",
      logic: opt.desc || "",
    }));

    return {
      success: true,
      data: {
        narrative: options[0] || { title: "默认方案", logic: "" },
        narrativeOptions: options,
        units: [],
        textSections: [],
        exhibitRecommendations: [],
      },
    };
  } catch (error) {
    console.error("=== API 调用失败 ===", error);
    return {
      success: false,
      error: error.message || "生成失败",
    };
  }
}

export async function recommendExhibitsToUnits(units, exhibits, narrative) {
  if (!units || units.length === 0 || !exhibits || exhibits.length === 0) {
    return {
      success: false,
      error: "参数不完整",
    };
  }

  try {
    const allRecommendations = {};

    const exhibitsPerUnit = Math.ceil(exhibits.length / units.length);
    let exhibitIndex = 0;

    for (const unit of units) {
      const unitExhibits = [];
      for (let i = 0; i < exhibitsPerUnit && exhibitIndex < exhibits.length; i++) {
        const ex = exhibits[exhibitIndex];
        unitExhibits.push({
          name: ex.name || ex.名称 || '',
          era: ex.era || ex.年代 || '',
          mat: ex.material || ex.材质 || '',
          sz: ex.size || ex.尺寸 || '',
          id: ex.编号 || ex.id || '',
          stars: 5,
          ctx: "用户上传",
          src: "用户上传",
          kept: true,
        });
        exhibitIndex++;
      }
      allRecommendations[unit.id] = unitExhibits;
    }

    return {
      success: true,
      data: {
        exhibitRecommendations: allRecommendations,
      },
    };
  } catch (error) {
    console.error("=== 展品分配失败 ===", error);
    return {
      success: false,
      error: error.message || "分配失败",
    };
  }
}

export async function generateUnitStructure(params) {
  if (!params || params.selectedNarrative === undefined || params.selectedNarrative === null || !params.exhibits) {
    return {
      success: false,
      error: "参数不完整",
    };
  }

  try {
    const narrative = params.narrativeOptions?.[params.selectedNarrative] || { title: "", desc: "" };

    const exhibitList = params.exhibits.map(ex => ({
      name: ex.name,
      era: ex.era,
      material: ex.material,
      size: ex.size,
    }));

    const result = await api.ai.generateUnits({
      narrative: narrative,
      exhibit_count: params.exhibits.length,
      unit_count: params.advanced_settings?.unitCount || 3,
      exhibit_list: exhibitList,
      narrative_rhythm: params.narrative_rhythm || null,
    });

    const units = (result.units || []).map((u, i) => ({
      id: i,
      tag: u.tag || `第${i + 1}单元`,
      tagColor: "#2B5F8E",
      title: u.title || `单元 ${i + 1}`,
      desc: u.description || "",
      items: params.advanced_settings?.itemsPerUnit || 10,
    }));

    return {
      success: true,
      data: {
        units,
      },
    };
  } catch (error) {
    console.error("=== 单元生成失败 ===", error);
    return {
      success: false,
      error: error.message || "生成失败",
    };
  }
}

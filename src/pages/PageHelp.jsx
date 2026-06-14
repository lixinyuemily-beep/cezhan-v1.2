import React from 'react';
import { Divider } from '../components/ui';

const helpContent = [
  {
    title: '开始新策展',
    content: `点击左侧菜单的"新建策展"，上传展品Excel文件，AI会自动生成策展大纲。您可以选择或自定义叙事方案，然后进入后续编辑步骤。`
  },
  {
    title: '我的项目',
    content: `显示所有正在进行的策展项目。点击"继续编辑"可从上次离开的步骤继续工作。点击项目卡片可查看详情。`
  },
  {
    title: 'Step 1 - 叙事方案',
    content: `选择AI生成的叙事方案，或点击"自定义"输入您自己的策展思路。选定后点击"下一步"进入单元编辑。`
  },
  {
    title: 'Step 2 - 单元编辑',
    content: `查看和编辑策展单元。您可以：添加新单元、编辑单元标题和描述、删除单元（会二次确认）。单元会自动排序，"序章"在最前，"尾声"在最后。点击"分配展品"可将上传的展品分配到各单元。`
  },
  {
    title: 'Step 3 - 展品确认',
    content: `查看各单元分配的展品。您可以：保留或删除展品、查看展品详情、确认单元展品后进入下一步。`
  },
  {
    title: 'Step 4 - 文本撰写',
    content: `为每个单元撰写展示文本。您可以：编辑单元标题和描述、添加新的文本段落、调整段落顺序。`
  },
  {
    title: 'Step 5 - 预览导出',
    content: `预览完整的策展大纲，包括所有单元、展品和文本。点击"导出大纲"可下载策展方案。`
  },
  {
    title: '展品库',
    content: `管理全局展品知识库。您可以：手动添加展品、编辑展品信息、删除展品、批量导入Excel文件。展品库中的展品可在创建新策展时直接选择使用。`
  },
  {
    title: '数据保存',
    content: `所有数据会自动保存到云端数据库。从"我的项目"继续编辑时，之前的工作进度会被完整恢复。`
  }
];

export const PageHelp = ({ 
  navigateTo,
  theme,
}) => {
  const C = theme;
  
  return (
    <main style={{ padding: "28px 36px", maxWidth: 800 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: C.textPrimary, fontFamily: "'Noto Serif SC', serif" }}>
        帮助中心
      </h1>
      <p style={{ color: C.textSecondary, fontSize: 14, marginTop: 6, marginBottom: 24 }}>
        智能策展助手使用指南
      </p>
      <Divider style={{ background: C.border }} />

      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        {helpContent.map((item, index) => (
          <div 
            key={index}
            style={{
              background: C.bgSecondary, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20,
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8, color: C.textPrimary }}>
              {item.title}
            </div>
            <div style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.8 }}>
              {item.content}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 32, padding: 20, background: C.aiGenerated, borderRadius: 8 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: C.textPrimary }}>需要更多帮助？</div>
        <div style={{ fontSize: 13, color: C.textSecondary }}>
          如有其他问题，请联系系统管理员或查看项目文档。
        </div>
      </div>
    </main>
  );
};

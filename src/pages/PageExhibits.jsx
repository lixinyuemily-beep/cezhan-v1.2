import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Btn, Divider } from '../components/ui';
import { api } from '../api/client';

export const PageExhibits = ({ 
  navigateTo,
  showToast,
  theme,
}) => {
  const C = theme;
  const [exhibits, setExhibits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExhibit, setEditingExhibit] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    era: '',
    material: '',
    size: '',
    description: '',
  });

  useEffect(() => {
    loadExhibits();
  }, []);

  const loadExhibits = async () => {
    setLoading(true);
    try {
      const data = await api.exhibits.getAll();
      setExhibits(data);
    } catch (error) {
      console.error('加载展品失败:', error);
      showToast('加载展品失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const parseExcelAndImport = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length < 2) {
            reject(new Error('文件内容为空'));
            return;
          }
          
          const headers = jsonData[0];
          const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== null && cell !== ''));
          
          const exhibitsData = rows.map((row, index) => {
            const obj = {};
            headers.forEach((header, i) => {
              const key = header.trim().toLowerCase();
              if (key === '名称' || key === 'name') obj.name = row[i];
              else if (key === '时代' || key === 'era') obj.era = row[i];
              else if (key === '材质' || key === 'material') obj.material = row[i];
              else if (key === '尺寸' || key === 'size') obj.size = row[i];
              else if (key === '描述' || key === 'description') obj.description = row[i];
            });
            return obj;
          }).filter(ex => ex.name);
          
          resolve(exhibitsData);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleImportExcel = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    try {
      const exhibitsData = await parseExcelAndImport(file);
      if (exhibitsData.length === 0) {
        showToast('未找到有效的展品数据', 'error');
        return;
      }
      
      const created = await api.exhibits.createBatch(exhibitsData);
      
      showToast(`成功导入 ${created.length} 条展品`, 'success');
      loadExhibits();
    } catch (error) {
      console.error('导入失败:', error);
      showToast('导入失败: ' + error.message, 'error');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredExhibits = search
    ? exhibits.filter(ex => 
        (ex.name && ex.name.includes(search)) ||
        (ex.era && ex.era.includes(search)) ||
        (ex.material && ex.material.includes(search))
      )
    : exhibits;

  const handleSubmit = async () => {
    if (!formData.name) {
      showToast('请输入展品名称', 'error');
      return;
    }

    try {
      if (editingExhibit) {
        await api.exhibits.update(editingExhibit.id, formData);
        showToast('展品更新成功', 'success');
      } else {
        await api.exhibits.create(formData);
        showToast('展品添加成功', 'success');
      }
      setShowAddModal(false);
      setEditingExhibit(null);
      setFormData({ name: '', era: '', material: '', size: '', description: '' });
      loadExhibits();
    } catch (error) {
      console.error('保存展品失败:', error);
      showToast('保存展品失败', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    
    try {
      await api.exhibits.delete(deleteModal.id);
      showToast('展品删除成功', 'success');
      setDeleteModal(null);
      loadExhibits();
    } catch (error) {
      console.error('删除展品失败:', error);
      showToast('删除展品失败', 'error');
    }
  };

  const confirmDelete = (exhibit) => {
    setDeleteModal({ id: exhibit.id, name: exhibit.name });
  };

  const openEditModal = (exhibit) => {
    setEditingExhibit(exhibit);
    setFormData({
      name: exhibit.name || '',
      era: exhibit.era || '',
      material: exhibit.material || '',
      size: exhibit.size || '',
      description: exhibit.description || '',
    });
    setShowAddModal(true);
  };

  const openAddModal = () => {
    setEditingExhibit(null);
    setFormData({ name: '', era: '', material: '', size: '', description: '' });
    setShowAddModal(true);
  };

  return (
    <main style={{ padding: "28px 36px", maxWidth: 1200 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: C.textPrimary, fontFamily: "'Noto Serif SC', serif" }}>
            展品库管理
          </h1>
          <p style={{ color: C.textSecondary, fontSize: 14, marginTop: 6 }}>
            管理全局展品知识库，支持录入、编辑和删除展品信息
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleImportExcel}
            style={{ display: 'none' }}
          />
          <Btn variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
            {isImporting ? '导入中...' : '导入Excel'}
          </Btn>
          <Btn onClick={openAddModal}>+ 添加展品</Btn>
        </div>
      </div>
      <Divider />

      <div style={{ marginTop: 20, marginBottom: 20 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索展品名称、时代、材质..."
          style={{
            width: "100%", maxWidth: 400, padding: "10px 14px", borderRadius: 6,
            border: `1px solid ${C.border}`, fontSize: 14, boxSizing: "border-box",
          }}
        />
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: C.textSecondary }}>加载中...</div>
      ) : filteredExhibits.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: C.textSecondary }}>
          {search ? "未找到匹配的展品" : "展品库为空，请添加展品"}
        </div>
      ) : (
        <div style={{ 
          border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden",
          background: "#fff",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f5f5f4" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>展品名称</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>时代</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>材质</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>尺寸</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600 }}>描述</th>
                <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredExhibits.map((ex, idx) => (
                <tr key={ex.id || idx} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td style={{ padding: "12px 16px", fontWeight: 500 }}>{ex.name}</td>
                  <td style={{ padding: "12px 16px", color: C.textSecondary }}>{ex.era || '-'}</td>
                  <td style={{ padding: "12px 16px", color: C.textSecondary }}>{ex.material || '-'}</td>
                  <td style={{ padding: "12px 16px", color: C.textSecondary }}>{ex.size || '-'}</td>
                  <td style={{ padding: "12px 16px", color: C.textSecondary, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {ex.description || '-'}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <span 
                      onClick={() => openEditModal(ex)}
                      style={{ color: C.accentPrimary, cursor: "pointer", marginRight: 12, fontSize: 13 }}
                    >
                      编辑
                    </span>
                    <span 
                      onClick={() => confirmDelete(ex)}
                      style={{ color: C.danger, cursor: "pointer", fontSize: 13 }}
                    >
                      删除
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 12, color: C.textSecondary, fontSize: 13 }}>
        共 {filteredExhibits.length} 条记录
      </div>

      {showAddModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 400,
        }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 24, width: 480 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
              {editingExhibit ? '编辑展品' : '添加展品'}
            </h3>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                展品名称 <span style={{ color: C.danger }}>*</span>
              </label>
              <input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入展品名称"
                style={{ width: "100%", padding: "10px 14px", borderRadius: 6, border: `1px solid ${C.border}`, boxSizing: "border-box", fontSize: 14 }}
              />
            </div>

            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 6 }}>时代</label>
                <input
                  value={formData.era}
                  onChange={(e) => setFormData({ ...formData, era: e.target.value })}
                  placeholder="如：清代乾隆年间"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 6, border: `1px solid ${C.border}`, boxSizing: "border-box", fontSize: 14 }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 6 }}>材质</label>
                <input
                  value={formData.material}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                  placeholder="如：青铜、瓷器"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 6, border: `1px solid ${C.border}`, boxSizing: "border-box", fontSize: 14 }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 6 }}>尺寸</label>
              <input
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                placeholder="如：高45cm 口径20cm"
                style={{ width: "100%", padding: "10px 14px", borderRadius: 6, border: `1px solid ${C.border}`, boxSizing: "border-box", fontSize: 14 }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 6 }}>描述</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="请输入展品描述"
                rows={3}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 6, border: `1px solid ${C.border}`, boxSizing: "border-box", fontSize: 14, resize: "vertical" }}
              />
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => setShowAddModal(false)}>取消</Btn>
              <Btn onClick={handleSubmit}>{editingExhibit ? '保存' : '添加'}</Btn>
            </div>
          </div>
        </div>
      )}
      
      {deleteModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 400,
        }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 24, width: 360 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>确认删除</h3>
            <p style={{ fontSize: 14, color: C.textSecondary, marginBottom: 20 }}>
              确定要删除展品「{deleteModal.name}」吗？此操作不可撤销。
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => setDeleteModal(null)}>取消</Btn>
              <Btn onClick={handleDelete}>确认删除</Btn>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

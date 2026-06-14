"""
项目 API 路由
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from ..models.schemas import (
    ProjectCreate, ProjectUpdate, ProjectResponse,
    UnitCreate, UnitUpdate, UnitResponse,
    TextSectionCreate, TextSectionUpdate, TextSectionResponse,
    MessageResponse
)
from ..services.database import db

router = APIRouter(prefix="/projects", tags=["项目"])


# ==================== 项目操作 ====================

@router.get("")
async def get_projects(user_id: Optional[str] = Query(None, description="用户ID")):
    """获取项目列表"""
    try:
        projects = db.get_projects(user_id)
        return projects
    except Exception as e:
        print(e)  # 打印详细错误信息
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{project_id}")
async def get_project(project_id: str):
    """获取单个项目"""
    project = db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    return project


@router.post("", response_model=ProjectResponse)
async def create_project(project: ProjectCreate):
    """创建新项目"""
    try:
        project_data = project.model_dump()
        if not project_data.get("user_id"):
            project_data["user_id"] = "default_user"
        new_project = db.create_project(project_data)
        return new_project
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: str, project: ProjectUpdate):
    """更新项目"""
    try:
        update_data = {k: v for k, v in project.model_dump().items() if v is not None}
        updated = db.update_project(project_id, update_data)
        if not updated:
            raise HTTPException(status_code=404, detail="项目不存在")
        return updated
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{project_id}", response_model=MessageResponse)
async def delete_project(project_id: str):
    """删除项目"""
    try:
        success = db.delete_project(project_id)
        if not success:
            raise HTTPException(status_code=404, detail="项目不存在")
        return MessageResponse(message="项目删除成功")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== 完成项目操作 ====================

@router.post("/{project_id}/complete", response_model=MessageResponse)
async def complete_project(project_id: str, data: dict):
    """完成项目，保存到完成项目表"""
    try:
        project = db.get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="项目不存在")
        
        completed_data = {
            "project_id": project_id,
            "user_id": project.get("user_id"),
            "title": project.get("title", ""),
            "narrative_title": data.get("narrative_title", ""),
            "units": data.get("units", []),
            "text_sections": data.get("text_sections", []),
            "kept_exhibits": data.get("kept_exhibits", []),
            "exhibition_title": data.get("exhibition_title", ""),
            "narrative": data.get("narrative", {}),
            "narrative_options": data.get("narrative_options", []),
            "selected_narrative": data.get("selected_narrative", 0),
            "llm_params": data.get("llm_params", {}),
            "uploaded_exhibits": data.get("uploaded_exhibits", []),
            "exhibit_confirmations": data.get("exhibit_confirmations", {}),
        }
        
        try:
            db.create_completed_project(completed_data)
        except Exception:
            # 兼容旧表结构暂未增加 user_id 字段的情况
            completed_data.pop("user_id", None)
            db.create_completed_project(completed_data)
        
        db.delete_project(project_id)
        
        return MessageResponse(message="项目已完成")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/completed/list", response_model=List[dict])
async def get_completed_projects(user_id: Optional[str] = Query(None, description="用户ID")):
    """获取已完成项目列表"""
    try:
        projects = db.get_completed_projects(user_id)
        return projects
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/completed/{project_id}", response_model=dict)
async def get_completed_project(project_id: str):
    """获取已完成项目详情"""
    try:
        project = db.get_completed_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="完成项目不存在")
        return project
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/completed/{project_id}", response_model=MessageResponse)
async def delete_completed_project(project_id: str):
    """删除已完成项目"""
    try:
        success = db.delete_completed_project(project_id)
        if not success:
            raise HTTPException(status_code=404, detail="完成项目不存在")
        return MessageResponse(message="完成项目删除成功")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== 单元操作 ====================

@router.get("/{project_id}/units", response_model=List[UnitResponse])
async def get_units(project_id: str):
    """获取项目的所有单元"""
    try:
        units = db.get_units(project_id)
        return units
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/units", response_model=UnitResponse)
async def create_unit(unit: UnitCreate):
    """创建单元"""
    try:
        unit_data = unit.model_dump()
        new_unit = db.create_unit(unit_data)
        return new_unit
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/units/{unit_id}", response_model=UnitResponse)
async def update_unit(unit_id: str, unit: UnitUpdate):
    """更新单元"""
    try:
        update_data = {k: v for k, v in unit.model_dump().items() if v is not None}
        updated = db.update_unit(unit_id, update_data)
        if not updated:
            raise HTTPException(status_code=404, detail="单元不存在")
        return updated
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/units/{unit_id}", response_model=MessageResponse)
async def delete_unit(unit_id: str):
    """删除单元"""
    try:
        success = db.delete_unit(unit_id)
        if not success:
            raise HTTPException(status_code=404, detail="单元不存在")
        return MessageResponse(message="单元删除成功")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== 文本段落操作 ====================

@router.get("/{project_id}/text-sections", response_model=List[TextSectionResponse])
async def get_text_sections(project_id: str):
    """获取项目的所有文本段落"""
    try:
        sections = db.get_text_sections(project_id)
        return sections
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/text-sections", response_model=TextSectionResponse)
async def create_text_section(section: TextSectionCreate):
    """创建文本段落"""
    try:
        section_data = section.model_dump()
        new_section = db.create_text_section(section_data)
        return new_section
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/text-sections/{section_id}", response_model=TextSectionResponse)
async def update_text_section(section_id: str, section: TextSectionUpdate):
    """更新文本段落"""
    try:
        update_data = {k: v for k, v in section.model_dump().items() if v is not None}
        updated = db.update_text_section(section_id, update_data)
        if not updated:
            raise HTTPException(status_code=404, detail="文本段落不存在")
        return updated
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/text-sections/{section_id}", response_model=MessageResponse)
async def delete_text_section(section_id: str):
    """删除文本段落"""
    try:
        success = db.delete_text_section(section_id)
        if not success:
            raise HTTPException(status_code=404, detail="文本段落不存在")
        return MessageResponse(message="文本段落删除成功")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

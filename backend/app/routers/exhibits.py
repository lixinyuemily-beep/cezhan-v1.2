"""
展品 API 路由
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from ..models.schemas import (
    ExhibitCreate, ExhibitUpdate, ExhibitResponse, MessageResponse
)
from ..services.database import db

router = APIRouter(prefix="/exhibits", tags=["展品"])


@router.get("", response_model=List[ExhibitResponse])
async def get_exhibits(
    project_id: Optional[str] = Query(None, description="项目ID"),
    unit_id: Optional[str] = Query(None, description="单元ID")
):
    """获取展品列表"""
    try:
        exhibits = db.get_exhibits(project_id, unit_id)
        return exhibits
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/all", response_model=List[ExhibitResponse])
async def get_all_exhibits():
    """获取全局展品知识库（不区分项目）"""
    try:
        exhibits = db.get_all_exhibits()
        return exhibits
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/all", response_model=MessageResponse)
async def delete_all_exhibits():
    """清空所有展品"""
    try:
        db.delete_all_exhibits()
        return {"success": True, "message": "已清空所有展品"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search", response_model=List[ExhibitResponse])
async def search_exhibits(keyword: str = Query(..., description="搜索关键词")):
    """搜索展品"""
    try:
        exhibits = db.search_exhibits(keyword)
        return exhibits
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{exhibit_id}", response_model=ExhibitResponse)
async def get_exhibit(exhibit_id: str):
    """获取单个展品"""
    exhibits = db.get_exhibits(unit_id=None)
    exhibit = next((e for e in exhibits if e.get("id") == exhibit_id), None)
    if not exhibit:
        raise HTTPException(status_code=404, detail="展品不存在")
    return exhibit


@router.post("", response_model=ExhibitResponse)
async def create_exhibit(exhibit: ExhibitCreate):
    """创建展品"""
    try:
        exhibit_data = exhibit.model_dump()
        new_exhibit = db.create_exhibit(exhibit_data)
        return new_exhibit
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{exhibit_id}", response_model=ExhibitResponse)
async def update_exhibit(exhibit_id: str, exhibit: ExhibitUpdate):
    """更新展品"""
    try:
        update_data = {k: v for k, v in exhibit.model_dump().items() if v is not None}
        updated = db.update_exhibit(exhibit_id, update_data)
        if not updated:
            raise HTTPException(status_code=404, detail="展品不存在")
        return updated
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{exhibit_id}", response_model=MessageResponse)
async def delete_exhibit(exhibit_id: str):
    """删除展品"""
    try:
        success = db.delete_exhibit(exhibit_id)
        if not success:
            raise HTTPException(status_code=404, detail="展品不存在")
        return MessageResponse(message="展品删除成功")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch", response_model=List[ExhibitResponse])
async def create_exhibits_batch(exhibits: List[ExhibitCreate]):
    """批量创建展品"""
    try:
        created = []
        for exhibit in exhibits:
            exhibit_data = exhibit.model_dump()
            new_exhibit = db.create_exhibit(exhibit_data)
            if new_exhibit:
                created.append(new_exhibit)
        return created
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

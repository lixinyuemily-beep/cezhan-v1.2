"""
数据库服务 - Supabase 连接和操作
"""
from datetime import datetime, timezone
from typing import Optional, List, Dict
from supabase import create_client, Client
from ..config import settings


class DatabaseService:
    """Supabase 数据库服务类"""
    
    _instance: Optional[Client] = None
    
    @classmethod
    def get_client(cls) -> Client:
        """获取 Supabase 客户端单例"""
        if cls._instance is None:
            if not settings.supabase_url or not settings.supabase_key:
                raise ValueError("Supabase URL 和 Key 未配置")
            cls._instance = create_client(settings.supabase_url, settings.supabase_key)
        return cls._instance
    
    @classmethod
    def reset_client(cls):
        """重置客户端连接"""
        cls._instance = None
    
    # ==================== 项目操作 ====================
    
    @classmethod
    def get_projects(cls, user_id: Optional[str] = None) -> List[Dict]:
        """获取项目列表"""
        client = cls.get_client()
        query = client.table(settings.table_projects).select("*")
        if user_id:
            query = query.eq("user_id", user_id)
        query = query.order("created_at", desc=True)
        return query.execute().data or []
    
    @classmethod
    def get_project(cls, project_id: str) -> Optional[Dict]:
        """获取单个项目"""
        client = cls.get_client()
        result = client.table(settings.table_projects).select("*").eq("id", project_id).execute()
        return result.data[0] if result.data else None
    
    @classmethod
    def create_project(cls, project_data: Dict) -> Dict:
        """创建项目"""
        client = cls.get_client()
        result = client.table(settings.table_projects).insert(project_data).execute()
        return result.data[0] if result.data else None
    
    @classmethod
    def update_project(cls, project_id: str, project_data: Dict) -> Dict:
        """更新项目"""
        client = cls.get_client()
        result = client.table(settings.table_projects).update(project_data).eq("id", project_id).execute()
        return result.data[0] if result.data else None
    
    @classmethod
    def delete_project(cls, project_id: str) -> bool:
        """删除项目"""
        client = cls.get_client()
        result = client.table(settings.table_projects).delete().eq("id", project_id).execute()
        return len(result.data) > 0 if result.data else False
    
    # ==================== 单元操作 ====================
    
    @classmethod
    def get_units(cls, project_id: str) -> List[Dict]:
        """获取项目的所有单元"""
        client = cls.get_client()
        result = client.table(settings.table_units).select("*").eq("project_id", project_id).order("order").execute()
        return result.data or []
    
    @classmethod
    def create_unit(cls, unit_data: Dict) -> Dict:
        """创建单元"""
        client = cls.get_client()
        result = client.table(settings.table_units).insert(unit_data).execute()
        return result.data[0] if result.data else None
    
    @classmethod
    def update_unit(cls, unit_id: str, unit_data: Dict) -> Dict:
        """更新单元"""
        client = cls.get_client()
        result = client.table(settings.table_units).update(unit_data).eq("id", unit_id).execute()
        return result.data[0] if result.data else None
    
    @classmethod
    def delete_unit(cls, unit_id: str) -> bool:
        """删除单元"""
        client = cls.get_client()
        result = client.table(settings.table_units).delete().eq("id", unit_id).execute()
        return len(result.data) > 0 if result.data else False
    
    # ==================== 完成项目操作 ====================
    
    @classmethod
    def create_completed_project(cls, project_data: Dict) -> Dict:
        """创建完成项目记录"""
        client = cls.get_client()
        result = client.table(settings.table_completed_projects).insert(project_data).execute()
        return result.data[0] if result.data else None
    
    @classmethod
    def get_completed_projects(cls, user_id: Optional[str] = None) -> List[Dict]:
        """获取所有完成项目"""
        client = cls.get_client()
        query = client.table(settings.table_completed_projects).select("*")
        if user_id:
            try:
                result = query.eq("user_id", user_id).order("created_at", desc=True).execute()
                return result.data or []
            except Exception:
                # 兼容旧表结构中尚未包含 user_id 字段的情况
                pass
        result = client.table(settings.table_completed_projects).select("*").order("created_at", desc=True).execute()
        return result.data or []
    
    @classmethod
    def get_completed_project(cls, project_id: str) -> Optional[Dict]:
        """获取单个完成项目"""
        client = cls.get_client()
        result = client.table(settings.table_completed_projects).select("*").eq("project_id", project_id).execute()
        return result.data[0] if result.data else None
    
    @classmethod
    def delete_completed_project(cls, project_id: str) -> bool:
        """删除完成项目"""
        client = cls.get_client()
        result = client.table(settings.table_completed_projects).delete().eq("project_id", project_id).execute()
        return len(result.data) > 0 if result.data else False

    # ==================== 应用用户与验证码 ====================

    @classmethod
    def get_app_user_by_phone(cls, phone: str) -> Optional[Dict]:
        client = cls.get_client()
        result = client.table(settings.table_app_users).select("*").eq("phone", phone).limit(1).execute()
        return result.data[0] if result.data else None

    @classmethod
    def get_app_user_by_email(cls, email: str) -> Optional[Dict]:
        client = cls.get_client()
        result = client.table(settings.table_app_users).select("*").eq("email", email).limit(1).execute()
        return result.data[0] if result.data else None

    @classmethod
    def get_app_user_by_id(cls, user_id: str) -> Optional[Dict]:
        client = cls.get_client()
        result = client.table(settings.table_app_users).select("*").eq("id", user_id).limit(1).execute()
        return result.data[0] if result.data else None

    @classmethod
    def create_app_user(cls, user_data: Dict) -> Dict:
        client = cls.get_client()
        result = client.table(settings.table_app_users).insert(user_data).execute()
        return result.data[0] if result.data else None

    @classmethod
    def update_app_user(cls, user_id: str, user_data: Dict) -> Dict:
        client = cls.get_client()
        result = client.table(settings.table_app_users).update(user_data).eq("id", user_id).execute()
        return result.data[0] if result.data else None

    @classmethod
    def create_email_verification_code(cls, code_data: Dict) -> Dict:
        client = cls.get_client()
        result = client.table(settings.table_email_verification_codes).insert(code_data).execute()
        return result.data[0] if result.data else None

    @classmethod
    def get_latest_email_verification_code(cls, email: str) -> Optional[Dict]:
        client = cls.get_client()
        result = (
            client.table(settings.table_email_verification_codes)
            .select("*")
            .eq("email", email)
            .is_("used_at", "null")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None

    @classmethod
    def mark_email_verification_code_used(cls, code_id: str) -> Dict:
        client = cls.get_client()
        result = (
            client.table(settings.table_email_verification_codes)
            .update({"used_at": datetime.now(timezone.utc).isoformat()})
            .eq("id", code_id)
            .execute()
        )
        return result.data[0] if result.data else None
    
    # ==================== 展品操作 =================###
    
    @classmethod
    def get_exhibits(cls, project_id: Optional[str] = None, unit_id: Optional[str] = None) -> List[Dict]:
        """获取展品列表"""
        client = cls.get_client()
        query = client.table(settings.table_exhibits).select("*")
        if project_id:
            query = query.eq("project_id", project_id)
        if unit_id:
            query = query.eq("unit_id", unit_id)
        return query.execute().data or []
    
    @classmethod
    def get_all_exhibits(cls) -> List[Dict]:
        """获取全局展品知识库（不区分项目）"""
        client = cls.get_client()
        return client.table(settings.table_exhibits).select("*").order("created_at", desc=True).execute().data or []
    
    @classmethod
    def search_exhibits(cls, keyword: str) -> List[Dict]:
        """搜索展品（按名称或时代）"""
        client = cls.get_client()
        return client.table(settings.table_exhibits).select("*").or_(f"name.ilike.%{keyword}%,era.ilike.%{keyword}%").execute().data or []
    
    @classmethod
    def create_exhibit(cls, exhibit_data: Dict) -> Dict:
        """创建展品"""
        client = cls.get_client()
        result = client.table(settings.table_exhibits).insert(exhibit_data).execute()
        return result.data[0] if result.data else None
    
    @classmethod
    def update_exhibit(cls, exhibit_id: str, exhibit_data: Dict) -> Dict:
        """更新展品"""
        client = cls.get_client()
        result = client.table(settings.table_exhibits).update(exhibit_data).eq("id", exhibit_id).execute()
        return result.data[0] if result.data else None
    
    @classmethod
    def delete_exhibit(cls, exhibit_id: str) -> bool:
        """删除展品"""
        client = cls.get_client()
        result = client.table(settings.table_exhibits).delete().eq("id", exhibit_id).execute()
        return len(result.data) > 0 if result.data else False
    
    @classmethod
    def delete_all_exhibits(cls) -> bool:
        """清空所有展品"""
        client = cls.get_client()
        client.table(settings.table_exhibits).delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        return True
    
    # ==================== 文本段落操作 ====================
    
    @classmethod
    def get_text_sections(cls, project_id: str) -> List[Dict]:
        """获取项目的所有文本段落"""
        client = cls.get_client()
        result = client.table(settings.table_text_sections).select("*").eq("project_id", project_id).order("order").execute()
        return result.data or []
    
    @classmethod
    def create_text_section(cls, section_data: Dict) -> Dict:
        """创建文本段落"""
        client = cls.get_client()
        result = client.table(settings.table_text_sections).insert(section_data).execute()
        return result.data[0] if result.data else None
    
    @classmethod
    def update_text_section(cls, section_id: str, section_data: Dict) -> Dict:
        """更新文本段落"""
        client = cls.get_client()
        result = client.table(settings.table_text_sections).update(section_data).eq("id", section_id).execute()
        return result.data[0] if result.data else None
    
    @classmethod
    def delete_text_section(cls, section_id: str) -> bool:
        """删除文本段落"""
        client = cls.get_client()
        result = client.table(settings.table_text_sections).delete().eq("id", section_id).execute()
        return len(result.data) > 0 if result.data else False


# 导出服务实例
db = DatabaseService()

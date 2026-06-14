"""
配置文件 - 管理所有环境变量和配置
"""
import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Supabase 配置 (使用 service role key，服务端安全连接)
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_key: str = os.getenv("SUPABASE_KEY", "")

    # 元景AI配置 (使用 OPENAI 兼容模式)
    yuanjing_api_key: str = os.getenv("YUANJING_API_KEY", "")
    yuanjing_base_url: str = os.getenv("YUANJING_BASE_URL", "https://maas-api.ai-yuanjing.com/openapi/compatible-mode/v1")

    # FastAPI配置
    app_name: str = "策展智能助手 API"
    debug: bool = os.getenv("DEBUG", "true").lower() == "true"
    cors_origins: list = ["http://localhost:5173", "http://localhost:5174"]

    # 自建认证配置
    auth_token_secret: str = os.getenv("AUTH_TOKEN_SECRET", "change-me-in-production")
    auth_token_expires_seconds: int = int(os.getenv("AUTH_TOKEN_EXPIRES_SECONDS", "259200"))
    email_code_expires_minutes: int = int(os.getenv("EMAIL_CODE_EXPIRES_MINUTES", "5"))
    email_provider: str = os.getenv("EMAIL_PROVIDER", "mock")
    email_debug_return_code: bool = os.getenv("EMAIL_DEBUG_RETURN_CODE", "true").lower() == "true"
    smtp_host: str = os.getenv("SMTP_HOST", "")
    smtp_port: int = int(os.getenv("SMTP_PORT", "465"))
    smtp_username: str = os.getenv("SMTP_USERNAME", "")
    smtp_password: str = os.getenv("SMTP_PASSWORD", "")
    smtp_from_email: str = os.getenv("SMTP_FROM_EMAIL", "")
    smtp_from_name: str = os.getenv("SMTP_FROM_NAME", "策展智能助手")
    smtp_use_tls: bool = os.getenv("SMTP_USE_TLS", "false").lower() == "true"
    smtp_use_ssl: bool = os.getenv("SMTP_USE_SSL", "true").lower() == "true"
    aliyun_sms_access_key_id: str = os.getenv("ALIYUN_SMS_ACCESS_KEY_ID", "")
    aliyun_sms_access_key_secret: str = os.getenv("ALIYUN_SMS_ACCESS_KEY_SECRET", "")
    aliyun_sms_sign_name: str = os.getenv("ALIYUN_SMS_SIGN_NAME", "")
    aliyun_sms_template_code: str = os.getenv("ALIYUN_SMS_TEMPLATE_CODE", "")

    # 数据库表名
    table_projects: str = "projects"
    table_exhibits: str = "exhibits"
    table_text_sections: str = "text_sections"
    table_units: str = "units"
    table_completed_projects: str = "completed_projects"
    table_app_users: str = "app_users"
    table_email_verification_codes: str = "email_verification_codes"

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()

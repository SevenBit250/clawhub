-- PostgreSQL 初始化脚本
-- 在数据库首次创建时自动执行

-- 启用 pgvector 扩展（用于向量搜索）
CREATE EXTENSION IF NOT EXISTS vector;

-- 创建应用用户（如果由 POSTGRES_USER 指定的用户不存在则忽略）
-- 注意：容器使用 POSTGRES_USER/POSTGRES_PASSWORD 创建用户，此处仅做额外配置

-- 验证扩展已启用
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';

# NG 版本计划

> 状态：规划中
>
> 详见：待定

## 概述

NG 版本是 ClawHub 私有化部署版的下一个重要里程碑，包含 Souls 功能完善、认证后端改造、遗留接口清理三大方向。

## 已完成部分

### Souls 功能后端
- [x] `GET /api/v1/souls` — 灵魂列表 API
- [x] `GET /api/v1/souls/:slug` — 灵魂详情 API
- [x] `POST /api/v1/souls` — 创建灵魂
- [x] Soul 路由及业务逻辑 (`lib/souls.ts`)
- [x] 数据库表 (`souls`, `soul_versions`, `soul_embeddings`, `soul_stars`, `soul_comments`)
- [x] 前端页面 (`frontend/src/pages/souls/index.vue`)
- [x] 前端路由注册 (`frontend/src/router/index.ts`)

### 前端展示层
- [x] Souls 页面 UI 组件
- [x] Souls 详情页 (`/souls/:slug`)

## 待完成部分

### 启用 Souls 导航入口
- [ ] 取消 `frontend/src/layouts/default.vue` 中 Souls 导航链接的注释
- [ ] 验证 `/souls` 页面在浏览器中正常访问
- [ ] 验证 `/souls/:slug` 详情页正常显示

### Souls 管理功能
- [ ] 创建灵魂页面 (`/souls/create`) — 对应 `pages/souls/create.vue`
- [ ] 编辑灵魂页面 (`/souls/:slug/edit`) — 对应 `pages/souls/edit.vue`
- [ ] 灵魂发布、编辑、删除 API（CLI 发布时自动创建）

### 遗留接口清理
- [ ] 评估并移除 `/api` 前缀的遗留兼容路由（`routes/legacy/`）
- [ ] 参见 `DEPRECATIONS.md`

### 技能列表计数优化
- [ ] 引入计数器缓存表替代 `count(*)` 查询
- [ ] 详见 `features/skill-count-counter-cache.md`
- **背景**：`GET /api/v1/skills` 列表接口使用 `count(*)` 全表扫描，大数据量（10000+）时性能差

### Authing 后端登录
- [ ] 数据库添加 `authingUserId` 字段
- [ ] 后端实现标准 OAuth 2.0 流程（用 code 向 Authing 换取用户信息）
- [ ] 使用 `sub` 作为唯一标识符绑定用户
- [ ] 详见 `features/v1.1.0-optimization.md`

### 其他待定项
- [ ] Souls 收藏（星标）功能前端
- [ ] Souls 评论功能前端
- [ ] Souls 向量搜索支持

## 依赖

- Authing 后端登录：需要配置有效的 `AUTHING_APP_ID` / `AUTHING_APP_SECRET`
- 技能计数优化：无需外部依赖

## 优先级

| 优先级 | 事项 |
|--------|------|
| P0 | 启用 Souls 导航入口（取消注释即可，无其他前置依赖）|
| P1 | Authing 后端登录（生产部署必需）|
| P1 | 技能列表计数优化（大数据量时影响可用性）|
| P2 | Souls 管理功能（create/edit 页面）|
| P3 | 遗留接口清理 |
| P3 | Souls 其他前端功能（收藏、评论、向量搜索）|

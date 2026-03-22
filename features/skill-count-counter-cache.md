# 技能列表精确总数计数优化

## 问题背景

当前 `GET /api/v1/skills` 接口使用 `count(*)` 查询来获取技能总数，该查询在大数据量（10000+）时性能较差。

### 当前实现

```typescript
const [{ count }] = await db
  .select({ count: sql<number>`count(*)` })
  .from(skills)
  .where(and(
    isNull(skills.softDeletedAt),
    ne(skills.moderationStatus, "pending"),
    ne(skills.moderationStatus, "removed")
  ));
```

### 问题分析

1. `count(*)` 需要全表扫描，无法利用现有索引
2. 过滤条件 `moderationStatus NOT IN ('pending', 'removed')` 导致无法使用 `skills_by_active_updated_idx` 索引
3. 大数据量时查询延迟显著

## 技能状态说明

| 状态 | softDeletedAt | moderationStatus | 列表显示 |
|------|---------------|------------------|---------|
| 正常 | NULL | active | ✅ |
| 正常 | NULL | hidden | ✅ |
| 待审核 | NULL | pending | ❌ |
| 已拒绝 | NULL | removed | ❌ |
| 作者删除 | 有值 | - | ❌ |

**列表显示条件**：`softDeletedAt IS NULL AND moderationStatus IN ('active', 'hidden')`

## 解决方案：计数器缓存表

### 设计

新增 `counters` 表存储计数器：

```sql
CREATE TABLE counters (
  name VARCHAR(50) PRIMARY KEY,
  value BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 需要更新的计数器

| 场景 | 计数器变化 |
|------|-----------|
| 批准 (pending → active) | +1 |
| 软删除 (active/hidden → deleted) | -1 |
| 恢复软删除 (deleted → active) | +1 |
| 隐藏/取消隐藏 | 0 |
| 拒绝 (pending → removed) | 0 |

### 涉及修改的 API

1. `POST /api/v1/admin/skills/:id/approve` - 批准时 +1
2. `POST /api/v1/admin/skills/:id/reject` - 拒绝时不变
3. `POST /api/v1/admin/skills/:id/hide` - 隐藏时不变
4. `POST /api/v1/admin/skills/:id/unhide` - 取消隐藏时不变
5. `DELETE /api/v1/skills/:slug` - 软删除时 -1
6. `POST /api/v1/skills/:slug/undelete` - 恢复时 +1

### API 响应变更

修改 `GET /api/v1/skills` 响应：

```typescript
// 原来
{ items: [...], total: count(*), nextCursor: "..." }

// 改为
{ items: [...], total: (SELECT value FROM counters WHERE name = 'public_skills'), nextCursor: "..." }
```

### 前端影响

无。前端完全不用改动。

## 风险与注意事项

1. **数据一致性**：计数器必须在事务中与状态变更同步更新
2. **初始化**：需要一次性将当前计数器的值设为正确值
3. **并发问题**：高并发场景下计数器更新可能有锁竞争，考虑使用 `UPDATE counters SET value = value + 1`

## 优先级

P2 - 当前功能可用，但大规模部署时会有性能问题

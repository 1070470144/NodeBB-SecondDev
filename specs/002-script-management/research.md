# Research: 剧本（JSON）功能

**Feature**: 002-script-management - 剧本（JSON）功能  
**Date**: 2026-03-04

## Research Questions

### 1) 剧本 JSON 的存储方式应如何选择，才能兼容 NodeBB 多数据库后端？

**Decision**: 以 NodeBB 数据库抽象层存储“剧本对象 + JSON 内容（文本）”，并设置合理大小上限；下载/导出时直接以 JSON 内容生成响应。

**Rationale**:
- 避免依赖本地文件系统一致性（多实例/容器扩缩容场景更稳）
- 便于在同一抽象层内实现权限、列表、搜索（标题/描述）、可见性与审计
- 与 NodeBB 既有“对象 + 集合/有序集合”的数据模型习惯一致

**Alternatives considered**:
- 将 JSON 文件存放在 uploads 目录（仅存路径 + 元信息） → 需要额外考虑多机共享存储与备份一致性
- 只存元信息，JSON 放第三方对象存储 → 增加外部依赖，偏离最小侵入与黄金路径

---

### 2) 公开剧本页签与自定义页面路由如何与 NodeBB 路由体系集成？

**Decision**: 使用 NodeBB `routes/helpers.js` 提供的 `setupPageRoute`（页面 + 自动生成 `/api` 同名路由）挂载 `/scripts`、`/scripts/:id`、`/scripts/favorites` 等页面；对纯数据型接口使用 `setupApiRoute` 或在现有 `/api` router 下注册明确的 REST 风格接口。

**Rationale**:
- 自动获得 NodeBB 标准中间件链：语言、黑名单、鉴权、维护模式、插件钩子、pageView、header build 等
- 页面与 API 行为可复用控制器逻辑，减少重复

**Alternatives considered**:
- 直接在 Express 上 `app.get('/scripts', ...)` → 易绕过标准中间件与 header/CSRF 约束，不推荐

---

### 3) 上传 JSON 文件应如何复用 NodeBB 现有上传安全链路？

**Decision**: 复用 `src/middleware/multer.js` + `middleware.validateFiles` + `middleware.applyCSRF` + `middleware.ensureLoggedIn` + 上传限流中间件（与 `/api/post/upload` 同类组合），并增加“JSON 可解析 + 必填元信息”校验。

**Rationale**:
- 统一文件名编码处理与 multipart 解析
- 复用既有的文件大小/类型校验与速率限制（降低滥用风险）
- 将“业务校验”（JSON 可解析、标题/描述必填、可见性）放在领域层，更易测试

**Alternatives considered**:
- 使用 `helpers.setupApiRoute` 的 `upload.any()` 自动解析所有 multipart → 便利但需要更强的字段白名单与大小控制

---

### 4) 点赞/收藏与“我的收藏”应如何建模以支持计数与列表？

**Decision**: 参考 `src/posts/votes.js` 与 `src/posts/bookmarks.js` 的数据结构，采用“每剧本一个用户集合（去重）+ 每用户一个有序集合（用于列表/分页）”的组合，并将点赞数/收藏数冗余写回剧本对象，保证列表展示快速。

**Rationale**:
- 集合天然去重，符合“每用户最多计 1 次”的口径
- 有序集合可记录时间戳，便于“我的收藏”按最近收藏排序
- 冗余计数可避免每次列表渲染都做全量计数查询

**Alternatives considered**:
- 只用单一交互表（Script Interaction）再在查询时聚合计数 → 在多后端抽象下成本更高，列表性能不稳

---

### 5) “热度”与“下载量”排序如何落到可扩展的数据结构？

**Decision**:
- 热度：以 **点赞量 + 收藏量** 为口径；排序时以该合计（或两个字段的组合）产生“热度分值”
- 下载量：采用“同一用户终身最多计 1 次”口径，统计结果写入剧本对象并维护全站排序集合（例如按下载量的有序集合）

**Rationale**:
- 口径明确，验收可测
- 通过冗余字段 + 有序集合可实现高效排序与分页

**Alternatives considered**:
- 使用更复杂的时间衰减热度算法（近 7 天） → 需要额外计算与定时任务，当前规格未要求

---

### 6) 管理端治理与审计如何对齐 NodeBB 权限体系？

**Decision**: ACP 页面走 NodeBB admin middleware（`middleware.admin.checkPrivileges`），治理动作经管理端 API 执行，所有治理动作写入独立审计记录（含操作者、原因、时间、动作类型）。

**Rationale**:
- 复用 NodeBB 的 admin privilege 分配与 ACP header 体系
- 审计记录便于追溯与后续合规需求扩展

**Alternatives considered**:
- 仅在日志中记录治理操作 → 不利于在管理端 UI 内追溯与检索

---

## Conclusion

本功能将：

1. 在 NodeBB 路由体系内新增剧本页面与 API（不绕过标准中间件）
2. 使用 NodeBB 数据库抽象的“对象 + 集合/有序集合”模式实现 CRUD、列表、交互与统计
3. 复用既有上传安全链路与管理端权限检查，保证安全与可运维性


# Tasks: 剧本（JSON）功能

**Input**: 设计文档来自 `/specs/002-script-management/`  
**Prerequisites**: `plan.md`（必需）, `spec.md`（必需）, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`  
**Tests**: 规格未要求测试（本清单未包含测试任务）

## Phase 1: 准备阶段（共享基础设施）

**Purpose**: 创建骨架文件、接入点与共享常量。

- [x] T001 在 `src/scripts/index.js`、`src/scripts/interactions.js`、`src/scripts/moderation.js` 创建领域模块骨架
- [x] T002 [P] 在 `src/controllers/scripts.js` 与 `src/controllers/admin/scripts.js` 创建页面控制器骨架
- [x] T003 [P] 在 `src/api/scripts.js` 创建 API 控制器骨架
- [x] T004 [P] 在 `src/routes/scripts.js` 与 `src/routes/admin/scripts.js` 创建路由文件骨架
- [x] T005 [P] 在 `src/views/scripts.tpl`、`src/views/script.tpl`、`src/views/scripts-upload.tpl`、`src/views/scripts-manage.tpl`、`src/views/scripts-favorites.tpl`、`src/views/admin/scripts.tpl`、`src/views/admin/scripts-config.tpl` 创建模板骨架
- [x] T006 [P] 在 `public/src/client/scripts.js` 创建前端模块骨架
- [x] T007 [P] 在 `public/language/en-GB/global.json` 与 `public/language/zh-CN/global.json` 补充剧本相关的 i18n key
- [x] T008 如需调整端点命名，同步更新 `specs/002-script-management/contracts/http-api.md` 与 `specs/002-script-management/contracts/page-routes.md`

---

## Phase 2: 基础能力（阻塞性前置）

**Purpose**: 在开始任何用户故事前，必须先完成的核心基础能力。

- [x] T009 在 `src/scripts/index.js` 定义 key 规范/常量（覆盖 `script:{sid}`、`uid:{uid}:scripts`、`scripts:public:*`、`sid:{sid}:likes/favorites/downloads`、`uid:{uid}:favorites`、治理相关 keys）
- [x] T010 在 `src/scripts/index.js` 实现 Script 对象 CRUD 基元（create/read/update/delete + 权限校验钩子）
- [x] T011 在 `src/scripts/index.js` 实现列表/查询辅助（公开列表按 `recent/hot/downloads` 分页；按 title/description 关键字过滤；“我的剧本”列表）
- [x] T012 在 `src/scripts/index.js` 实现可见性与状态门禁（private/public；active/unavailable/deleted；“公开页签仅展示 public+active”）
- [x] T013 在 `src/scripts/index.js` 实现配置读写：`scriptsTabVisibility` 与 `defaultScriptVisibility`
- [x] T014 在 `src/scripts/moderation.js` 实现治理审计写入与状态流转（disable/enable/delete/restore + 写入审计记录）
- [x] T015 在 `src/scripts/interactions.js` 实现互动存储基元（like/unlike、favorite/unfavorite、download（同用户仅计 1 次）、计数维护）
- [x] T016 在 `src/routes/api.js` 接入 scripts API 路由（将 scripts 端点挂到 core api router，调用 `src/api/scripts.js`）
- [x] T017 在 `src/routes/index.js` 接入 scripts 页面路由（注册新的可重挂载 mount `scripts`，并挂载 `src/routes/scripts.js`）
- [x] T018 在 `src/routes/admin.js` 接入 scripts 管理端页面路由（挂载 `src/routes/admin/scripts.js`）
- [x] T019 在 `src/routes/write/admin.js` 或 `src/routes/admin.js` 接入 scripts 管理端 API 路由（遵循现有模式，路由到 `src/api/scripts.js` 的 admin handlers）
- [x] T020 确保所有 scripts 端点使用正确的中间件链（鉴权/CSRF/上传限制），通过 `src/routes/helpers.js` 的 helper（`setupApiRoute`）以及现有中间件（`ensureLoggedIn`、`applyCSRF`、`validateFiles`、uploads ratelimit）
- [x] T021 在 `src/scripts/index.js` 抽取并实现可复用的权限判断（can view / can edit / can moderate：owner vs admin/globalMod），并在各控制器中一致使用

**Checkpoint**: 基础能力完成 —— 各用户故事可以并行推进。

---

## Phase 3: User Story 1 - 上传剧本（JSON 文件）(Priority: P1) MVP

**Goal**: 已登录用户可上传 JSON 剧本（含必填元信息），并在自己的列表里看到它。

**Independent Test**: 按 Quickstart 的“1) 用户上传剧本”走通（`/scripts/upload`），并确认出现在“我的剧本”里。

- [ ] T022 [P] [US1] 在 `src/controllers/scripts.js` 实现上传页控制器 `GET /scripts/upload`
- [ ] T023 [P] [US1] 在 `src/views/scripts-upload.tpl` 实现上传页模板
- [ ] T024 [US1] 在 `src/api/scripts.js` 实现创建剧本端点 `POST /api/scripts`（接受文件或 `content`，`title`/`description` 必填，校验 JSON 可解析）
- [ ] T025 [US1] 在 `src/scripts/index.js` 实现 JSON 解析 + 大小限制 + 规范化存储（由 API create 调用）
- [ ] T026 [US1] 在 `src/scripts/index.js` 持久化剧本对象与 owner 索引（`script:{sid}`、`uid:{uid}:scripts`）
- [ ] T027 [US1] 在 `src/api/scripts.js` 增加无效 JSON / 缺少元信息的基础错误响应
- [ ] T028 [US1] 在 `public/src/client/scripts.js` 增加上传表单的前端行为（可选：预览/校验）

**Checkpoint**: 上传链路端到端可用；剧本数据包含正确的 owner 与元信息。

---

## Phase 4: User Story 2 - 浏览与管理自己的剧本列表 (Priority: P2)

**Goal**: 用户可以查看/更新/删除自己的剧本。

**Independent Test**: 上传 2 个剧本后打开 `/scripts/manage`，更新其中一个、删除其中一个，并确认页面状态正确更新。

- [ ] T029 [P] [US2] 在 `src/controllers/scripts.js` 实现“我的剧本”页控制器 `GET /scripts/manage`
- [ ] T030 [P] [US2] 在 `src/views/scripts-manage.tpl` 实现“我的剧本”页模板
- [ ] T031 [US2] 在 `src/api/scripts.js` 增加“我的剧本列表”数据端点（可选 `GET /api/scripts/manage`，或复用 `GET /api/scripts` + owner filter），并同步更新 `specs/002-script-management/contracts/http-api.md`
- [ ] T032 [US2] 在 `src/api/scripts.js` 实现更新端点 `PUT /api/scripts/:sid`（仅 owner；允许更新元信息与替换 content）
- [ ] T033 [US2] 在 `src/api/scripts.js` 实现删除端点 `DELETE /api/scripts/:sid`（仅 owner；将 `status=deleted` 并更新索引）
- [ ] T034 [US2] 在 `src/scripts/index.js` 确保已删除的剧本不出现在公开列表中
- [ ] T035 [US2] 在 `public/src/client/scripts.js` 接入 manage 页的前端动作（update/delete）

---

## Phase 5: User Story 5 - 点赞、收藏与“我的收藏”页签 (Priority: P2)

**Goal**: 已登录用户可以对公开剧本点赞/收藏，并查看“我的收藏”。

**Independent Test**: 对一个公开剧本点赞+收藏；打开 `/scripts/favorites`；取消收藏并确认从列表消失。

- [ ] T036 [P] [US5] 在 `src/controllers/scripts.js` 实现“我的收藏”页控制器 `GET /scripts/favorites`
- [ ] T037 [P] [US5] 在 `src/views/scripts-favorites.tpl` 实现“我的收藏”页模板
- [ ] T038 [US5] 在 `src/api/scripts.js` 实现点赞端点 `POST /api/scripts/:sid/like` 与 `DELETE /api/scripts/:sid/like`
- [ ] T039 [US5] 在 `src/api/scripts.js` 实现收藏端点 `POST /api/scripts/:sid/favorite` 与 `DELETE /api/scripts/:sid/favorite`
- [ ] T040 [US5] 在 `src/api/scripts.js` 实现“我的收藏列表”端点 `GET /api/scripts/favorites`
- [ ] T041 [US5] 在 `src/scripts/interactions.js` 使用 set 实现“同一用户最多计 1 次”的语义
- [ ] T042 [US5] 在 `src/scripts/interactions.js` + `src/scripts/index.js` 持久化并对外暴露 `likes`/`favorites` 计数
- [ ] T043 [US5] 在 `src/scripts/interactions.js` 维护热度分值（likes+favorites），在变更时更新 `scripts:public:hot`
- [ ] T044 [US5] 在 `public/src/client/scripts.js` 与 `src/views/script.tpl` 接入点赞/收藏按钮与状态渲染

---

## Phase 6: User Story 4 - 论坛剧本展示与筛选页签 (Priority: P3)

**Goal**: 论坛公开“剧本”页签展示公开剧本列表，支持搜索与按热度/下载量/时间排序；详情页按权限展示内容。

**Independent Test**: 打开 `/scripts`，搜索、排序、进入详情；确认 JSON 内容仅在有权限时展示。

- [ ] T045 [P] [US4] 在 `src/controllers/scripts.js` 实现剧本页签控制器 `GET /scripts`
- [ ] T046 [P] [US4] 在 `src/views/scripts.tpl` 实现剧本页签模板（列表 + 搜索 + 排序控件）
- [ ] T047 [US4] 在 `src/api/scripts.js` 实现公开列表 API `GET /api/scripts`（page + sort + q）
- [ ] T048 [US4] 在 `src/controllers/scripts.js` 实现详情页控制器 `GET /scripts/:sid`
- [ ] T049 [P] [US4] 在 `src/views/script.tpl` 实现详情页模板（元信息 + 计数 + 点赞/收藏按钮；按权限控制 JSON 展示）
- [ ] T050 [US4] 在 `src/api/scripts.js` 实现详情 API `GET /api/scripts/:sid`（仅在 canView 时返回 `content`）
- [ ] T051 [US4] 在 `src/scripts/index.js` 实现“剧本页签可见性”门禁（可配置，默认公开），并在 `src/controllers/scripts.js` 强制执行
- [ ] T052 [US4] 在 `src/api/scripts.js` 实现下载端点 `POST /api/scripts/:sid/download`，并在 `src/scripts/interactions.js` 实现存储（登录用户终身最多计 1 次）
- [ ] T053 [US4] 在 `src/scripts/interactions.js` 维护下载量排序索引 `scripts:public:downloads`
- [ ] T054 [US4] 在 `public/src/client/scripts.js` 接入列表交互（搜索/排序/分页）

---

## Phase 7: User Story 3 - 管理端审核与管理用户剧本 (Priority: P3)

**Goal**: 管理员可查看全站剧本、搜索/筛选、执行治理动作，并配置默认值。

**Independent Test**: 在 ACP `/admin/scripts` 下架某剧本并确认用户侧不可用；再恢复；并确认可查看审计记录。

- [ ] T055 [P] [US3] 在 `src/controllers/admin/scripts.js` 实现 ACP 列表页控制器 `GET /admin/scripts`
- [ ] T056 [P] [US3] 在 `src/views/admin/scripts.tpl` 实现 ACP 列表页模板
- [ ] T057 [US3] 在 `src/api/scripts.js` 实现管理端列表 API `GET /api/admin/scripts`（filters: q/uid/status/visibility）
- [ ] T058 [US3] 在 `src/api/scripts.js` 实现治理 API `POST /api/admin/scripts/:sid/moderate`（disable/enable/delete/restore + reason）
- [ ] T059 [US3] 在 `src/scripts/moderation.js` 持久化治理状态与审计记录，并在管理端列表 UI 中展示最近动作
- [ ] T060 [P] [US3] 在 `src/controllers/admin/scripts.js` 实现 ACP 配置页控制器 `GET /admin/scripts/config`
- [ ] T061 [P] [US3] 在 `src/views/admin/scripts-config.tpl` 实现 ACP 配置页模板
- [ ] T062 [US3] 在 `src/api/scripts.js` 实现管理端配置 API `GET/PUT /api/admin/scripts/config`，并在 `src/scripts/index.js` 通过 NodeBB 配置存储进行持久化

---

## Phase 8: 收尾与横切项

**Purpose**: 加固、安全一致性、文档与 quickstart 验收对齐。

- [ ] T063 [P] 在 `src/api/scripts.js` 统一权限/所有权相关的错误处理与错误码/提示
- [ ] T064 在 `src/routes/scripts.js` 与/或 `src/api/scripts.js` 对齐上传限流与文件校验（与 NodeBB 现有上传链路一致）
- [ ] T065 [P] 确保页面入口可在 header/nav 中被发现（在 `src/navigation/index.js` 添加导航项指引或自动添加 hook），或在 `specs/002-script-management/contracts/page-routes.md` 补充管理端配置说明
- [ ] T066 在 `src/scripts/index.js` 确保所有公开列表路径都排除 unavailable/deleted 与 private 的剧本
- [ ] T067 在 `src/controllers/scripts.js` + `src/views/script.tpl` 确保 unavailable 状态在详情页展示用户友好的提示
- [ ] T068 按 `specs/002-script-management/quickstart.md` 全流程走一遍，补齐缺失的端点/模板/前端接线
- [ ] T069 运行 lint/test 并修复问题（`eslint.config.mjs`、NodeBB test runner）

---

## 依赖关系与执行顺序

### 阶段依赖

- **准备阶段（Phase 1）**：无依赖
- **基础能力（Phase 2）**：依赖 Phase 1；会 **阻塞** 所有用户故事
- **用户故事（Phase 3+）**：依赖 Phase 2 完成
- **收尾阶段（Phase 8）**：依赖所选用户故事全部完成

### 用户故事依赖（建议顺序）

- **US1 (P1)**：Phase 2 完成后即可开始；为后续故事提供 MVP 基线
- **US2 (P2)**：依赖 Phase 2 的 CRUD 基元，且做过 US1 更便于人工验证（已有数据）
- **US5 (P2)**：依赖剧本存在与公开可见规则；可在 Phase 2 后推进（或 US1 后更好验收）
- **US4 (P3)**：依赖公开列表索引与可见性规则；通常在 US1+US5 后更顺（计数与数据更完整）
- **US3 (P3)**：依赖治理模块；可在 Phase 2 后推进

### 并行机会

- 标注 **[P]** 的任务适合并行（不同文件、耦合较小）。
- Phase 2 完成后可按团队拆分并行：
  - Dev A：US1 上传链路
  - Dev B：US4 公开页签列表/详情
  - Dev C：US3 管理端页面 + 治理
  - Dev D：US5 点赞/收藏 + 我的收藏

---

## Parallel Example: US1

```text
并行执行：
- 实现 `src/views/scripts-upload.tpl`
- 实现 `src/controllers/scripts.js`（上传页）
- 实现 `src/api/scripts.js`（POST /api/scripts）
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Phase 1 + Phase 2
2. Phase 3（US1）
3. 按 Quickstart 的“1) 用户上传剧本”验收

### Incremental Delivery

1. US1 → 上传可用
2. US2 → 我的剧本管理页
3. US5 → 点赞/收藏 + 我的收藏
4. US4 → 公开剧本页签（搜索/排序）
5. US3 → 管理端治理 + 配置


# Implementation Plan: 剧本（JSON）功能

**Branch**: `002-script-management` | **Date**: 2026-03-04 | **Spec**: [specs/002-script-management/spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-script-management/spec.md`

## Summary

在 NodeBB 二开论坛中新增“剧本（JSON）”资源体系：用户可上传/管理自己的剧本；论坛提供剧本页签用于公开剧本的浏览、搜索与按热度（点赞+收藏）/下载量排序；已登录用户可点赞/收藏并在“我的收藏”页签中查看；管理端可对用户剧本进行检索与治理（下架/封禁/删除/恢复），并支持配置默认可见性与页签可见范围。

## Technical Context

**Language/Version**: JavaScript (Node.js >= 20)  
**Primary Dependencies**: NodeBB 核心 + Express 4（内置）+ Benchpress 模板（内置）+ socket.io（内置）  
**Storage**: NodeBB 数据库抽象层（兼容 MongoDB / PostgreSQL / Redis 组合）  
**Testing**: Mocha/nyc（NodeBB 现有测试体系）  
**Target Platform**: Linux 服务器（容器化部署为推荐路径）  
**Project Type**: Web 应用（论坛系统）  
**Performance Goals**: 公共剧本页签在常见数据量下可快速首屏可用；交互（点赞/收藏）在用户感知上“即时生效”  
**Constraints**: 尽量通过插件/主题扩展点实现，减少对核心侵入；遵循现有权限/CSRF/上传校验与 UI/UX 规范  
**Scale/Scope**: 面向论坛级用户规模；需要支持分页、检索与排序

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 目标 1: 保持与上游 NodeBB 兼容 | ✅ | 优先通过插件挂载路由与页面；必要的 UI 调整尽量局部、可回滚 |
| 目标 2: 黄金路径可运维 | ✅ | 使用 NodeBB 既有上传/限流/审计模式；关键指标可通过日志/统计字段观测 |
| 目标 3: 技术栈基线 | ✅ | 不引入新技术栈，沿用 NodeBB 现有 Express/Benchpress/Bootstrap/DB 抽象 |
| 安全与隐私基线 | ✅ | 权限、越权防护、CSRF、上传校验与审计记录纳入设计 |

**结论**: Gate 通过，可进入 Phase 0。

## Project Structure

### Documentation (this feature)

```text
specs/002-script-management/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── contracts/           # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── controllers/
│   ├── scripts.js                 # 页面控制器：/scripts, /scripts/:id, /scripts/favorites
│   └── admin/scripts.js           # 管理端页面：剧本管理
├── api/
│   └── scripts.js                 # API 控制器：CRUD、列表、交互、管理端治理
├── routes/
│   ├── scripts.js                 # 页面路由挂载（通过 helpers.setupPageRoute）
│   ├── admin/scripts.js           # ACP 路由挂载（通过 helpers.setupAdminPageRoute）
│   └── api.js                     # 若采用 core api router，需注册 scripts API 路由
├── scripts/
│   ├── index.js                   # 领域服务：CRUD、可见性、列表、校验
│   ├── interactions.js            # 点赞/收藏/计数/我的收藏
│   └── moderation.js              # 下架/封禁/恢复/审计
└── ...

src/views/
├── scripts.tpl                     # 剧本页签列表
├── script.tpl                      # 剧本详情
└── account/favorites.tpl           # 我的收藏（或放在现有 accounts 模块下）

public/src/client/
├── scripts.js                      # 页签交互：搜索/筛选/排序/点赞/收藏
└── ...
```

**Structure Decision**: 以 NodeBB 现有 `src/routes` + `src/controllers` + `src/api` + 领域模块方式落地；若团队更偏好插件化，可将同结构迁移至独立插件并通过 `filter:router.add` 挂载路由，保持最小侵入。

## Phase 0: Research

输出：`research.md`（所有关键设计点不留 NEEDS CLARIFICATION）

研究与决策主题：

- 数据存储模型：剧本 JSON 的存放方式、大小限制与导出/下载策略
- 列表/排序/搜索：如何在 NodeBB DB 抽象能力内实现可扩展的查询与分页
- 点赞/收藏：复用 NodeBB 现有集合/有序集合模式（参考 post votes/bookmarks），定义一致的计数口径
- 上传与安全：如何复用 `multer`、`validateFiles`、CSRF、限流与权限中间件
- 管理端治理：ACP 页面与 API 的权限模型（复用 admin privilege 体系）与审计记录

## Phase 1: Design & Contracts

输出：

- `data-model.md`
- `contracts/http-api.md`
- `contracts/page-routes.md`
- `contracts/admin-contracts.md`
- `quickstart.md`

设计任务：

- 将 `spec.md` 中的实体与口径落到可实现的数据模型（跨 DB 后端兼容）
- 明确定义页面路由与 API 合约（请求/响应字段、错误码与权限边界）
- 明确管理端治理动作及审计字段

## Phase 1: Agent Context Update

计划动作：基于本 `plan.md` 更新 Cursor/Agent 上下文文件（例如 `.cursor/rules/specify-rules.mdc`）。  
备注：若环境无法运行仓库内 bash 脚本，则以手工方式创建/更新等价文件内容（从 `.specify/templates/agent-file-template.md` 生成）。

## Phase 2: Tasks (stop here)

`/speckit.plan` 在完成 Phase 1 文档后停止；下一步用 `/speckit.tasks` 生成可执行任务拆解。


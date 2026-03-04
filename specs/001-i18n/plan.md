# Implementation Plan: 多语言切换功能

**Branch**: `001-i18n` | **Date**: 2026-03-04 | **Spec**: [specs/001-i18n/spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-i18n/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. Updated to include main UI language switch button.

## Summary

实现 NodeBB 论坛的多语言切换功能，默认语言为中文，用户可以在中文和英文之间自由切换，语言偏好持久保存。**新增需求：在主界面导航栏添加语言切换按钮。**

## Technical Context

**Language/Version**: JavaScript (Node.js >= 20)  
**Primary Dependencies**: NodeBB 核心, express (NodeBB 内置), socket.io (NodeBB 内置)  
**Storage**: MongoDB/PostgreSQL/Redis (NodeBB 支持的数据库)  
**Testing**: Mocha (NodeBB 测试框架)  
**Target Platform**: Linux 服务器 (容器化部署)  
**Project Type**: Web 应用 (论坛系统)  
**Performance Goals**: 语言切换响应时间 < 1 秒  
**Constraints**: 遵循 NodeBB 主题模型和插件机制  
**Scale/Scope**: 论坛级应用，支持多用户

## Constitution Check

*Re-check after design completion*

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 目标 1: 保持与上游 NodeBB 兼容 | ✅ | 通过配置和主题扩展实现，不修改核心 |
| 目标 3: 技术栈基线 | ✅ | 使用 NodeBB 内置技术栈 |
| 后端: Express 4 | ✅ | NodeBB 基于 Express |
| 后端: 数据库支持 | ✅ | 兼容 MongoDB/PostgreSQL/Redis |
| 前端: Benchpress 模板 | ✅ | 使用 NodeBB 模板引擎 |
| 前端: Bootstrap 5 + SCSS | ✅ | 遵循现有样式规范 |
| 代码: ESLint 检查 | ✅ | 使用 NodeBB ESLint 配置 |

**结论**: 所有检查项通过，无违规。

## Project Structure

### Documentation (this feature)

```
specs/001-i18n/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # (will be created by /speckit.tasks)
```

### Source Code (repository root)

基于 NodeBB 二次开发项目结构：

```
src/
├── controllers/         # 控制器（如需要自定义路由）
├── routes/             # 路由配置
└── ...

public/
├── src/client/         # 客户端 JavaScript
└── ...

node_modules/           # 依赖（已有）
```

**Structure Decision**: 复用 NodeBB 现有结构，通过主题（theme）或插件（plugin）方式扩展 i18n 功能，利用 NodeBB 内置的国际化和主题系统。

## Phase 0: Research

### NodeBB i18n 机制研究

NodeBB 内置了完善的多语言支持系统，基于 `nodebb-theme-harmony` 主题和国际化文件。需要研究：

1. **现有语言文件位置**: `public/language/{lang}/*.json`
2. **语言切换 API**: NodeBB 提供的用户设置接口
3. **主题多语言支持**: 如何在主题中实现语言切换

### 方案选择

**推荐方案**: 利用 NodeBB 现有的国际化基础设施，通过主题扩展实现语言切换功能。

- 优点：最小侵入，兼容上游升级
- 不需要额外依赖

## Phase 1: Design

### Data Model

见 `data-model.md`

### 接口设计

NodeBB 已提供用户语言设置接口：
- GET `/api/user/:userslug/settings`
- POST `/api/user/:userslug/settings`

前端通过 Socket.IO 或 AJAX 调用即可。

### Quickstart

见 `quickstart.md`

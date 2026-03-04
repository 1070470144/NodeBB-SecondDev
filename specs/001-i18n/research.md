# Research: 多语言切换功能

**Feature**: 001-i18n - 多语言切换功能  
**Date**: 2026-03-04

## Research Questions

### 1. NodeBB 现有的国际化机制

**Decision**: 使用 NodeBB 内置的国际化和用户设置系统

**Rationale**:
- NodeBB 已有完整的 i18n 支持，基于 `public/language/{lang}/` 目录下的 JSON 文件
- 用户设置中已有语言偏好选项
- 无需额外依赖，遵循最小侵入原则

**Alternatives considered**:
- 自行实现 i18n 系统 → 复杂度高，违背兼容性目标
- 使用第三方 i18n 插件 → 增加依赖，可能不兼容

### 2. 语言切换入口的实现位置

**Decision**: 在主题的导航栏或用户菜单中添加语言切换入口

**Rationale**:
- 遵循 NodeBB 的 UI 模式
- 用户可在任意页面发现和使用
- 与 NodeBB 现有组件风格一致

**Alternatives considered**:
- 独立设置页面 → 需要额外开发，入口不够明显
- 仅在登录页面 → 访客无法切换

### 3. 语言偏好的存储方式

**Decision**: 复用 NodeBB 用户设置系统

**Rationale**:
- 已登录用户：存储在用户配置中
- 访客：使用客户端存储（localStorage/Cookie）
- 数据持久化已有完善机制

**Alternatives considered**:
- 新建独立的语言设置表 → 增加复杂度
- 仅使用 Cookie → 登录后无法跨设备同步

### 4. 默认语言设置

**Decision**: 中文作为默认语言

**Rationale**:
- 符合项目主要用户群体需求
- 在 NodeBB 配置中设置默认语言为 `zh-CN`

---

## Conclusion

本功能将利用 NodeBB 内置的国际化系统，仅需：
1. 配置默认语言为中文
2. 添加前端语言切换 UI
3. 集成用户语言偏好设置

无需修改核心代码，完全通过配置和主题/插件扩展实现。

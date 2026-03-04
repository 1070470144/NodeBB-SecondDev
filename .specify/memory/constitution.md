<!--
同步影响说明（Sync Impact Report）
- 版本变更： (none) → v1.0.0
- 被修改/新增的原则：初始版本
- 新增章节：
  - 项目概述与目标（Project Overview & Goals）
  - 技术栈基线（Technical Stack Baseline）
  - UI & UX 指南（UI & UX Guidelines）
  - 代码规范与架构（Coding Standards & Architecture）
  - 测试、质量与性能（Testing, Quality, and Performance）
  - 安全与隐私（Security & Privacy）
  - 治理与版本管理（Governance & Versioning）
- 删除章节：无
- 需要后续对齐/更新的模板（⚠ 当前仓库中不存在，仅作占位说明）：
  - ⚠ .specify/templates/plan-template.md
  - ⚠ .specify/templates/spec-template.md
  - ⚠ .specify/templates/tasks-template.md
  - ⚠ .specify/templates/commands/*.md
- 延期处理的 TODO：
  - TODO(RATIFICATION_DATE)：确认是否需要将 2026-03-04 回溯为本二开项目真正开始的日期。
-->

## 项目宪章：NodeBB 二次开发（Secondary Development）

**项目名称（Project Name）：** NodeBB-SecondDev  
**宪章版本（Constitution Version）：** v1.0.0  
**RATIFICATION_DATE：** TODO(RATIFICATION_DATE)：请填写本宪章正式生效日期  
**LAST_AMENDED_DATE：** 2026-03-04


## 一、项目概述与目标（Project Overview & Goals）

本项目是在上游 NodeBB 论坛软件基础上的**二次开发（secondary development / 二开）**。  
整体目标为：

- **目标 1——尽可能保持与上游 NodeBB 核心兼容**
  - 本仓库中的修改应尽量**减少对 NodeBB 核心逻辑的侵入式改动**，以便未来可以更轻松地从上游升级。
  - 在可行的情况下，新的功能应**优先通过插件（plugins）、主题（themes）、配置（configuration）或 NodeBB 提供的扩展点（extension points）来实现**，而不是直接改核心。

- **目标 2——为部署与运维提供有主见的默认方案**
  - 项目应尽量提供一套被文档化的“黄金路径”（golden path）部署方案，包括：
    - 推荐使用的数据库；
    - 推荐的反向代理（如 Nginx 等）；
    - 基础监控与日志建议等。

- **目标 3——建立清晰的技术栈基线与 UI 规范**
  - 项目必须**明确列出后端与前端所支持的技术栈版本**，并与 `install/package.json` 中的定义保持同步。
  - 项目必须定义统一的 **UI/UX 约定**（布局、排版、颜色、间距、组件与主题规则），以便不同团队做二次开发时，界面风格仍然一致。


## 二、技术栈基线（Technical Stack Baseline）

### 2.1 运行环境与平台（Runtime & Platform）

- **Node.js**
  - 项目必须运行在 **Node.js >= 20**（与 `install/package.json` 中要求保持一致）。
  - 新增代码必须兼容生产环境中实际采纳的 Node.js LTS 版本。

- **操作系统与部署（Operating System & Deployment）**
  - 项目应支持部署在主流的现代 Linux 发行版上。
  - 推荐部署方式为基于容器（Container-based），使用仓库内提供的 `Dockerfile` 与 `docker-compose*.yml` 等文件。


### 2.2 后端技术（Backend Technologies）

- **Web 框架与服务（Web Framework & Server）**
  - 后端基于 **Express 4** 和 NodeBB 标准服务组件构建。
  - 新增 HTTP 接口必须通过 NodeBB 现有的路由层来实现（例如在 `src/controllers` 下编写控制器，在 `src/routes` 下配置路由），而不是自行随意新建独立服务器。

- **数据库（Databases）**
  - 支持的数据库类型与上游 NodeBB 保持一致：
    - **Redis**
    - **MongoDB**
    - **PostgreSQL**
  - 对于本二开项目，推荐的新部署基线为：
    - 主数据存储：**PostgreSQL** 或 **MongoDB**（每个环境择一，并在部署文档中明确记录）。
    - 缓存 / 发布订阅 / 集群：**Redis**。
  - 新特性如依赖某个数据库的特定能力，必须：
    - 要么为所有支持的数据库提供等价行为；
    - 要么在文档中清晰标记：该特性**仅支持选定的主数据库**。

- **实时通信（Real-time Communication）**
  - 所有实时功能必须使用 NodeBB 核心已经集成的 **socket.io 4.x**。
  - 新增的实时事件必须遵循既有的事件命名约定，并正确执行认证与鉴权检查。


### 2.3 前端技术栈（Frontend Stack）

- **JavaScript 与模块模式（JavaScript & Module Pattern）**
  - 客户端代码主要采用 ES5/ES2015 风格的 JavaScript，使用 NodeBB 在 `public/src/**`、`public/src/client/**` 中的模块模式。
  - 新增前端模块应当：
    - 在合适的地方集成进 NodeBB 既有的 AMD/webpack 构建体系；
    - 避免引入新的全局变量，尽量使用既有模块模式。

- **模板引擎（Templating）**
  - 主模板引擎为 **Benchpress.js**（`.tpl` 模板位于 `src/views` 与 `public/templates`）。
  - 新增的页面与组件应优先实现为 Benchpress 模板，除非有充分理由采用其他方式。

- **样式与主题（Styling & Theming）**
  - 基线 CSS 框架为 **Bootstrap 5**（5.3.x），与 NodeBB 主题保持一致。
  - 样式采用 **SCSS** 编写，存放于 `public/scss/**`，并通过 **webpack 5** 与 **sass** 进行构建。
  - 字体：
    - 默认 UI 字体为 **Inter** 与 **Poppins**（来自 `@fontsource/inter` 与 `@fontsource/poppins`）。
  - 图标：
    - 图标应优先使用 **Font Awesome 6**（`@fortawesome/fontawesome-free`），以保持统一的图标风格。


## 三、UI & UX 指南（UI & UX Guidelines）

### 3.1 总体原则（General Principles）

- **原则：一致且可主题化的设计（Consistent, Theme-able Design）**
  - 所有 UI 变更必须尊重 NodeBB 的主题模型（如 `nodebb-theme-harmony`、`nodebb-theme-persona` 等）。
  - 针对本二开项目的视觉定制，优先通过独立主题或主题扩展来实现，而非直接在核心模板中硬编码样式（在可行的前提下）。

- **原则：响应式、移动优先布局（Responsive, Mobile-first Layout）**
  - 布局必须在手机、平板与桌面端都保持可用、易用。
  - 在可能的情况下，应优先使用 Bootstrap 的栅格系统与响应式工具类，而不是大量自定义媒体查询。

- **原则：可访问性（Accessibility）**
  - 文本与关键 UI 元素的颜色对比度，应在可行范围内遵循 WCAG AA 要求。
  - 所有可交互组件必须支持键盘操作，并提供清晰的焦点（focus）状态。


### 3.2 布局与间距（Layout & Spacing）

- **布局（Layout）**
  - 基础布局必须使用 Bootstrap 的容器与栅格工具，避免大量自定义绝对定位（除非是例如 toast 这类特殊组件）。
  - 侧边栏、导航栏与内容区域的结构，应尽量与基础主题保持对齐，以减少将来与上游合并时的冲突。

- **间距刻度（Spacing Scale）**
  - 间距应采用少量固定的标准刻度（例如 4、8、12、16、24、32px），通过 SCSS 变量和 Bootstrap 的工具类来实现。
  - 应避免到处写零散的像素值；优先使用间距变量和 `.p-*`、`.m-*` 等工具类。


### 3.3 颜色与排版（Colour & Typography）

- **颜色（Colour）**
  - 主色调应通过 SCSS 变量来定义，并映射到 Bootstrap 的主题颜色（如 `$primary`、`$secondary` 等）。
  - 本二开项目新增的品牌色，必须以变量形式加入，并通过工具类或组件样式使用，而非在模板中硬编码十六进制色值。

- **排版（Typography）**
  - 默认字体栈应基于 Inter / Poppins，并配置合适的回退字体。
  - 标题层级（h1–h6）必须语义化使用；视觉效果如大小、粗细的调整应通过 SCSS 完成，而不是滥用标题标签等级。


### 3.4 组件与交互（Components & Interactions）

- **按钮与链接（Buttons & Links）**
  - 操作类按钮应使用 Bootstrap 的 `.btn` 系列样式（如 `.btn-primary` 等）。
  - 文本链接必须在视觉上区别于按钮，并提供悬停（hover）与焦点（focus）状态。

- **表单（Forms）**
  - 表单应优先使用 Bootstrap 表单组件，并与 NodeBB 既有的校验与错误展示模式集成。

- **反馈与通知（Feedback & Notifications）**
  - 优先使用现有的 toast / alert 组件。
  - 新的通知类型应尽量复用当前通知中心与 socket 通道，而不是另起一套独立机制。


## 四、代码规范与架构（Coding Standards & Architecture）

- **JavaScript 风格（JavaScript Style）**
  - 代码必须通过当前项目配置的 ESLint 检查（`eslint.config.mjs`、`eslint-config-nodebb`）。
  - 鼓励使用小而可组合的函数与模块，并遵循既有目录结构（`src/**`、`public/src/**`）。

- **关注点分离（Separation of Concerns）**
  - 业务逻辑应尽量放在 `src/**` 下的模块，而不是堆在控制器或模板中。
  - 控制器应保持“瘦”：只做参数校验、调用服务层、返回结果。

- **可扩展性（Extensibility）**
  - 在新增行为时，应优先考虑：
    - 复用或挂接到已有的事件与插件 API；
    - 在确实需要第三方扩展的地方，提供新的插件钩子（plugin hooks）。


## 五、测试、质量与性能（Testing, Quality, and Performance）

- **自动化测试（Automated Tests）**
  - 新功能与关键性 Bug 修复，应在 `test/**` 下补充相应测试，用项目当前的 Mocha/nyc 测试体系运行。

- **性能（Performance）**
  - 代码修改必须避免在事件循环上增加不必要的阻塞操作。
  - 修改前端代码时，应关注打包体积；能复用现有依赖就避免随意增加新依赖，除非确有需求。


## 六、安全与隐私（Security & Privacy）

- **安全基线（Security Baseline）**
  - 所有涉及安全的改动（认证、授权、数据导出、个人数据处理等），至少需要另一位开发者进行评审。
  - 与安全相关的新配置项，必须在 README 或部署文档中说明清楚。

- **数据保护（Data Protection）**
  - 处理个人数据的功能，应当遵循数据最小化原则，并提供相应的访问控制。


## 七、治理与版本管理（Governance & Versioning）

- **修订流程（Amendment Procedure）**
  - 对本宪章的任何修改，都必须通过 Pull Request 提出，并在说明中明确：
    - 修改的动机；
    - 对现有代码、贡献者以及部署带来的影响。
  - 至少需要一名非作者的维护者（maintainer）进行审批。

- **宪章版本管理策略（Versioning Policy for the Constitution）**
  - 宪章版本采用 **语义化版本（semantic versioning）**：
    - **MAJOR**：引入不兼容的治理变更，或对核心原则做了“删除/完全重定义”。
    - **MINOR**：新增原则，或对现有原则进行大幅扩展说明。
    - **PATCH**：文字澄清、表述优化、排版修正等不影响语义的修改。
  - 每次修订必须同步更新：
    - `Constitution Version`
    - `LAST_AMENDED_DATE`
    - 本文件顶部的 Sync Impact Report 注释块。

- **合规性审查（Compliance Review）**
  - 在方案设计、需求评审阶段，团队应显式地对照以下内容检查计划变更：
    - 技术栈基线（Technical Stack Baseline）
    - UI & UX 指南（UI & UX Guidelines）
    - 代码规范与架构（Coding Standards & Architecture）
  - 对这些基线有实质偏离的变更，必须在设计文档中单独说明并给出理由；  
    如果未来此偏离成为新的常态标准，应跟进更新本宪章。

<!--
Sync Impact Report
- Version change: (none) → v1.0.0
- Modified principles: (initial version)
- Added sections:
  - Project Overview & Goals
  - Technical Stack Baseline
  - UI & UX Guidelines
  - Coding Standards & Architecture
  - Testing, Quality, and Performance
  - Security & Privacy
  - Governance & Versioning
- Removed sections: (none)
- Templates requiring updates (⚠ pending — templates not present in this repo):
  - ⚠ .specify/templates/plan-template.md
  - ⚠ .specify/templates/spec-template.md
  - ⚠ .specify/templates/tasks-template.md
  - ⚠ .specify/templates/commands/*.md
- Deferred TODOs:
  - TODO(RATIFICATION_DATE): Confirm if 2026-03-04 should be backdated to the actual date this fork started.
-->

## Project Constitution: NodeBB Secondary Development

**Project Name:** NodeBB-SecondDev  
**Constitution Version:** v1.0.0  
**RATIFICATION_DATE:** TODO(RATIFICATION_DATE): confirm actual project start date  
**LAST_AMENDED_DATE:** 2026-03-04


## Project Overview & Goals

This project is a **secondary development (二开)** based on the upstream NodeBB forum
software. Its goals are:

- **Goal 1 – Stay compatible with upstream NodeBB core**
  - The fork MUST minimise invasive changes to NodeBB core logic to ease future
    upgrades from upstream.
  - Where possible, new functionality MUST be implemented via plugins, themes,
    configuration, or extension points provided by NodeBB.

- **Goal 2 – Provide opinionated defaults for deployment and operations**
  - The project SHOULD provide a documented “golden path” for deployment
    (preferred database, reverse proxy, and basic monitoring).

- **Goal 3 – Establish a clear technical stack baseline and UI specification**
  - The project MUST explicitly pin the backend and frontend technology stack
    versions it supports and must keep these in sync with `install/package.json`.
  - The project MUST define UI/UX conventions (layout, typography, colours,
    spacing, components, and theming rules) so that secondary development by
    different teams remains visually consistent.


## Technical Stack Baseline

### Runtime & Platform

- **Node.js**
  - The project MUST run on **Node.js >= 20** (as required by `install/package.json`).
  - New code MUST be compatible with the Node.js LTS version used in production.

- **Operating System & Deployment**
  - The project SHOULD support deployment on modern Linux distributions.
  - Container-based deployment using the provided `Dockerfile` and
    `docker-compose*.yml` files is the recommended path.


### Backend Technologies

- **Web Framework & Server**
  - The backend is built on **Express 4** and standard NodeBB server components.
  - New HTTP endpoints MUST be implemented through NodeBB’s routing layer
    (e.g. controllers under `src/controllers` and routes under `src/routes`)
    instead of ad‑hoc servers.

- **Databases**
  - Supported databases remain aligned with upstream NodeBB:
    - **Redis**
    - **MongoDB**
    - **PostgreSQL**
  - For this fork, the **preferred baseline** for new deployments is:
    - Primary data store: **PostgreSQL** or **MongoDB** (choose one per
      environment and document it in deployment docs).
    - Caching / pub-sub / clustering: **Redis**.
  - New features that rely on database-specific functionality MUST either:
    - Provide equivalent behaviour across all supported databases, or
    - Be clearly documented as only supported on the chosen primary database.

- **Real-time Communication**
  - Real-time features MUST use **socket.io 4.x** as wired in NodeBB core.
  - New real-time events MUST follow existing event naming conventions and
    authentication/authorisation checks.


### Frontend Stack

- **JavaScript & Module Pattern**
  - Client code is predominantly ES5/ES2015-style JavaScript using NodeBB’s
    module patterns in `public/src/**` and `public/src/client/**`.
  - New frontend modules MUST:
    - Integrate with NodeBB’s existing AMD/webpack build where appropriate.
    - Avoid introducing new global variables; use existing module patterns.

- **Templating**
  - The primary templating engine is **Benchpress.js** (`.tpl` files under
    `src/views` and `public/templates`).
  - New UI pages and components MUST be implemented as Benchpress templates
    unless there is a strong justification for using a different approach.

- **Styling & Theming**
  - The baseline CSS framework is **Bootstrap 5** (5.3.x) as used by NodeBB’s
    themes.
  - Styles are authored in **SCSS** under `public/scss/**`, compiled via
    **webpack 5** and **sass**.
  - Fonts:
    - Primary UI font families are **Inter** and **Poppins** (from
      `@fontsource/inter` and `@fontsource/poppins`).
  - Icons:
    - Icons MUST use **Font Awesome 6** (`@fortawesome/fontawesome-free`) where
      possible, to keep a consistent iconography.


## UI & UX Guidelines

### General Principles

- **Principle – Consistent, Theme-able Design**
  - All UI changes MUST respect the NodeBB theming model (themes such as
    `nodebb-theme-harmony`, `nodebb-theme-persona`, etc.).
  - New visual customisations for this fork SHOULD be implemented in a
    dedicated theme or theme extension, not hard-coded into core templates
    whenever feasible.

- **Principle – Responsive, Mobile-first Layout**
  - Layouts MUST remain usable on mobile, tablet, and desktop form factors.
  - Bootstrap’s grid system and responsive utilities SHOULD be preferred over
    custom media queries where possible.

- **Principle – Accessibility**
  - Colour contrast MUST be sufficient for text and key UI elements following
    WCAG AA where feasible.
  - Interactive components MUST be keyboard accessible and provide appropriate
    focus states.


### Layout & Spacing

- **Layout**
  - Base layouts MUST use Bootstrap’s container/grid utilities, avoiding custom
    absolute positioning except for specialised components (e.g. toasts).
  - Sidebars, navbars, and content areas MUST remain aligned with the base
    theme’s layout structure to minimise merge conflicts with upstream.

- **Spacing Scale**
  - Spacing MUST follow a small set of standard steps (e.g. 4, 8, 12, 16, 24,
    32px) implemented as SCSS variables and Bootstrap utility classes.
  - Ad-hoc pixel values SHOULD be avoided; prefer variables or Bootstrap
    spacing utilities (`.p-*`, `.m-*`, etc.).


### Colour & Typography

- **Colour**
  - The primary colour palette MUST be defined via SCSS variables and mapped to
    Bootstrap theme colours (`$primary`, `$secondary`, etc.).
  - Brand-specific colours introduced by this fork MUST be added as variables
    and used via utility classes or component styles, not hard-coded hex
    values in templates.

- **Typography**
  - The default font stack SHOULD be based on Inter / Poppins with appropriate
    fallbacks.
  - Heading hierarchy (h1–h6) MUST be used semantically; visual adjustments
    SHOULD be done via SCSS rather than misusing heading levels.


### Components & Interactions

- **Buttons & Links**
  - Use Bootstrap button classes (`.btn`, `.btn-primary`, etc.) for actions.
  - Text links MUST be visually distinguishable from buttons and provide hover
    and focus states.

- **Forms**
  - Forms MUST use Bootstrap form controls by default and integrate with
    NodeBB’s validation/error display patterns.

- **Feedback & Notifications**
  - Use existing toast/alert components where available.
  - New notification types SHOULD reuse the current notification centre and
    socket channels instead of inventing parallel mechanisms.


## Coding Standards & Architecture

- **JavaScript Style**
  - Code MUST pass the existing ESLint configuration (`eslint.config.mjs`,
    `eslint-config-nodebb`).
  - Prefer small, composable functions and modules aligned with existing file
    structure (`src/**`, `public/src/**`).

- **Separation of Concerns**
  - Business logic SHOULD live in `src/**` modules and not in controllers or
    templates where possible.
  - Controllers MUST remain thin: parameter validation, calling services, and
    returning responses.

- **Extensibility**
  - When adding new behaviours, prefer:
    - Hooking into existing events and plugin APIs.
    - Providing new plugin hooks where extension by third parties is expected.


## Testing, Quality, and Performance

- **Automated Tests**
  - New features and critical bugfixes SHOULD include tests under `test/**`
    using the project’s Mocha/nyc setup.

- **Performance**
  - Changes MUST avoid unnecessary blocking operations on the event loop.
  - When modifying client code, pay attention to bundle size; reuse existing
    dependencies instead of adding new ones unless necessary.


## Security & Privacy

- **Security Baseline**
  - Security-sensitive changes (authentication, authorisation, data export,
    personal data) MUST be reviewed by at least one additional developer.
  - Any new configuration related to security MUST be documented in README or
    deployment docs.

- **Data Protection**
  - Features handling personal data MUST consider data minimisation and provide
    appropriate access control.


## Governance & Versioning

- **Amendment Procedure**
  - Any change to this constitution MUST be proposed via a pull request that
    clearly explains:
    - The motivation for the change.
    - The impact on existing code, contributors, and deployments.
  - At least one maintainer other than the author MUST approve the change.

- **Versioning Policy (for the Constitution)**
  - Versions follow **semantic versioning**:
    - **MAJOR**: Backward-incompatible governance changes or removal/
      redefinition of core principles.
    - **MINOR**: Addition of new principles or significantly expanded
      guidance.
    - **PATCH**: Clarifications, wording improvements, or non-semantic fixes.
  - Each amendment MUST update:
    - `Constitution Version`
    - `LAST_AMENDED_DATE`
    - The Sync Impact Report comment at the top of this file.

- **Compliance Review**
  - During planning and design phases, teams SHOULD explicitly check planned
    changes against:
    - Technical Stack Baseline
    - UI & UX Guidelines
    - Coding Standards & Architecture
  - Material deviations MUST be called out in design documents and justified,
    with a follow-up task to update this constitution if the deviation becomes
    the new standard.



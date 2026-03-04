# Quickstart: 多语言切换功能

## 前置条件

- NodeBB 4.9.1 已运行
- MongoDB/PostgreSQL/Redis 已配置
- 管理员账户已创建

## 快速开始

### 步骤 1: 设置默认语言为中文

**方法一：通过管理后台**
在 NodeBB 管理后台 (`/admin/settings/general`):
- 找到 "Language" 设置
- 选择 `简体中文 (zh-CN)` 作为默认语言

**方法二：通过数据库直接设置**
```javascript
// MongoDB
db.objects.updateOne({_key: 'config'}, {$set: {defaultLang: 'zh-CN'}})
```

### 步骤 2: 添加语言切换入口 (已实现)

在用户菜单中添加了语言切换选项:

**文件**: `node_modules/nodebb-theme-harmony/templates/partials/sidebar/user-menu.tpl`

已添加语言切换菜单项:
```html
<li>
    <a href="#" class="dropdown-item rounded-1 d-flex align-items-center gap-2" component="header/language" role="menuitem">
        <i class="fa fa-fw fa-globe text-secondary"></i> <span>[[global:language]]</span>
    </a>
</li>
```

### 步骤 3: 前端语言切换逻辑 (已实现)

**文件**: `public/src/client/header.js`

已实现 JavaScript 处理逻辑:
- 登录用户：通过 API 更新用户语言设置
- 访客：使用 localStorage 存储语言偏好

### 步骤 4: 添加中文语言翻译 (已完成)

**文件**: `public/language/zh-CN/global.json`

已添加翻译:
```json
"language": "语言"
```

## 验证

1. 访问网站，确认默认显示中文
2. 点击右上角用户头像，打开菜单
3. 点击"语言"选项
4. 页面刷新后确认显示英文/中文切换

## 常用语言代码

| 代码 | 语言 |
|------|------|
| zh-CN | 简体中文 |
| zh-TW | 繁體中文 |
| en-US | English (US) |
| en-GB | English (UK) |

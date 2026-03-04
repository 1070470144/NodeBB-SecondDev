# Quickstart: 多语言切换功能

## 前置条件

- NodeBB 4.9.1 已运行
- MongoDB/PostgreSQL/Redis 已配置
- 管理员账户已创建

## 快速开始

### 步骤 1: 设置默认语言为中文

在 NodeBB 管理后台 (`/admin/settings/general`):
- 找到 "Language" 设置
- 选择 `简体中文 (zh-CN)` 作为默认语言

或者通过配置文件 `config.json`:

```json
{
    "defaultLang": "zh-CN"
}
```

### 步骤 2: 添加语言切换 UI

在主题的导航栏模板中添加语言切换下拉菜单:

**文件**: `node_modules/nodebb-theme-harmony/templates/header.tpl` (或主题覆盖)

添加语言切换按钮到导航栏:

```html
<div class="language-selector dropdown">
    <button class="btn btn-link dropdown-toggle" data-bs-toggle="dropdown">
        <i class="fa fa-globe"></i> <span class="current-lang">{language}</span>
    </button>
    <ul class="dropdown-menu dropdown-menu-end">
        <li><a class="dropdown-item" href="#" data-lang="zh-CN">简体中文</a></li>
        <li><a class="dropdown-item" href="#" data-lang="en-US">English</a></li>
    </ul>
</div>
```

### 步骤 3: 前端语言切换逻辑

**文件**: `public/src/client/header.js` (或新建)

```javascript
$(document).ready(function() {
    // 语言切换点击事件
    $('.language-selector [data-lang]').on('click', function(e) {
        e.preventDefault();
        const newLang = $(this).data('lang');
        
        // 调用 NodeBB API 更新语言设置
        $.post('/api/user/' + app.user.userslug + '/settings', {
            language: newLang
        }, function() {
            // 刷新页面以应用新语言
            window.location.reload();
        });
    });
});
```

### 步骤 4: 访客语言设置 (可选)

对于未登录用户，使用 localStorage:

```javascript
// 读取语言设置
const guestLang = localStorage.getItem('nodebb_language') || 'zh-CN';

// 设置语言
localStorage.setItem('nodebb_language', 'en-US');
```

## 验证

1. 访问网站，确认默认显示中文
2. 点击语言切换按钮，选择 English
3. 页面刷新后确认显示英文
4. 刷新页面确认语言设置已保存

## 常用语言代码

| 代码 | 语言 |
|------|------|
| zh-CN | 简体中文 |
| zh-TW | 繁體中文 |
| en-US | English (US) |
| en-GB | English (UK) |

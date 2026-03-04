# Data Model: 多语言切换功能

## 实体设计

### 1. 用户语言设置 (User Language Preference)

NodeBB 已有内置支持，无需新增数据表。

| 字段 | 类型 | 说明 |
|------|------|------|
| uid | Integer | 用户 ID |
| language | String | 语言代码 (如 `zh-CN`, `en-US`) |

**存储位置**: NodeBB 用户设置表 (`objects` 集合或对应数据库)

### 2. 访客语言设置 (Guest Language Preference)

使用客户端存储，无需服务端数据表。

| 字段 | 类型 | 说明 |
|------|------|------|
| nodebb_language | String | 语言代码 (如 `zh-CN`, `en-US`) |

**存储位置**: Browser localStorage 或 Cookie

## API 接口

### 获取用户语言设置

- **Endpoint**: `GET /api/user/:userslug/settings`
- **Response**: 包含 `language` 字段

### 更新用户语言设置

- **Endpoint**: `POST /api/user/:userslug/settings`
- **Body**: `{ language: "zh-CN" }` 或 `{ language: "en-US" }`

### 获取可用语言列表

- **Endpoint**: `GET /api/languages`
- **Response**: 可用语言列表

## 前端数据模型

### 语言切换组件状态

```javascript
{
    currentLanguage: "zh-CN",  // 当前语言
    availableLanguages: [       // 可用语言列表
        { code: "zh-CN", name: "简体中文" },
        { code: "en-US", name: "English (US)" }
    ],
    isLoading: false           // 切换中状态
}
```

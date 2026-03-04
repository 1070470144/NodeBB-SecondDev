# Data Model: 剧本（JSON）功能

**Feature**: 002-script-management  
**Date**: 2026-03-04  
**Source**: `specs/002-script-management/spec.md`, `specs/002-script-management/research.md`

## Overview

本功能的数据模型以 NodeBB 数据库抽象层为基础，采用：

- **Object（对象）**：存储剧本元信息与 JSON 内容
- **Set（集合）**：存储点赞/收藏的用户集合（去重）
- **Sorted Set（有序集合）**：存储列表与“我的收藏”等按时间或热度/下载量排序的索引

## Entities

### 1) Script（剧本）

表示一个用户上传的剧本资源（JSON 内容 + 元信息）。

| 字段 | 类型 | 说明 |
|------|------|------|
| sid | String/Number | 剧本唯一标识（自增或随机，需全局唯一） |
| uid | Integer | 上传者 uid |
| title | String | 标题（必填） |
| description | String | 描述（必填） |
| content | String | JSON 文本（必须可解析为 JSON；结构不强约束） |
| visibility | String | 可见性：private / public（默认值由管理端配置） |
| status | String | 状态：active / unavailable / deleted（治理与删除的统一口径） |
| createdAt | Number | 创建时间戳 |
| updatedAt | Number | 更新时间戳 |
| downloads | Number | 下载量（同一用户终身最多计 1 次） |
| likes | Number | 点赞量（同一用户最多计 1 次） |
| favorites | Number | 收藏量（同一用户最多计 1 次） |

#### 关键索引（建议）

> 以 key 约定表达，具体落地通过 NodeBB 的 `db` 抽象方法实现。

- `script:{sid}` → Script 对象字段
- `uid:{uid}:scripts`（sorted set）→ 用户上传的剧本列表（score=createdAt 或 updatedAt）
- `scripts:public:recent`（sorted set）→ 公开剧本按时间排序
- `scripts:public:hot`（sorted set）→ 公开剧本按热度排序（score=likes+favorites）
- `scripts:public:downloads`（sorted set）→ 公开剧本按 downloads 排序

### 2) Script Interaction（剧本互动）

表示用户对剧本的互动关系（点赞、收藏、下载计数去重）。

> 互动记录以集合/有序集合表达，不强制引入单独“行式”实体表。

| 关系/索引 | 数据结构 | 说明 |
|-----------|----------|------|
| `sid:{sid}:likes` | set | 点赞的 uid 集合（去重） |
| `sid:{sid}:favorites` | set | 收藏的 uid 集合（去重） |
| `sid:{sid}:downloads` | set | 下载过的 uid 集合（去重，终身计 1 次） |
| `uid:{uid}:favorites` | sorted set | “我的收藏”列表（member=sid, score=收藏时间戳） |

### 3) Script Moderation Record（治理记录）

表示管理端对剧本进行治理操作的审计记录。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String/Number | 记录唯一标识 |
| sid | String/Number | 剧本标识 |
| action | String | 动作：disable / enable / delete / restore 等 |
| reason | String | 原因（可空但建议填写） |
| operatorUid | Integer | 操作者 uid |
| createdAt | Number | 操作时间戳 |

#### 关键索引（建议）

- `script:{sid}:moderation`（sorted set）→ 该剧本治理记录（score=createdAt）
- `scripts:moderation:recent`（sorted set）→ 全站最近治理记录（便于管理端审计检索）

## State & Lifecycle

### Script.status

- `active`: 正常可用（若 visibility=public，则出现在论坛页签）
- `unavailable`: 被治理下架/封禁（用户侧不可正常访问/使用）
- `deleted`: 被用户删除或管理端删除（默认不再对普通用户可见）

### Script.visibility

- `private`: 仅上传者可见（管理端可见）
- `public`: 对外可见（出现在论坛页签；仍受站点/组可见性配置影响）

## Validation Rules (Design-level)

- 上传/更新时：
  - `content` 必须可解析为 JSON
  - `title`、`description` 必填
- 统计口径：
  - likes/favorites/downloads：同一 uid 对同一 sid 最多计 1 次（集合去重）
  - 热度排序：likes + favorites


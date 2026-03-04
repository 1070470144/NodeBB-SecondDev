# Contracts: Admin Management (Scripts)

**Feature**: 002-script-management  
**Date**: 2026-03-04

## Admin Capabilities

管理员（具备对应 ACP 权限）可执行：

- 查看全站剧本列表（分页）
- 按上传者、状态、可见性、关键词检索
- 查看剧本详情（含 JSON 内容）
- 治理动作：下架/封禁（unavailable）、恢复（active）、删除（deleted）、恢复删除（restore）
- 配置：
  - 剧本页签可见范围（默认所有访客可见）
  - 新上传剧本的默认可见性（private/public）

## Moderation Audit Requirements

每次治理动作必须写入审计记录，至少包含：

- `sid`（目标剧本）
- `operatorUid`（操作者）
- `action`（disable/enable/delete/restore）
- `reason`（原因，可空但建议）
- `createdAt`（时间）

## Expected UI States (ACP)

- 列表可一眼识别：状态（active/unavailable/deleted）、可见性（public/private）、上传者
- 治理动作后：列表状态即时更新，并可查看该剧本的最近治理记录


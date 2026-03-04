# Contracts: HTTP API (Scripts)

**Feature**: 002-script-management  
**Date**: 2026-03-04  
**Scope**: 剧本 CRUD、公开列表、点赞/收藏、我的收藏、管理端治理

## Conventions

- All endpoints require standard NodeBB authentication/CSRF rules where applicable.
- Responses are JSON; errors use NodeBB standard error formatting.
- Visibility rules:
  - `public` scripts are visible in forum “Scripts” tab.
  - `private` scripts are only visible to owner (and admins/moderators with proper privileges).

## Public / User API

### List public scripts

- **GET** `/api/scripts`
- **Query**:
  - `page`: number (default 1)
  - `sort`: `hot` \| `downloads` \| `recent` (default `recent`)
  - `q`: string (optional, keyword search on title/description)
- **Response**:
  - `items`: Script summary list (no `content`)
  - `page`, `pageCount`, `total`

### Get script detail

- **GET** `/api/scripts/:sid`
- **Response**:
  - Script detail (includes `content` only if requester has view permission)

### Upload script (owner)

- **POST** `/api/scripts`
- **Auth**: logged-in required
- **Body** (multipart or json):
  - `file`: JSON file (optional if `content` provided)
  - `content`: JSON text (optional if `file` provided)
  - `title`: string (required)
  - `description`: string (required)
  - `visibility`: `private` \| `public` (optional; default comes from admin config)
- **Response**:
  - created Script summary (and `sid`)

### Update script (owner)

- **PUT** `/api/scripts/:sid`
- **Auth**: logged-in + owner required
- **Body**:
  - `title` / `description` / `visibility` (optional)
  - `file` or `content` (optional, replaces content)
- **Response**: updated Script summary

### Delete script (owner)

- **DELETE** `/api/scripts/:sid`
- **Auth**: logged-in + owner required
- **Response**: `{ ok: true }`

### Like / Unlike

- **POST** `/api/scripts/:sid/like`
- **DELETE** `/api/scripts/:sid/like`
- **Auth**: logged-in required
- **Response**: `{ liked: boolean, likes: number }`

### Favorite / Unfavorite

- **POST** `/api/scripts/:sid/favorite`
- **DELETE** `/api/scripts/:sid/favorite`
- **Auth**: logged-in required
- **Response**: `{ favorited: boolean, favorites: number }`

### My favorites list

- **GET** `/api/scripts/favorites`
- **Auth**: logged-in required
- **Query**:
  - `page`: number (default 1)
- **Response**:
  - `items`: favorited Script summaries
  - `page`, `pageCount`, `total`

### Download script

- **POST** `/api/scripts/:sid/download`
- **Auth**: optional (but download count only increments for logged-in users, per spec’s “same user lifetime once”)
- **Response**:
  - JSON content (or download URL) and download count snapshot

## Admin API

### Admin list scripts

- **GET** `/api/admin/scripts`
- **Auth**: admin privilege required
- **Query**:
  - `page`
  - `q` (keyword)
  - `uid` (uploader)
  - `status` (`active`/`unavailable`/`deleted`)
  - `visibility` (`public`/`private`)
- **Response**: paginated script summaries + moderation metadata

### Admin moderate script

- **POST** `/api/admin/scripts/:sid/moderate`
- **Auth**: admin privilege required
- **Body**:
  - `action`: `disable` \| `enable` \| `delete` \| `restore`
  - `reason`: string (optional)
- **Response**: `{ ok: true, status: string }`

### Admin config

- **GET** `/api/admin/scripts/config`
- **PUT** `/api/admin/scripts/config`
- **Config fields**:
  - `scriptsTabVisibility`: who can see scripts tab (default: public, configurable)
  - `defaultScriptVisibility`: `private` or `public` (configurable)


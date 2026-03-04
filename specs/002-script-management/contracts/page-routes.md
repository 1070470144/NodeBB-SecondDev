# Contracts: Page Routes (Scripts)

**Feature**: 002-script-management  
**Date**: 2026-03-04

## Public Pages

- **GET** `/scripts`
  - Public scripts tab (list + search + sort by hot/downloads/recent)
  - Shows Script summaries (title/description/uploader/time + likes/favorites/downloads)

- **GET** `/scripts/:sid`
  - Script detail page
  - Shows JSON content only if requester has view permission (public script, or owner/admin)

## User Pages

- **GET** `/scripts/upload`
  - Upload form (logged-in only)

- **GET** `/scripts/manage`
  - “My scripts” list + manage actions (logged-in only)

- **GET** `/scripts/favorites`
  - “My favorites” tab (logged-in only)

## Admin Pages (ACP)

- **GET** `/admin/scripts`
  - Admin management list (search/filter + moderate)

- **GET** `/admin/scripts/config`
  - Config page (scripts tab visibility + default script visibility)


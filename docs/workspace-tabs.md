# Workspace detail and tab loading

Workspace detail and update responses contain metadata, `currentUserRole`,
`membersCount`, and up to four `memberPreview` avatars. They no longer contain
full `members` or `projects` arrays. Deploy the backend and frontend changes together.

- `GET /api/workspaces/{slug}`: workspace summary.
- `GET /api/Project/workspace-project/{workspaceId}?pageIndex=1&pageSize=20`:
  `ApiResponse<PagedResult<WorkspaceProjectDto>>`; replaces the old unpaged response.
  Each project includes task/member counts and up to three member avatars.
- `GET /api/workspaces/{workspaceId}/members?pageIndex=1&pageSize=20`:
  `ApiResponse<PagedResult<WorkspaceMemberDto>>`.

Both list endpoints allow the workspace owner or a workspace member, including
owners without a WorkspaceMembers row. Deleted workspaces are inaccessible.
Page indexes start at 1 (maximum 1,000,000); page sizes are 1–100, default 20.
Invalid pagination returns 400; inaccessible workspaces return 404.

The page loads its summary, then the first projects page. Members load only when
selected. Completed pages (including empty results) and in-flight reads survive
tab switches. “Xem thêm” appends the next page. Failed reads can be retried.
Cache is scoped to the open workspace page and cleared on navigation or logout;
there is no Redis, TTL, or persistent browser storage.

Project creation invalidates project pages. Membership changes invalidate member
pages and refresh the header; removal also invalidates project pages because
project membership may change. Only the active invalidated tab reloads immediately.
Changes made by another client appear after reopening/reloading the page.

Verification includes cache, duplicate-request, cancellation, retry, and mutation
invalidation unit tests. The Postman collection contains updated read assertions.
Live database/API checks and latency comparisons still need a running updated
backend and an authenticated test workspace. Check owner-without-membership,
member, outsider, deleted workspace, invalid pagination, and a second page.

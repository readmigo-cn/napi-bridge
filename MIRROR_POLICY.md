# Mirror Policy — napi-bridge

## Overview

Two of the native engine sub-repos inside `napi-bridge` are **read-only mirrors**
of upstream GitHub repositories:

| Engine | Upstream (source of truth) | Gitee mirror branch |
|--------|---------------------------|---------------------|
| typesetting | `github.com/readmigo/typesetting` | `upstream/typesetting` |
| badge-engine | `github.com/readmigo/badge-engine` | `upstream/badge-engine` |

The `main` branch of this Gitee repo contains the NAPI bridge glue code only
(`src/`, `include/`, `stubs/`, `CMakeLists.txt`). The upstream engine branches
are kept separate and merged/subtree-pulled into the build tree when needed.

---

## Rules

### Never modify engine code directly on Gitee

The `upstream/typesetting` and `upstream/badge-engine` branches on this Gitee
repo are **owned by the mirror workflow** (`mirror-from-github.yml`). Any local
commit to those branches will be overwritten on the next mirror run.

Do NOT:
- Commit C++ changes to `src/typesetting/` or `src/badge-engine/` directly in
  this Gitee repo.
- Push to `upstream/typesetting` or `upstream/badge-engine` branches manually.

### All engine changes go through GitHub upstream

1. Open a PR against the appropriate upstream repo on GitHub:
   - `github.com/readmigo/typesetting`
   - `github.com/readmigo/badge-engine`
2. After the PR is merged to `main` on GitHub, the mirror workflow will
   automatically sync the change to the Gitee mirror branch within one hour.
3. To pick up the change immediately, trigger the mirror workflow manually from
   Gitee Actions → **Mirror from GitHub** → **Run workflow**.

### Emergency hotfix procedure

If a production bug requires an urgent fix that cannot wait for GitHub review:

1. Open the fix as a PR to the relevant GitHub upstream repo and fast-track
   review.
2. Once merged, manually trigger **Mirror from GitHub** (`workflow_dispatch`)
   on Gitee to pull the change immediately.
3. If GitHub is unreachable (network partition, outage): create a temporary
   patch commit on a `hotfix/*` branch in this Gitee repo, build and deploy,
   then backport the same change to GitHub as soon as connectivity is restored.
   The hotfix branch must be deleted after the upstream merge is mirrored.

---

## Mirror Workflow Technical Details

The workflow `.gitee/workflows/mirror-from-github.yml` runs every hour via
cron and can also be triggered manually.

On failure it sends an alert to the WeCom group via webhook.

---

## Required Gitee Actions Secrets

Configure these in **Gitee repo → Settings → Actions → Secrets**:

| Secret | Description |
|--------|-------------|
| `GITEE_MIRROR_URL` | Full Gitee push URL with embedded auth token: `https://<user>:<token>@gitee.com/readmigo-cn/napi-bridge.git` |
| `GITHUB_MIRROR_TOKEN` | GitHub PAT with `read:repo` scope (omit if upstreams are public) |
| `WECOM_WEBHOOK_URL` | WeCom bot webhook for failure alerts: `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=<key>` |
| `HUAWEI_CODEARTS_TOKEN` | CodeArts Artifact npm push token (used by `publish.yml`, not mirror) |

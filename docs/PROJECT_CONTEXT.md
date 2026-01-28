# 📌 Project Context & Status Report

**Last Updated:** v3.2.0 (2026-01-28)
**Project:** Family Asset Manager (FAM)

## 1. Project Identity
- **Goal:** API-First Asset Management & Trading Platform using Korea Investment & Securities (KIS) API.
- **Stack:**
  - **Frontend:** Next.js 14+ (App Router), TypeScript, TailwindCSS.
  - **Backend:** FastAPI (Python 3.11), Pydantic, SQLAlchemy.
  - **Database:** SQLite (Dev) / PostgreSQL (Prod Container).
  - **Infrastructure:** Synology NAS (Docker), GitHub Actions, Watchtower.

## 2. Current Status (As of v3.2.0)
- **Version:** Frontend bumped to **v3.2.0**.
- **Environment:**
  - **Backend**: Stable. Import errors resolved (`python -m uvicorn`).
  - **Frontend**: Stable. Connecting to Backend via `NEXT_PUBLIC_API_URL`.
  - **Batch Scheduler**: **Active** (Verified). Runs jobs for Sell/Buy (12:xx PM), Token Refresh, and Asset Recording.

## 3. Deployment Architecture (Critical Context)
We use a **Hybrid Deployment Strategy**. Understanding this is crucial for troubleshooting.

### A. Manual Deployment (Fast Track) -> `scripts/deploy_to_nas.sh`
- **Method:** Builds Frontend **locally** (Mac), transfers `standalone` artifacts to NAS, and builds the container there.
- **Why?** Saves NAS resources, faster iteration.
- **Key File:** `scripts/deploy_to_nas.sh` (Generates a temporary Dockerfile on the fly).
- **Recent Fix:** Updated to use absolute Docker path (`/usr/local/bin/docker`) for Synology compatibility.

### B. CI/CD Deployment (Standard) -> `.github/workflows/deploy.yml`
- **Method:** GitHub Actions builds images, pushes to GHCR. Watchtower on NAS pulls and updates.
- **Key File:** `.github/workflows/deploy.yml`
- **Recent Fix:** Synced `backend/Dockerfile` fixes to GitHub to prevent regressions during auto-update.

## 4. Key Troubleshooting Points
- **Backend Crashing?** Check if `CMD` is `python -m uvicorn ...` (Fix for ModuleNotFoundError).
- **Frontend Old Version?** Ensure `docker-compose.yml` has `build: context: ./frontend` so manual deployment uses local artifacts.
- **Restart Loop?** Check for rogue containers (e.g., `python_batch`) and use `docker compose up --force-recreate`.
- **References**: See `docs/DEPLOYMENT_TROUBLESHOOTING.md` for detailed logs.

## 5. Recent Changelog
- **v3.2.0**: 
  - **Feature**: Full Mobile/Tablet Responsiveness (Collapsible Sidebar, Card Views for Holdings/Orders).
  - **Refactor**: Default NAS user changed to `lystzs`.
  - **Version**: Frontend bumped to 3.2.0.
- **v3.1.1**: Fixed Daily Split Sell logic (Negative amounts), Frontend version display.
- **Fix**: Resolved `ModuleNotFoundError` in Backend Dockerfile.
- **Fix**: Standardized Docker Compose build context.

---
**Note to AI Agents:** When starting a new session, read this file FIRST to understand the current architecture and deployment nuances.

# Deployment Troubleshooting Guide

This document summarizes known issues and resolutions encountered during the deployment of Family Asset Manager to Synology NAS.

## 1. Deployment Architecture
We use a **Hybrid Deployment Strategy**:
- **Manual (Fast Track)**: executed via `scripts/deploy_to_nas.sh`. Builds frontend locally (Mac/Linux), transfers artifacts to NAS, and uses a custom Dockerfile.
- **Automated (CI/CD)**: executed via GitHub Actions. Builds images on GitHub runner, pushes to GHCR, and Watchtower on NAS updates containers.

## 2. Common Issues & Solutions

### A. Frontend Version Mismatch (Old Version on Production)
**Symptom:** You deploy updates, but the site still shows the old version.
**Cause:** `docker-compose.yml` was configured to *pull* the image from the registry (`ghcr.io/...`) instead of *building* from the local context transferred by the script.
**Solution:**
Ensure `docker-compose.yml` includes the `build` context:
```yaml
frontend:
  build:
    context: ./frontend  # Critical for Manual Deployment to use transferred artifacts
  image: ghcr.io/lystzs/family_asset_manager-frontend:latest
```

### B. Backend Crash: `ModuleNotFoundError: No module named 'backend'`
**Symptom:** Backend container keeps restarting. Logs show:
`ModuleNotFoundError: No module named 'backend'`
**Cause:** The container's working directory or `PYTHONPATH` resolution fails when calling `uvicorn` directly as an executable (`CMD ["uvicorn", ...]`).
**Solution:**
Use `python -m uvicorn` in `backend/Dockerfile`. This ensures the module path is resolved correctly relative to the current working directory (`/app`).
```dockerfile
CMD ["python", "-m", "uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### C. NAS Deployment Script Failures (`sudo`, `docker` not found)
**Symptom:** `deploy_to_nas.sh` fails at the final step with "command not found" or password errors.
**Cause:** Synology NAS installs Docker in `/usr/local/bin/docker`, which might not be in the default `PATH` for non-interactive `sudo` sessions.
**Solution:**
Explicitly check for and use the absolute path in the script:
```bash
if [ -x /usr/local/bin/docker ]; then
    sudo /usr/local/bin/docker compose up -d --build
...
```

### D. Container Conflicts / Restart Loops
**Symptom:** Infinite restart loops even after code fixes. Old containers (e.g., `python_batch`) might be interfering.
**Solution:**
Force a clean slate on the NAS:
```bash
# Remove offending containers
docker rm -f fam-backend fam-frontend python_batch

# Force recreate all services
docker compose up -d --build --force-recreate
```

## 3. Verification Checklist
After deployment, verify:
1.  **Frontend Version**: Check the footer or `package.json` version on the live site.
2.  **Backend Status**: `docker logs fam-backend` should show "Application startup complete".
3.  **Batch Scheduler**: Logs should show `[Scheduler] Scheduler started successfully...`.


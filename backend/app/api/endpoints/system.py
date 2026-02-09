from fastapi import APIRouter, Depends
from datetime import datetime
from pytz import timezone
from backend.app.core.config import settings
from backend.app.core.scheduler import scheduler, job_history

router = APIRouter()

@router.get("/status")
def get_system_status():
    """
    Get system status including server time and scheduler details.
    """
    kst = timezone('Asia/Seoul')
    now = datetime.now(kst)
    
    # Get Scheduler Jobs
    jobs = []
    if scheduler.running:
        for job in scheduler.get_jobs():
            job_info = {
                "id": job.id,
                "name": job.name,
                "next_run_time": job.next_run_time.strftime("%Y-%m-%d %H:%M:%S") if job.next_run_time else None,
                "trigger": str(job.trigger),
                "last_run": None,
                "last_status": None,
                "message": None
            }
            
            # Enrich with history
            if job.id in job_history:
                history = job_history[job.id]
                job_info["last_run"] = history.get("last_run")
                job_info["last_status"] = history.get("status")
                job_info["message"] = history.get("message")
                
            jobs.append(job_info)
            
    return {
        "server_time": now.strftime("%Y-%m-%d %H:%M:%S"),
        "app_env": settings.APP_ENV,
        "scheduler_enabled": settings.SCHEDULER_ENABLED,
        "scheduler_running": scheduler.running,
        "active_jobs": jobs
    }

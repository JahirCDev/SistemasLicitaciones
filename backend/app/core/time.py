from datetime import datetime
from zoneinfo import ZoneInfo

PANAMA_TZ = ZoneInfo("America/Panama")
UTC_TZ = ZoneInfo("UTC")


def now_local_iso() -> str:
    return datetime.now(PANAMA_TZ).isoformat()
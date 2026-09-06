from datetime import datetime, timedelta, timezone

LOCAL_TIMEZONE = timezone(timedelta(hours=-5), name="GMT-5")


def now_local_iso() -> str:
    return datetime.now(LOCAL_TIMEZONE).isoformat()

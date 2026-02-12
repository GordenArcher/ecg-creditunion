from datetime import datetime

def json_safe(value):
    if isinstance(value, datetime):
        return value.isoformat()
    return value

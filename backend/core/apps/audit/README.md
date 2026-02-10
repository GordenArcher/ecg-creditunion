# Audit Logging System - Documentation

## Overview

We've implemented a comprehensive audit logging system that tracks all significant system actions for security, compliance, and debugging purposes. The system captures who did what, when, why, and what changed.

## What We Built

### 1. **Audit Model** (`audit/models.py`)
The foundation of the system - a database model that stores every auditable action.

**Key Fields:**
- `actor`: Who performed the action (User foreign key)
- `action`: What happened (e.g., "USER_LOGIN", "DATA_UPDATE")
- `target_type/target_id`: What was affected
- `status`: SUCCESS or FAILED
- `before_state/after_state`: Data snapshots for tracking changes
- `metadata`: Flexible JSON for additional context
- `ip_address/device_info`: Where the action came from

### 2. **Audit Service** (`audit/services.py`)
The main logging interface - a simple, consistent way to record audit events.

**How to use it:**
```python
# Simple login logging
AuditService.log(
    actor=user,
    action="USER_LOGIN",
    target_type="User",
    target_id=str(user.id),
    status=AuditLog.Status.SUCCESS,
    ip_address=request.META.get('REMOTE_ADDR'),
    metadata={"login_method": "email_password"}
)

# Data change with state tracking
AuditService.log(
    actor=admin_user,
    action="USER_UPDATE",
    target_type="User",
    target_id=str(user.id),
    before_state={"role": "user"},
    after_state={"role": "admin"},
    metadata={"reason": "promotion"}
)
```

**Important Notes:**
- Call it **AFTER** the action completes
- Log both successes **AND** failures
- Never log sensitive data (passwords, tokens)
- Include IP address for security-related actions

### 3. **Audit API Endpoints** (`audit/views.py`)
Admin-only REST API for viewing audit logs with powerful filtering and pagination.

**Main Endpoint:** `GET /api/v1/audit/logs/`

**Available Filters:**
- `action`: Filter by action type
- `target_type/target_id`: Filter by affected resource
- `status`: SUCCESS or FAILED
- `start_date/end_date`: Date range filtering
- `search`: Search across multiple fields
- `page/page_size`: Pagination controls

**Example Queries:**
```
GET /api/v1/audit/logs/?action=USER_LOGIN&status=FAILED
GET /api/v1/audit/logs/?target_type=User&ordering=-timestamp
GET /api/v1/audit/logs/?search=admin&page=2&page_size=50
```

### 4. **Serializers** (`audit/serializers.py`)
Simple model serializers that only define which fields to expose:
```python
class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = ["id", "action", "target_type", ...]
```

### 5. **Helper Utilities**

**`utils/audit_helpers.py`**
- `AuditQueryHelper`: Builds complex database queries from filter parameters
- `build_filters()`: Creates Django Q objects for filtering
- `get_paginated_results()`: Handles pagination logic


### 6. **URL Configuration** (`audit/urls.py`)
Clean RESTful endpoints:
- `GET /api/v1/audit/logs/` - List audit logs with filtering
- `GET /api/v1/audit/logs/<id>/` - Get specific audit log details

## How It All Fits Together

```
User Action → View/Service → AuditService.log() → AuditLog DB Record
                    ↓
               (Later, for review)
                    ↓
Admin Request → Audit API → Query Helper → Paginated Response
```

## Key Design Decisions

1. **Separation of Concerns**: Each component has a single responsibility
2. **Simple Interfaces**: `AuditService.log()` is the only method you need to know
3. **Flexible Filtering**: Powerful querying without complex code
4. **Security First**: Admin-only access, no sensitive data logging
5. **Performance**: Efficient queries with `select_related` and proper indexing

## Where to Use It

**ALWAYS log:**
- User authentication (success and failure)
- Admin actions (every single one)
- Data modifications (CREATE, UPDATE, DELETE)
- Permission/role changes
- System configuration changes

**Example integration in views:**
```python
def update_user(request, user_id):
    user = get_object_or_404(User, id=user_id)
    old_data = {"role": user.role}
    
    # Perform update
    user.role = "admin"
    user.save()
    
    new_data = {"role": user.role}
    
    # AUDIT: Log the change
    AuditService.log(
        actor=request.user,
        action="USER_UPDATE",
        target_type="User",
        target_id=str(user.id),
        before_state=old_data,
        after_state=new_data,
        ip_address=get_client_ip(request),
        metadata={"via": "admin_panel"}
    )
```

## Permissions

- **Writing logs**: Any code can call `AuditService.log()`
- **Reading logs**: Admin users only (`is_staff=True` or `is_admin=True`)

## Performance Considerations

1. **Database Indexing**: Model has indexes on commonly filtered fields
2. **Query Optimization**: Uses `select_related('actor')` to avoid N+1 queries
3. **Pagination Limits**: Max 100 items per page to prevent overload
4. **JSON Fields**: Efficient for storing flexible metadata

## Troubleshooting

**Logs not appearing?**
- Check the action completed successfully
- Verify `AuditService.log()` is being called
- Check for database errors in logs

**Can't filter by date?**
- Use ISO format: `YYYY-MM-DD` or `YYYY-MM-DDTHH:MM:SS`

**Permission denied on API?**
- User must have `is_staff=True` or `is_admin=True`


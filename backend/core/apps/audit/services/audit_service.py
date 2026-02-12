from typing import Optional, Dict, Any
from django.contrib.auth import get_user_model
from ..models import AuditLog
from apps.users.models import User


class AuditService:
    """
    Audit logging service - use this to log important system actions.
    
    Every time something significant happens (user logs in, data changes, admin action, etc.),
    we call this to keep a permanent record. This is crucial for:
    - Security investigations (who did what and when)
    - Debugging issues (what happened before something broke)
    - Compliance (proving we track important changes)
    - User accountability (tracking who made which changes)
    """
    
    @staticmethod
    def log(
        *,
        actor: Optional[User] = None,
        action: str,
        target_type: str = "",
        target_id: str = "",
        severity: str = AuditLog.Severity.MEDIUM,
        status: str = AuditLog.Status.SUCCESS,
        metadata: Optional[Dict[str, Any]] = None,
        before_state: Optional[Dict[str, Any]] = None,
        after_state: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        device_info: str = "",
        actor_role: str = "",
    ) -> AuditLog:
        """
        Log an action to the audit trail.
        
        We call this AFTER the action happens (success or failure). Don't call it 
        before the action completes - we want to know what actually happened.
        
        Most parameters are optional, but fill in what makes sense for your use case.
        
        Examples:
            # User logs in successfully
            AuditService.log(
                actor=user,
                action="USER_LOGIN",
                target_type="User",
                target_id=str(user.id),
                severity=AuditLog.Severity.MEDIUM,
                status=AuditLog.Status.SUCCESS,
                ip_address=request.META.get('REMOTE_ADDR'),
                device_info=request.META.get('HTTP_USER_AGENT', ''),
                metadata={"login_method": "email_password"}
            )
            
            # Admin updates a user (track the change)
            AuditService.log(
                actor=admin_user,
                action="USER_UPDATE",
                target_type="User",
                target_id=str(updated_user.id),
                severity=AuditLog.Severity.CRITICAL,  # Role change is critical
                status=AuditLog.Status.SUCCESS,
                before_state={"role": "user", "status": "active"},
                after_state={"role": "admin", "status": "active"},
                metadata={"reason": "promotion_to_admin"}
            )
            
            # Failed login attempt
            AuditService.log(
                action="LOGIN_FAILED",
                target_type="User",
                target_id="",  # We don't know which user they tried
                severity=AuditLog.Severity.HIGH,
                status=AuditLog.Status.FAILED,
                ip_address=request.META.get('REMOTE_ADDR'),
                metadata={"email_tried": email}
            )
        
        Args:
            actor: The user who did the action. Use None for system actions or 
                   when you don't know (like failed login).
            
            action: Short code describing what happened. Use consistent names:
                    - "USER_LOGIN", "USER_LOGOUT"
                    - "USER_CREATE", "USER_UPDATE", "USER_DELETE"
                    - "PASSWORD_CHANGE", "ROLE_CHANGE"
                    - "DATA_EXPORT", "SETTING_CHANGE"
                    Make it clear and searchable.
            
            target_type: What kind of thing was affected? "User", "Order", 
                         "Product", etc. Helps when searching for all actions 
                         on a certain type of object.
            
            target_id: The specific ID of the thing affected. Combine with 
                       target_type to pinpoint the exact resource.
            
            status: Did it work? Use AuditLog.Status.SUCCESS or FAILED.
                    We log failures too - they're often more important!
            
            metadata: Extra info that might help later. Put anything useful here:
                      - Why the action was taken
                      - Error messages (for failures)
                      - Method used (e.g., "api", "web", "mobile")
                      - Duration or performance data
                      - Any special conditions
                      Don't put sensitive data (passwords, tokens, etc.) here!
            
            before_state: What the data looked like BEFORE the change.
                          Use for UPDATE operations to track what changed.
                          Only include relevant fields - not the whole object.
            
            after_state: What the data looked like AFTER the change.
                         Compare with before_state to see the exact change.
            
            ip_address: Where did the request come from? Get from request.META.
                        Super important for security incidents.
            
            device_info: What browser/device/app made the request?
                         Get from request.META.get('HTTP_USER_AGENT').
            
            actor_role: What was the user's role when they did this? Helps 
                        answer "was this admin acting as admin?".
                        Usually: getattr(actor, "role", "") works.
        
        Returns:
            The created AuditLog object. We usually don't need this, but it's 
            there if we want to do something with it later with other features in the future.
        
        Tips:
            - Log EVERY admin action. No exceptions.
            - Log authentication successes AND failures.
            - Log data changes (CREATE, UPDATE, DELETE) with before/after states.
            - Include IP address for anything security-related.
            - Keep action names consistent - check what others are using.
            - Don't log sensitive data (passwords, credit cards, tokens).
            - Log enough to reconstruct what happened, but not everything.
        
        Common patterns:
            # In a view after successful operation:
            def update_user(request, user_id):
                user = get_object_or_404(User, id=user_id)
                old_data = {"role": user.role, "status": user.status}
                # ... update the user ...
                new_data = {"role": user.role, "status": user.status}
                
                AuditService.log(
                    actor=request.user,
                    action="USER_UPDATE",
                    target_type="User",
                    target_id=str(user.id),
                    before_state=old_data,
                    after_state=new_data,
                    ip_address=request.META.get('REMOTE_ADDR'),
                    metadata={"via": "admin_panel"}
                )
            
            # For login (success or failure):
            def login_view(request):
                # ... authentication logic ...
                if authenticated:
                    status = AuditLog.Status.SUCCESS
                    actor = user
                    action = "USER_LOGIN"
                else:
                    status = AuditLog.Status.FAILED
                    actor = None  # We don't know who they tried to be
                    action = "LOGIN_FAILED"
                
                AuditService.log(
                    actor=actor,
                    action=action,
                    target_type="User",
                    target_id=str(user.id) if authenticated else "",
                    status=status,
                    ip_address=request.META.get('REMOTE_ADDR'),
                    device_info=request.META.get('HTTP_USER_AGENT', '')
                )


                Severity levels:
                    - LOW: Read operations, info-level actions
                    - MEDIUM: Create/Update operations
                    - HIGH: Delete, permission changes, security events
                    - CRITICAL: Authentication failures, system changes
                    
                    Examples:
                        # Low severity - reading user data
                        AuditService.log(
                            actor=admin_user,
                            action="USER_READ",
                            target_type="User",
                            target_id=str(user.id),
                            severity=AuditLog.Severity.LOW,
                            metadata={"read_fields": ["id", "email", "full_name"]}
                        )
                        
                        # High severity - deleting user
                        AuditService.log(
                            actor=admin_user,
                            action="USER_DELETE",
                            target_type="User",
                            target_id=str(user.id),
                            severity=AuditLog.Severity.HIGH,
                            metadata={"reason": "account_termination"}
                        )
        """
        
        
        audit_entry = AuditLog.objects.create(
            actor=actor,
            actor_role=actor_role or getattr(actor, "role", ""),
            action=action,
            target_type=target_type,
            target_id=str(target_id) if target_id else "",
            severity=severity,
            status=status,
            metadata=metadata or {},
            before_state=before_state,
            after_state=after_state,
            ip_address=ip_address,
            device_info=device_info,
        )

        return audit_entry
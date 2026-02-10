from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import AuditLog
from .utils.cache_utils import CacheManager


@receiver(post_save, sender=AuditLog)
def invalidate_cache_on_audit_save(sender, instance, created, **kwargs):
    """
    Invalidate audit logs cache when a new audit log is created or updated.
    
    Note: We only invalidate cache on creation or significant updates.
    For performance, we might not invalidate on every minor update.
    """
    if created or kwargs.get('update_fields'):
        CacheManager.invalidate_audit_logs_cache()
        
        import logging
        logger = logging.getLogger(__name__)
        logger.debug(f"Audit log cache invalidated due to {'creation' if created else 'update'} of log ID: {instance.id}")


@receiver(post_delete, sender=AuditLog)
def invalidate_cache_on_audit_delete(sender, instance, **kwargs):
    """
    Invalidate audit logs cache when an audit log is deleted.
    """
    CacheManager.invalidate_audit_logs_cache()
    
    
    import logging
    logger = logging.getLogger(__name__)
    logger.debug(f"Audit log cache invalidated due to deletion of log ID: {instance.id}")


def invalidate_audit_cache_manually():
    """
    Manual function to invalidate audit cache.
    Can be called from services or other parts of the code.
    """
    CacheManager.invalidate_audit_logs_cache()
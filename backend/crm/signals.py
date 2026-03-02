from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from .models import *


def create_log(user, action, instance):

    ActivityLog.objects.create(
        user=user,
        action=action,
        model=instance.__class__.__name__,
        object_id=instance.id
    )


@receiver(post_save, sender=Company)
def company_log(sender, instance, created, **kwargs):

    if created:
        create_log(None, "CREATE", instance)
    else:
        create_log(None, "UPDATE", instance)


@receiver(post_delete, sender=Company)
def company_delete(sender, instance, **kwargs):

    create_log(None, "DELETE", instance)
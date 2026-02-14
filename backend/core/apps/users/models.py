import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.core.validators import RegexValidator
from django.utils import timezone


from django.contrib.auth.models import BaseUserManager

from django.contrib.auth.base_user import BaseUserManager

class CustomUserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email=None, staff_id=None, full_name=None, password=None, **extra_fields):
        if not staff_id:
            raise ValueError("Staff ID must be set")
        if not full_name:
            raise ValueError("Full name must be set")
        
        if email:
            email = self.normalize_email(email)
        
        user = self.model(email=email, staff_id=staff_id, full_name=full_name, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.password = None  # leave blank

        
        user.save(using=self._db)
        return user

    def create_superuser(self, email=None, staff_id=None, full_name=None, password=None, **extra_fields):
        extra_fields.setdefault('role', 'SUPER_ADMIN')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if not staff_id:
            raise ValueError("Superuser must have a staff ID")
        if not full_name:
            raise ValueError("Superuser must have a full name")
        if not password:
            raise ValueError("Superuser must have a password")
        
        return self.create_user(email=email, staff_id=staff_id, full_name=full_name, password=password, **extra_fields)


class Station(models.Model):
    """Station/Office location model."""
    id = models.UUIDField(
        _("Station ID"),
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text=_("Unique Station identifier")
    )
    code = models.CharField(
        max_length=20,
        unique=True,
        verbose_name=_("Station Code"),
        help_text=_("Short code for the station (e.g., HQ, BR001)")
    )
    
    name = models.CharField(
        max_length=200,
        verbose_name=_("Station Name"),
        help_text=_("Full name of the station/office")
    )
    
    location = models.CharField(
        max_length=500,
        blank=True,
        verbose_name=_("Location"),
        help_text=_("Physical address of the station")
    )
    
    phone = models.CharField(
        max_length=20,
        blank=True,
        verbose_name=_("Station Phone"),
        help_text=_("Contact phone number for the station")
    )
    
    email = models.EmailField(
        blank=True,
        verbose_name=_("Station Email"),
        help_text=_("Contact email for the station")
    )
    
    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Is Active")
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['code']
        verbose_name = _("Station")
        verbose_name_plural = _("Stations")
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['name']),
            models.Index(fields=['is_active']),
        ]

    def save(self, *args, **kwargs):
        if self.code:
            self.code = self.code.upper().strip()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.code} - {self.name}"


class Division(models.Model):
    """Division/Department model."""
    id = models.UUIDField(
        _("Division ID"),
        default=uuid.uuid4,
        primary_key=True,
        editable=False,
        help_text=_("Unique division identifier")
    )
    code = models.CharField(
        max_length=20,
        unique=True,
        verbose_name=_("Division Code"),
        help_text=_("Short code for the division (e.g., FIN, HR, IT)")
    )
    
    name = models.CharField(
        max_length=200,
        verbose_name=_("Division Name"),
        help_text=_("Full name of the division/department")
    )
    
    description = models.TextField(
        blank=True,
        verbose_name=_("Description")
    )
    
    directorate = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_("Directorate")
    )
    
    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Is Active")
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['code']
        verbose_name = _("Division")
        verbose_name_plural = _("Divisions")
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['name']),
            models.Index(fields=['directorate']),
            models.Index(fields=['is_active']),
        ]
    
    def save(self, *args, **kwargs):
        if self.code:
            self.code = self.code.upper().strip()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.code} - {self.name}"


class User(AbstractUser):
    """Custom User model with additional fields for ECG Credit Union."""
    
    class Role(models.TextChoices):
        SUPER_ADMIN = "SUPER_ADMIN", _("Super Admin")
        ADMIN = "ADMIN", _("Admin")
        STAFF = "STAFF", _("Staff")
    
    class MaritalStatus(models.TextChoices):
        SINGLE = "SINGLE", _("Single")
        MARRIED = "MARRIED", _("Married")
        DIVORCED = "DIVORCED", _("Divorced")
        WIDOWED = "WIDOWED", _("Widowed")
        SEPARATED = "SEPARATED", _("Separated")
    
    class Gender(models.TextChoices):
        MALE = "MALE", _("Male")
        FEMALE = "FEMALE", _("Female")
        OTHER = "OTHER", _("Other")
    
    
    username = None
    email = models.EmailField(
        _("Email Address"),
        unique=True,
        db_index=True,
        blank=True,
        null=True, 
        help_text=_("Primary email address for the user (optional)")
    )

    
    employee_id = models.UUIDField(
        _("Employee ID"),
        default=uuid.uuid4,
        unique=True,
        editable=False,
        help_text=_("Unique employee identifier")
    )
    
    staff_id = models.CharField(
        _("Staff ID"),
        max_length=50,
        unique=True,
        db_index=True,
        help_text=_("Unique staff identification number")
    )
    
    full_name = models.CharField(
        _("Full Name"),
        max_length=255,
        help_text=_("User's full name (First, Middle, Last)")
    )
    
    title = models.CharField(
        _("Title"),
        max_length=100,
        blank=True,
        help_text=_("Job title or position")
    )
    
    station = models.ForeignKey(
        Station,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users',
        verbose_name=_("Station"),
        help_text=_("Assigned station/office")
    )
    
    division = models.ForeignKey(
        Division,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users',
        verbose_name=_("Division"),
        help_text=_("Assigned division/department")
    )
    
    gender = models.CharField(
        _("Gender"),
        max_length=10,
        choices=Gender.choices,
        default=Gender.OTHER
    )
    
    date_of_birth = models.DateField(
        _("Date of Birth"),
        null=True,
        blank=True,
        help_text=_("User's date of birth (YYYY-MM-DD)")
    )
    
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message=_("Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.")
    )
    
    phone_number = models.CharField(
        _("Phone Number"),
        validators=[phone_regex],
        max_length=17,
        blank=True,
        help_text=_("Primary contact phone number")
    )
    
    
    marital_status = models.CharField(
        _("Marital Status"),
        max_length=20,
        choices=MaritalStatus.choices,
        default=MaritalStatus.SINGLE
    )
    
    number_of_dependents = models.PositiveIntegerField(
        _("Number of Dependents"),
        default=0,
        help_text=_("Number of dependents for benefits calculation")
    )
    
    role = models.CharField(
        _("Role"),
        max_length=20,
        choices=Role.choices,
        default=Role.STAFF
    )

    pb_number = models.CharField(
        _("PB Number"),
        max_length=50,
        blank=True,
        help_text=_("Personnel/Payroll number")
    )
    
    directorate = models.CharField(
        _("Directorate"),
        max_length=100,
        blank=True,
        help_text=_("Directorate the user belongs to")
    )
    
    date_registered = models.DateTimeField(
        _("Date Registered"),
        default=timezone.now,
        help_text=_("Date when user was registered in the system")
    )
    
    discontinued = models.BooleanField(
        _("Discontinued"),
        default=False,
        help_text=_("Whether the user account has been discontinued")
    )
    
    discontinued_date = models.DateTimeField(
        _("Discontinued Date"),
        null=True,
        blank=True,
        help_text=_("Date when the user account was discontinued")
    )
    
    avatar = models.ImageField(
        _("Profile Picture"),
        upload_to='avatars/',
        null=True,
        blank=True,
        help_text=_("User's profile picture/avatar")
    )
    password_last_changed = models.DateTimeField(null=True, blank=True)
    
    created_by = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_users',
        verbose_name=_("Created By")
    )
    
    updated_by = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='updated_users',
        verbose_name=_("Updated By")
    )

    objects = CustomUserManager()
    
    USERNAME_FIELD = 'staff_id'
    REQUIRED_FIELDS = ['full_name']
    
    class Meta:
        verbose_name = _("User")
        verbose_name_plural = _("Users")
        ordering = ['-date_joined']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['staff_id']),
            models.Index(fields=['employee_id']),
            models.Index(fields=['role']),
            models.Index(fields=['discontinued']),
            models.Index(fields=['station', 'division']),
            models.Index(fields=['date_registered']),
        ]
    
    def __str__(self):
        return f"{self.staff_id} - {self.full_name}"
    
    def save(self, *args, **kwargs):
        # Set is_staff and is_superuser based on role
        if self.role in [self.Role.SUPER_ADMIN, self.Role.ADMIN]:
            self.is_staff = True
            self.is_superuser = (self.role == self.Role.SUPER_ADMIN)
        else:
            self.is_staff = False
            self.is_superuser = False
        
        # If being discontinued, set the discontinued date
        if self.discontinued and not self.discontinued_date:
            self.discontinued_date = timezone.now()
        elif not self.discontinued and self.discontinued_date:
            self.discontinued_date = None
        
        super().save(*args, **kwargs)
    
    def get_full_name(self):
        """Return the full name."""
        return self.full_name
    
    def get_short_name(self):
        """Return the short name (first name)."""
        return self.full_name.split()[0] if self.full_name else self.email
    
    @property
    def is_admin(self):
        """Check if user has admin privileges."""
        return self.role in [self.Role.SUPER_ADMIN, self.Role.ADMIN]
    
    @property
    def is_staff_member(self):
        """Check if user is a staff member."""
        return self.role in [self.Role.STAFF, self.Role.ADMIN, self.Role.SUPER_ADMIN]


class UserAccountMeta(models.Model):
    """Additional metadata for user account verification status."""
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='account_meta',
        verbose_name=_("User")
    )
    
    email_verified = models.BooleanField(
        _("Email Verified"),
        default=False,
        help_text=_("Whether the email address has been verified")
    )
    
    email_verified_at = models.DateTimeField(
        _("Email Verified At"),
        null=True,
        blank=True,
        help_text=_("Timestamp when email was verified")
    )
    
    phone_verified = models.BooleanField(
        _("Phone Verified"),
        default=False,
        help_text=_("Whether the phone number has been verified")
    )
    
    phone_verified_at = models.DateTimeField(
        _("Phone Verified At"),
        null=True,
        blank=True,
        help_text=_("Timestamp when phone was verified")
    )
    
    phone_verification_code = models.CharField(
        _("Phone Verification Code"),
        max_length=10,
        blank=True,
        help_text=_("Code for phone verification")
    )
    
    last_email_verification_sent = models.DateTimeField(
        _("Last Email Verification Sent"),
        null=True,
        blank=True,
        help_text=_("Last time email verification was sent")
    )
    
    last_phone_verification_sent = models.DateTimeField(
        _("Last Phone Verification Sent"),
        null=True,
        blank=True,
        help_text=_("Last time phone verification was sent")
    )
    
    failed_login_attempts = models.PositiveIntegerField(
        _("Failed Login Attempts"),
        default=0,
        help_text=_("Number of consecutive failed login attempts")
    )
    
    last_failed_login = models.DateTimeField(
        _("Last Failed Login"),
        null=True,
        blank=True,
        help_text=_("Timestamp of last failed login attempt")
    )
    
    account_locked_until = models.DateTimeField(
        _("Account Locked Until"),
        null=True,
        blank=True,
        help_text=_("Account locked until this time (if locked)")
    )
    
    two_factor_enabled = models.BooleanField(
        _("Two-Factor Enabled"),
        default=False,
        help_text=_("Whether two-factor authentication is enabled")
    )

    two_factor_method = models.CharField(
        _("Two-Factor Method"),
        max_length=50,
        blank=True,
        help_text=_("Method used for two-factor authentication (e.g., SMS, Email)"),
        choices=[('SMS', 'SMS'), ('EMAIL', 'Email')]
    )
    
    last_password_change = models.DateTimeField(
        _("Last Password Change"),
        null=True,
        blank=True,
        help_text=_("Timestamp of last password change")
    )

    is_first_login = models.BooleanField(
        _("Is First Login"),
        default=True,
        help_text=_("Whether this is the user's first login")
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _("User Account Metadata")
        verbose_name_plural = _("User Account Metadata")
        indexes = [
            models.Index(fields=['email_verified']),
            models.Index(fields=['phone_verified']),
            models.Index(fields=['account_locked_until']),
        ]
    
    def __str__(self):
        return f"Account Meta for {self.user.email}"
    
    @property
    def is_account_locked(self):
        """Check if account is currently locked."""
        if self.account_locked_until:
            return timezone.now() < self.account_locked_until
        return False
    
    def increment_failed_login(self):
        """Increment failed login attempts and lock account if threshold reached."""
        self.failed_login_attempts += 1
        self.last_failed_login = timezone.now()
        
        # Lock account after 5 failed attempts for 15 minutes
        if self.failed_login_attempts >= 5:
            self.account_locked_until = timezone.now() + timezone.timedelta(minutes=15)
        
        self.save()
    
    def reset_failed_login(self):
        """Reset failed login attempts."""
        self.failed_login_attempts = 0
        self.last_failed_login = None
        self.account_locked_until = None
        self.save()
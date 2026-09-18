from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)


class Department(models.Model):
    """
    Department model representing functional teams within the organization
    (e.g., Engineering, Design, Marketing, Sales).
    """
    name = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        help_text="Unique name of the department (e.g. Engineering, Sales)."
    )
    description = models.TextField(
        blank=True,
        default='',
        help_text="Optional description of the department's responsibilities."
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the department was created."
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when the department was last updated."
    )

    class Meta:
        db_table = 'departments'
        ordering = ['name']
        verbose_name = 'Department'
        verbose_name_plural = 'Departments'

    def __str__(self):
        return self.name


class UserManager(BaseUserManager):
    """
    Custom user manager where email is the unique identifier
    for authentication instead of usernames.
    """

    def create_user(self, email, name, password=None, **extra_fields):
        """
        Create and save a regular user with the given email, name, and password.
        """
        if not email:
            raise ValueError("The Email field must be set.")
        if not name:
            raise ValueError("The Name field must be set.")

        email = self.normalize_email(email).lower()
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)

        user = self.model(email=email, name=name, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, password=None, **extra_fields):
        """
        Create and save a superuser with the given email, name, and password.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get('is_superuser') is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, name, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model for Peer Kudos Wall.
    Uses email as the unique identifier and includes gamification points.
    """
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(
        max_length=150,
        help_text="Full name of the team member."
    )
    email = models.EmailField(
        unique=True,
        max_length=255,
        db_index=True,
        help_text="Corporate email address used for login and notifications."
    )
    avatar = models.ImageField(
        upload_to='avatars/',
        null=True,
        blank=True,
        help_text="Profile avatar image for the user."
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users',
        help_text="Department/team the user belongs to."
    )
    giving_allowance = models.PositiveIntegerField(
        default=100,
        help_text="Monthly/periodic points allowance available to award kudos to peers."
    )
    earned_points = models.PositiveIntegerField(
        default=0,
        help_text="Total accumulated points received through peer appreciation kudos."
    )

    # Email verification & Account Status
    is_email_verified = models.BooleanField(
        default=False,
        help_text="Designates whether the user has verified their email address."
    )
    email_verification_token = models.CharField(
        max_length=128,
        blank=True,
        null=True,
        help_text="Security token for email verification simulation."
    )

    # Django Administrative & Permissions fields
    is_active = models.BooleanField(
        default=True,
        help_text="Designates whether this user should be treated as active."
    )
    is_staff = models.BooleanField(
        default=False,
        help_text="Designates whether the user can log into the Django admin site."
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="Timestamp when the user account was registered."
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when the user account was last modified."
    )

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    class Meta:
        db_table = 'users'
        ordering = ['-created_at']
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        indexes = [
            models.Index(fields=['email'], name='idx_user_email'),
            models.Index(fields=['department'], name='idx_user_department'),
            models.Index(fields=['created_at'], name='idx_user_created_at'),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(giving_allowance__gte=0),
                name='check_positive_giving_allowance'
            ),
            models.CheckConstraint(
                check=models.Q(earned_points__gte=0),
                name='check_positive_earned_points'
            ),
        ]

    def __str__(self):
        return f"{self.name} ({self.email})"

    # Python/Django property aliases for camelCase compatibility
    @property
    def givingAllowance(self):
        return self.giving_allowance

    @givingAllowance.setter
    def givingAllowance(self, value):
        self.giving_allowance = value

    @property
    def earnedPoints(self):
        return self.earned_points

    @earnedPoints.setter
    def earnedPoints(self, value):
        self.earned_points = value

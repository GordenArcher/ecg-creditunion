import uuid
from django.db import models
from django.utils import timezone
from apps.users.models import User

class InterestRate(models.Model):
    RATE_TYPES = [
        ("SAVINGS", "Savings Interest"),
        ("LOAN", "Loan Interest"),
    ]
    id = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
    )
    rate_type = models.CharField(max_length=20, choices=RATE_TYPES)
    rate = models.DecimalField(max_digits=5, decimal_places=2)
    is_active = models.BooleanField(default=True)
    effective_from = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-effective_from"]

    def __str__(self):
        return f"{self.rate_type} — {self.rate}%"

    @classmethod
    def get_active_rate(cls, rate_type):
        """Get currently active rate for a type"""
        return cls.objects.filter(rate_type=rate_type, is_active=True).first()


class Member(models.Model):
    id = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
        help_text="Unique employee identifier"
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    entrance_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    norminee = models.CharField(max_length=255, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    witness = models.CharField(max_length=255, blank=True, null=True)
    relationship = models.CharField(max_length=100, blank=True, null=True)
    joined_at = models.DateTimeField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.user.full_name


class Wallet(models.Model):
    id = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
    )
    member = models.ForeignKey(Member, on_delete=models.CASCADE)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    cheche_number = models.CharField(max_length=20, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Wallet {self.id} — {self.member}"


class Transaction(models.Model):
    TYPES = [
        ("DEPOSIT", "Deposit"),
        ("WITHDRAW", "Withdraw"),
        ("TRANSFER", "Transfer"),
        ("LOAN_DISBURSE", "Loan Disbursement"),
        ("LOAN_REPAY", "Loan Repayment"),
        ("INTEREST", "Interest"),
    ]
    id = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
    )
    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_type = models.CharField(max_length=20, choices=TYPES)
    reference = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.transaction_type} — {self.amount}"


class SavingsAccount(models.Model):
    id = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
    )
    member = models.ForeignKey(Member, on_delete=models.CASCADE)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    interest_rate = models.ForeignKey(
        InterestRate,
        on_delete=models.PROTECT,
        limit_choices_to={"rate_type": "SAVINGS"},
        null=True, 
        blank=True
    )
    last_interest_applied = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"SavingsAccount {self.id} — {self.member}"


class Loan(models.Model):
    STATUS = [
        ("PENDING", "Pending"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
        ("ACTIVE", "Active"),
        ("PAID", "Paid"),
    ]
    id = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
    )
    member = models.ForeignKey(Member, on_delete=models.CASCADE)
    principal = models.DecimalField(max_digits=12, decimal_places=2)
    interest_rate = models.ForeignKey(
        InterestRate,
        on_delete=models.PROTECT,
        limit_choices_to={"rate_type": "LOAN"},
        null=True,
        blank=True
    )
    balance = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Loan {self.id} — {self.member}"


class LoanRepayment(models.Model):
    class PaymentMethod(models.TextChoices):
        MANUAL = "MANUAL", "Manual"
        FROM_SAVINGS = "FROM_SAVINGS", "From Savings"

    id = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
    )
    loan = models.ForeignKey(Loan, on_delete=models.CASCADE)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    paid_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Repayment {self.id} — {self.amount}"

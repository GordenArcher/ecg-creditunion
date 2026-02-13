from django.contrib import admin
from .models import (
    InterestRate,
    Member,
    Wallet,
    Transaction,
    SavingsAccount,
    Loan,
    LoanRepayment,
)


@admin.register(InterestRate)
class InterestRateAdmin(admin.ModelAdmin):
    list_display = ("rate_type", "rate", "is_active", "effective_from")
    list_filter = ("rate_type", "is_active")
    search_fields = ("rate_type",)


@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ("user", "entrance_fee", "is_active", "joined_at")
    list_filter = ("is_active",)
    search_fields = ("user__full_name", "user__email")


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ("member", "balance", "cheche_number", "is_active")
    list_filter = ("is_active",)
    search_fields = ("cheche_number",)


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ("wallet", "transaction_type", "amount", "created_at")
    list_filter = ("transaction_type",)
    search_fields = ("reference",)


@admin.register(SavingsAccount)
class SavingsAccountAdmin(admin.ModelAdmin):
    list_display = ("member", "balance", "interest_rate", "created_at")
    search_fields = ("member__user__full_name",)


@admin.register(Loan)
class LoanAdmin(admin.ModelAdmin):
    list_display = ("member", "principal", "balance", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("member__user__full_name",)


@admin.register(LoanRepayment)
class LoanRepaymentAdmin(admin.ModelAdmin):
    list_display = ("loan", "payment_method", "amount", "paid_at")
    list_filter = ("payment_method",)

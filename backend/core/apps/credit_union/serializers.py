from rest_framework import serializers
from .models import (
    InterestRate,
    Member,
    Wallet,
    Transaction,
    SavingsAccount,
    Loan,
    LoanRepayment,
)

class InterestRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterestRate
        fields = "__all__"


class MemberSerializer(serializers.ModelSerializer):
    user_full_name = serializers.CharField(source="user.full_name", read_only=True)

    class Meta:
        model = Member
        fields = "__all__"


class WalletSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source="member.user.full_name", read_only=True)

    class Meta:
        model = Wallet
        fields = "__all__"


class TransactionSerializer(serializers.ModelSerializer):
    wallet_owner = serializers.CharField(
        source="wallet.member.user.full_name",
        read_only=True
    )

    class Meta:
        model = Transaction
        fields = "__all__"


class SavingsAccountSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(
        source="member.user.full_name",
        read_only=True
    )

    class Meta:
        model = SavingsAccount
        fields = "__all__"


class LoanSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(
        source="member.user.full_name",
        read_only=True
    )

    class Meta:
        model = Loan
        fields = "__all__"


class LoanRepaymentSerializer(serializers.ModelSerializer):
    loan_member_name = serializers.CharField(
        source="loan.member.user.full_name",
        read_only=True
    )

    class Meta:
        model = LoanRepayment
        fields = "__all__"
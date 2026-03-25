from abc import ABC, abstractmethod


class FinanceAPI(ABC):
    """Abstract adapter for finance app APIs."""

    @abstractmethod
    def get_accounts(self):
        """Return list of {id, name, balance, currency, classification, account_type}."""
        ...

    @abstractmethod
    def get_categories(self):
        """Return list of {id, name, classification}."""
        ...

    @abstractmethod
    def get_transactions(self, account_id, per_page=100, page=1):
        """Return {transactions: [...], pagination: {...}}."""
        ...

    @abstractmethod
    def create_transaction(self, account_id, date, amount, name,
                           classification, category_id=None, notes=None):
        """Create a transaction. Return created transaction dict or raise."""
        ...

    @abstractmethod
    def delete_transaction(self, transaction_id):
        """Delete a transaction. Return True on success."""
        ...

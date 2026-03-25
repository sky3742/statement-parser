from abc import ABC, abstractmethod


class StatementParser(ABC):
    """Base class for bank statement PDF parsers."""

    @property
    @abstractmethod
    def name(self):
        """Parser identifier, e.g. 'tng', 'maybank'."""
        ...

    @property
    @abstractmethod
    def label(self):
        """Human-readable label, e.g. 'TnG Wallet', 'Maybank'."""
        ...

    @abstractmethod
    def detect(self, text):
        """Return True if this parser can handle the given PDF text."""
        ...

    @abstractmethod
    def parse(self, file_bytes):
        """Extract transactions from PDF bytes.

        Returns list of dicts:
            {
                'date': 'YYYY-MM-DD',
                'amount': float,
                'type': 'income' | 'expense',
                'desc': str,
            }
        """
        ...

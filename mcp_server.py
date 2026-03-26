"""MCP server for Statement Importer — exposes PDF extraction and finance API as tools."""

from pathlib import Path
from mcp.server.fastmcp import FastMCP

from backend import config
from backend import pdf
from backend.parsers import list_parsers
from backend.api import MaybeAPI, APIError

mcp = FastMCP("Statement Importer")

api = MaybeAPI(config.API_URL, config.API_KEY) if config.API_URL and config.API_KEY else None


@mcp.tool()
def list_parsers_tool() -> list[dict]:
    """List available PDF statement parsers (bank formats)."""
    return list_parsers()


@mcp.tool()
def extract_pdf(file_path: str, parser: str | None = None) -> list[dict]:
    """Extract transactions from a bank statement PDF.

    Args:
        file_path: Path to the PDF file.
        parser: Optional parser name (e.g. 'tng'). Auto-detects if omitted.

    Returns:
        List of transactions with date, amount, type (income/expense), and desc.
    """
    data = Path(file_path).read_bytes()
    result = pdf.extract(data, parser)
    if isinstance(result, list):
        return result
    return []


@mcp.tool()
def list_accounts() -> list[dict]:
    """List accounts from the connected finance API."""
    if not api:
        return []
    return api.get_accounts()


@mcp.tool()
def list_categories() -> list[dict]:
    """List categories from the connected finance API."""
    if not api:
        return []
    return api.get_categories()


@mcp.tool()
def create_transaction(
    account_id: str,
    date: str,
    amount: float,
    name: str,
    classification: str,
    category_id: str | None = None,
    notes: str | None = None,
) -> dict:
    """Create a single transaction via the finance API.

    Args:
        account_id: Account ID to post to.
        date: Transaction date (YYYY-MM-DD).
        amount: Transaction amount (positive number).
        name: Transaction description.
        classification: 'income' or 'expense'.
        category_id: Optional category ID.
        notes: Optional notes.
    """
    if not api:
        raise RuntimeError("API not configured — set API_URL and API_KEY in .env")
    return api.create_transaction(
        account_id=account_id,
        date=date,
        amount=amount,
        name=name,
        classification=classification,
        category_id=category_id,
        notes=notes,
    )


@mcp.tool()
def batch_create_transactions(transactions: list[dict]) -> dict:
    """Batch create transactions via the finance API.

    Args:
        transactions: List of transaction dicts, each with account_id, date, amount,
            name, classification. Optional: category_id, notes.

    Returns:
        Dict with 'created', 'failed', and 'total' counts.
    """
    if not api:
        raise RuntimeError("API not configured — set API_URL and API_KEY in .env")
    created = []
    failed = []
    for i, txn in enumerate(transactions):
        try:
            result = api.create_transaction(
                account_id=txn["account_id"],
                date=txn["date"],
                amount=float(txn["amount"]),
                name=txn["name"],
                classification=txn["classification"],
                category_id=txn.get("category_id"),
                notes=txn.get("notes"),
            )
            created.append(result)
        except (APIError, KeyError, ValueError) as e:
            failed.append({"index": i, "error": str(e), "txn": txn.get("name", "?")})
    return {"created": created, "failed": failed, "total": len(transactions)}


if __name__ == "__main__":
    mcp.run(transport="stdio")

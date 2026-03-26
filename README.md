# Statement Importer

Import bank statements (PDF), edit, and post to [Maybe/Sure](https://github.com/we-promise/sure) finance app.

## Quick Start

```bash
# 1. Copy .env.example and fill in your API credentials
cp .env.example .env

# 2. Run
python3 run.py

# 3. Open http://localhost:8765
```

## Usage

### Web UI

1. Drop PDF statements into the upload zone
2. Edit descriptions, categories, and notes
3. Select rows → **Merge** to combine transactions
4. **Export** to CSV or **Post** to Maybe/Sure API

### CLI — PDF to CSV

```bash
# Auto-detect statement type
python3 convert.py statement.pdf

# Specify parser
python3 convert.py statement.pdf --parser tng

# Save to file
python3 convert.py statement.pdf -o output.csv

# List available parsers
python3 convert.py --list
```

### HTTP API

#### PDF Extraction

```bash
# Extract transactions as JSON
curl -F "files=@statement.pdf" http://localhost:8765/extract-pdf

# Convert to CSV
curl -F "files=@statement.pdf" http://localhost:8765/convert-pdf -o output.csv

# Specify parser
curl -F "files=@statement.pdf" "http://localhost:8765/extract-pdf?parser=tng"

# List parsers
curl http://localhost:8765/api/parsers
```

#### Maybe/Sure API Proxy

Requires `API_URL` and `API_KEY` in `.env`.

```bash
# List accounts
curl http://localhost:8765/api/v1/accounts

# List categories
curl http://localhost:8765/api/v1/categories

# Get transactions (with optional query params)
curl "http://localhost:8765/api/v1/transactions?account_id=xxx&per_page=100&page=1"

# Create transaction
curl -X POST http://localhost:8765/api/v1/transactions \
  -H "Content-Type: application/json" \
  -d '{"transaction": {"account_id": "xxx", "date": "2026-01-15", "amount": 50.00, "name": "Groceries", "classification": "expense", "category_id": "yyy"}}'

# Batch create transactions
curl -X POST http://localhost:8765/api/v1/transactions/batch \
  -H "Content-Type: application/json" \
  -d '{"transactions": [{"account_id": "xxx", "date": "2026-01-15", "amount": 50.00, "name": "Groceries", "classification": "expense"}]}'

# Delete transaction
curl -X DELETE http://localhost:8765/api/v1/transactions/<txn_id>
```

### MCP Server

Exposes the same functionality as [MCP tools](https://modelcontextprotocol.io) for use with Claude Desktop, Cursor, or other MCP clients. Requires Python 3.10+.

```bash
pip3 install "mcp[cli]"

# Test with MCP Inspector
mcp dev mcp_server.py

# Or run directly (stdio transport)
python3 mcp_server.py
```

#### Claude Desktop config

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "statement-importer": {
      "command": "python3",
      "args": ["/absolute/path/to/mcp_server.py"],
      "env": {
        "API_URL": "https://your-instance.ts.net",
        "API_KEY": "your-api-key"
      }
    }
  }
}
```

#### Available tools

| Tool | Description |
|---|---|
| `list_parsers_tool` | List available PDF statement parsers |
| `extract_pdf` | Extract transactions from a bank statement PDF |
| `list_accounts` | List accounts from the finance API |
| `list_categories` | List categories from the finance API |
| `create_transaction` | Create a single transaction |
| `batch_create_transactions` | Batch create transactions |

## Adding a New Bank Parser

Create `backend/parsers/<bank>.py`:

```python
from .base import StatementParser

class MaybankParser(StatementParser):
    name = 'maybank'
    label = 'Maybank'

    def detect(self, text):
        return 'MAYBANK' in text

    def parse(self, file_bytes):
        # parse PDF and return list of:
        # {'date': 'YYYY-MM-DD', 'amount': float, 'type': 'income'|'expense', 'desc': str}
        ...
```

The parser is auto-discovered on startup.

## Using a Different Finance API

The project uses an adapter pattern — implement the `FinanceAPI` abstract class to connect any finance app.

### 1. Create an adapter

Create `backend/api/myapp.py`:

```python
import json
import urllib.request
import urllib.error

from .base import FinanceAPI


class MyAppAPI(FinanceAPI):

    def __init__(self, base_url, api_key):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key

    def _request(self, path, method='GET', body=None):
        # Implement your HTTP helper (auth headers, error handling, etc.)
        ...

    def get_accounts(self):
        # Return list of {id, name, balance, currency, classification, account_type}
        ...

    def get_categories(self):
        # Return list of {id, name, classification}
        ...

    def get_transactions(self, account_id, per_page=100, page=1):
        # Return {transactions: [...], pagination: {...}}
        ...

    def create_transaction(self, account_id, date, amount, name,
                           classification, category_id=None, notes=None):
        # Create a transaction. Return created transaction dict.
        ...

    def delete_transaction(self, transaction_id):
        # Delete a transaction. Return True on success.
        ...
```

### 2. Register it

Update `backend/api/__init__.py`:

```python
from .base import FinanceAPI
from .myapp import MyAppAPI, APIError

__all__ = ['FinanceAPI', 'MyAppAPI', 'APIError']
```

### 3. Wire it up

Update the instantiation in `backend/server.py`:

```python
from .api import MyAppAPI, APIError

api = MyAppAPI(config.API_URL, config.API_KEY) if config.API_URL and config.API_KEY else None
```

That's it — the server routes and frontend don't need changes.

## Project Structure

```
reconciler/
├── .env                    # API credentials (gitignored)
├── run.py                  # Web server entry point
├── convert.py              # CLI PDF to CSV converter
├── mcp_server.py           # MCP server (stdio transport)
├── backend/
│   ├── config.py           # .env loading
│   ├── pdf.py              # PDF extraction dispatcher
│   ├── server.py           # HTTP server + routes
│   ├── api/
│   │   ├── base.py         # FinanceAPI abstract class
│   │   └── maybe.py        # Maybe/Sure adapter
│   └── parsers/
│       ├── base.py         # StatementParser abstract class
│       └── tng.py          # TnG eWallet parser
└── frontend/
    ├── index.html          # DaisyUI 5 dark theme
    ├── components.js       # UI components
    ├── hooks.js            # useToast, useApi, useTransactions
    └── app.js              # Main app component
```

## Dependencies

- Python 3.9+ (3.10+ for MCP server)
- `pdfplumber` — `pip3 install pdfplumber`
- `mcp` — `pip3 install "mcp[cli]"` (optional, for MCP server)
- Browser — no build tools needed (React, Tailwind, DaisyUI loaded from CDN)

## .env

```
API_URL=https://your-instance.ts.net
API_KEY=your-api-key
PORT=8765
```

`API_URL` and `API_KEY` are optional — without them the app runs in CSV-only mode (PDF extraction + CSV export, no posting to Maybe/Sure).

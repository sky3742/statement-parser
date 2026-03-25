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

## Project Structure

```
reconciler/
├── .env                    # API credentials (gitignored)
├── run.py                  # Web server entry point
├── convert.py              # CLI PDF to CSV converter
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

- Python 3.9+
- `pdfplumber` — `pip3 install pdfplumber`
- Browser — no build tools needed (React, Tailwind, DaisyUI loaded from CDN)

## .env

```
API_URL=https://your-instance.ts.net
API_KEY=your-api-key
PORT=8765
```

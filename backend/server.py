import http.server
import cgi
import json
import urllib.parse

from . import config
from . import pdf
from .api import MaybeAPI, APIError
from .parsers import list_parsers

api = MaybeAPI(config.API_URL, config.API_KEY)


class Handler(http.server.SimpleHTTPRequestHandler):

    def __init__(self, *args, **kwargs):
        self.directory = config.FRONTEND_DIR
        super().__init__(*args, directory=self.directory, **kwargs)

    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js': 'application/javascript',
    }

    def do_GET(self):
        routes = {
            '/api/v1/accounts': self._get_accounts,
            '/api/v1/categories': self._get_categories,
            '/api/v1/transactions': self._get_transactions,
            '/api/parsers': self._get_parsers,
        }
        handler = routes.get(self.path.split('?')[0])
        if handler:
            handler()
        else:
            super().do_GET()

    def do_POST(self):
        path = self.path.split('?')[0]
        routes = {
            '/extract-pdf': self._handle_pdf,
            '/convert-pdf': self._handle_pdf_csv,
            '/api/v1/transactions': self._create_transaction,
        }
        handler = routes.get(path)
        if handler:
            handler()
        else:
            self.send_error(404)

    def do_DELETE(self):
        path = self.path
        if path.startswith('/api/v1/transactions/'):
            txn_id = path.split('/api/v1/transactions/')[1]
            self._delete_transaction(txn_id)
        else:
            self.send_error(404)

    def _get_accounts(self):
        try:
            accounts = api.get_accounts()
            self._json(200, {'accounts': accounts})
        except APIError as e:
            self._json(e.status, {'error': e.message})

    def _get_categories(self):
        try:
            cats = api.get_categories()
            self._json(200, {'categories': cats})
        except APIError as e:
            self._json(e.status, {'error': e.message})

    def _get_parsers(self):
        self._json(200, {'parsers': list_parsers()})

    def _get_transactions(self):
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)
        account_id = params.get('account_id', [''])[0]
        per_page = int(params.get('per_page', ['100'])[0])
        page = int(params.get('page', ['1'])[0])
        try:
            result = api.get_transactions(account_id, per_page, page)
            self._json(200, result)
        except APIError as e:
            self._json(e.status, {'error': e.message})

    def _create_transaction(self):
        length = int(self.headers.get('Content-Length', 0))
        body = json.loads(self.rfile.read(length)) if length else {}
        txn = body.get('transaction', {})
        try:
            result = api.create_transaction(
                account_id=txn['account_id'],
                date=txn['date'],
                amount=float(txn['amount']),
                name=txn['name'],
                classification=txn['classification'],
                category_id=txn.get('category_id'),
                notes=txn.get('notes'),
            )
            self._json(200, result)
        except APIError as e:
            self._json(e.status, {'error': e.message})
        except (KeyError, ValueError) as e:
            self._json(400, {'error': str(e)})

    def _delete_transaction(self, txn_id):
        try:
            api.delete_transaction(txn_id)
            self._json(200, {'message': 'Transaction deleted successfully'})
        except APIError as e:
            self._json(e.status, {'error': e.message})

    def _handle_pdf_csv(self):
        content_type = self.headers.get('Content-Type', '')
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)
        parser_name = params.get('parser', [None])[0]
        all_txns = []

        if 'multipart/form-data' in content_type:
            form = cgi.FieldStorage(
                fp=self.rfile,
                headers=self.headers,
                environ={'REQUEST_METHOD': 'POST', 'CONTENT_TYPE': content_type}
            )
            files = form['files'] if 'files' in form else []
            if not isinstance(files, list):
                files = [files]
            for f in files:
                if f.filename:
                    data = f.file.read()
                    result = pdf.extract(data, parser_name)
                    if isinstance(result, list):
                        all_txns.extend(result)
        else:
            length = int(self.headers.get('Content-Length', 0))
            data = self.rfile.read(length)
            result = pdf.extract(data, parser_name)
            if isinstance(result, list):
                all_txns.extend(result)

        lines = ['Date,Amount,Type,Description']
        for t in all_txns:
            desc = (t.get('desc', '') or '').replace('"', '""')
            lines.append(f"{t['date']},{t['amount']:.2f},{t['type']},\"{desc}\"")

        body = '\n'.join(lines).encode()
        self.send_response(200)
        self.send_header('Content-Type', 'text/csv')
        self.send_header('Content-Length', len(body))
        self.send_header('Content-Disposition', 'attachment; filename="transactions.csv"')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)

    def _handle_pdf(self):
        content_type = self.headers.get('Content-Type', '')
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)
        parser_name = params.get('parser', [None])[0]
        all_txns = []

        if 'multipart/form-data' in content_type:
            form = cgi.FieldStorage(
                fp=self.rfile,
                headers=self.headers,
                environ={'REQUEST_METHOD': 'POST', 'CONTENT_TYPE': content_type}
            )
            files = form['files'] if 'files' in form else []
            if not isinstance(files, list):
                files = [files]
            for f in files:
                if f.filename:
                    data = f.file.read()
                    result = pdf.extract(data, parser_name)
                    if isinstance(result, list):
                        all_txns.extend(result)
        else:
            length = int(self.headers.get('Content-Length', 0))
            data = self.rfile.read(length)
            result = pdf.extract(data, parser_name)
            if isinstance(result, list):
                all_txns.extend(result)

        self._json(200, {'transactions': all_txns})

    def _json(self, code, data):
        body = json.dumps(data).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', len(body))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.end_headers()

    def log_message(self, format, *args):
        pass

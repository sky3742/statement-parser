import json
import urllib.request
import urllib.error

from .base import FinanceAPI


class MaybeAPI(FinanceAPI):
    """Adapter for Maybe/Sure finance app."""

    def __init__(self, base_url, api_key):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key

    def _request(self, path, method='GET', body=None):
        url = f"{self.base_url}{path}"
        req = urllib.request.Request(url, method=method)
        req.add_header('X-Api-Key', self.api_key)
        req.add_header('Accept', 'application/json')

        if body is not None:
            data = json.dumps(body).encode()
            req.add_header('Content-Type', 'application/json')
            req.data = data

        try:
            resp = urllib.request.urlopen(req, timeout=30)
            return json.loads(resp.read())
        except urllib.error.HTTPError as e:
            err_body = e.read()
            try:
                err = json.loads(err_body)
            except Exception:
                err = {'error': err_body.decode()}
            raise APIError(e.code, err.get('error', str(err)))

    def get_accounts(self):
        data = self._request('/api/v1/accounts')
        return [
            {
                'id': a['id'],
                'name': a['name'],
                'balance': a['balance'],
                'currency': a.get('currency', 'MYR'),
                'classification': a.get('classification', ''),
                'account_type': a.get('account_type', ''),
            }
            for a in data.get('accounts', [])
        ]

    def get_categories(self):
        data = self._request('/api/v1/categories')
        return [
            {
                'id': c['id'],
                'name': c['name'],
                'classification': c.get('classification', ''),
            }
            for c in data.get('categories', [])
        ]

    def get_transactions(self, account_id, per_page=100, page=1):
        data = self._request(
            f'/api/v1/transactions?account_id={account_id}&per_page={per_page}&page={page}'
        )
        txns = []
        for tx in data.get('transactions', []):
            val = float(tx['amount'].replace('RM', '').replace(',', '').strip())
            txns.append({
                'id': tx['id'],
                'date': tx['date'],
                'amount': abs(val),
                'sign': 'income' if val < 0 else 'expense',
                'name': tx['name'],
                'classification': tx.get('classification', ''),
                'notes': tx.get('notes', ''),
                'category_id': (tx.get('category') or {}).get('id'),
                'category_name': (tx.get('category') or {}).get('name'),
            })
        return {
            'transactions': txns,
            'pagination': data.get('pagination', {}),
        }

    def create_transaction(self, account_id, date, amount, name,
                           classification, category_id=None, notes=None):
        txn = {
            'account_id': account_id,
            'date': date,
            'amount': f'{amount:.2f}',
            'name': name,
            'classification': classification,
        }
        if category_id:
            txn['category_id'] = category_id
        if notes:
            txn['notes'] = notes
        return self._request('/api/v1/transactions', method='POST', body={'transaction': txn})

    def delete_transaction(self, transaction_id):
        self._request(f'/api/v1/transactions/{transaction_id}', method='DELETE')
        return True


class APIError(Exception):
    def __init__(self, status, message):
        self.status = status
        self.message = message
        super().__init__(f'{status}: {message}')

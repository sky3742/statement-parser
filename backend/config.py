import os

_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

_ENV = {}
_path = os.path.join(_DIR, '.env')
if os.path.exists(_path):
    with open(_path) as f:
        for line in f:
            line = line.strip()
            if line and '=' in line and not line.startswith('#'):
                k, v = line.split('=', 1)
                _ENV[k.strip()] = v.strip()

API_URL = _ENV.get('API_URL', '')
API_KEY = _ENV.get('API_KEY', '')
PORT = int(_ENV.get('PORT', '8765'))
FRONTEND_DIR = os.path.join(_DIR, 'frontend')

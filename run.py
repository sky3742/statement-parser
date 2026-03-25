import socketserver
import sys

from backend import config
from backend.server import Handler
from backend.parsers import list_parsers


def validate():
    errors = []

    if not config.API_URL:
        errors.append("API_URL not set in .env")
    if not config.API_KEY:
        errors.append("API_KEY not set in .env")

    try:
        import pdfplumber
    except ImportError:
        errors.append("pdfplumber not installed: pip3 install pdfplumber")

    parsers = list_parsers()
    if not parsers:
        errors.append("No statement parsers found")

    return errors


errors = validate()
if errors:
    print("Startup errors:")
    for e in errors:
        print(f"  - {e}")
    sys.exit(1)

print(f"Parsers: {', '.join(p['name'] for p in list_parsers())}")
print(f"Serving at http://localhost:{config.PORT}")


class Server(socketserver.TCPServer):
    allow_reuse_address = True


with Server(("", config.PORT), Handler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")

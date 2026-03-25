import socketserver
import sys

from backend import config
from backend.server import Handler
from backend.parsers import list_parsers


def validate():
    warnings = []
    errors = []

    if not config.API_URL or not config.API_KEY:
        warnings.append("API not configured - running in CSV-only mode")

    try:
        import pdfplumber
    except ImportError:
        errors.append("pdfplumber not installed: pip3 install pdfplumber")

    parsers = list_parsers()
    if not parsers:
        errors.append("No statement parsers found")

    return errors, warnings


errors, warnings = validate()
if errors:
    print("Startup errors:")
    for e in errors:
        print(f"  - {e}")
    sys.exit(1)

for w in warnings:
    print(f"  {w}")

print(f"Parsers: {', '.join(p['name'] for p in list_parsers())}")
print(f"Serving at http://localhost:{config.PORT}")


class Server(socketserver.TCPServer):
    allow_reuse_address = True


with Server(("", config.PORT), Handler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")

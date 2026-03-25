import socketserver

from backend import config
from backend.server import Handler


class Server(socketserver.TCPServer):
    allow_reuse_address = True


print(f"Serving at http://localhost:{config.PORT}")

with Server(("", config.PORT), Handler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")

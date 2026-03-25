import importlib
import os

from .base import StatementParser
from .tng import TnGParser

# Registry: all available parsers
PARSERS = [TnGParser()]

# Auto-discover parsers from this directory
_dir = os.path.dirname(__file__)
for fname in os.listdir(_dir):
    if fname.startswith('_') or not fname.endswith('.py') or fname == 'base.py':
        continue
    mod_name = fname[:-3]
    try:
        mod = importlib.import_module(f'.{mod_name}', __package__)
        for attr in dir(mod):
            cls = getattr(mod, attr)
            if (isinstance(cls, type) and issubclass(cls, StatementParser)
                    and cls is not StatementParser):
                if not any(p.name == cls().name for p in PARSERS):
                    PARSERS.append(cls())
    except Exception:
        pass


def get_parser(name):
    """Get parser by name."""
    for p in PARSERS:
        if p.name == name:
            return p
    return None


def detect_parser(file_bytes):
    """Auto-detect parser from PDF content."""
    try:
        import pdfplumber
        import tempfile
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name
        try:
            with pdfplumber.open(tmp_path) as pdf:
                text = ''
                for page in pdf.pages[:2]:
                    t = page.extract_text()
                    if t:
                        text += t
                for p in PARSERS:
                    if p.detect(text):
                        return p
        finally:
            os.unlink(tmp_path)
    except Exception:
        pass
    return None


def list_parsers():
    """Return list of {name, label} for all registered parsers."""
    return [{'name': p.name, 'label': p.label} for p in PARSERS]

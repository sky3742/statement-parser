from .parsers import get_parser, list_parsers


def extract(file_bytes, parser_name=None):
    """Extract transactions from a PDF statement.

    Args:
        file_bytes: PDF file content as bytes.
        parser_name: Specific parser to use, or None for auto-detect.

    Returns:
        List of transaction dicts, or {'error': str} on failure.
    """
    try:
        import pdfplumber
    except ImportError:
        return {'error': 'pdfplumber not installed. Run: pip3 install pdfplumber'}

    if parser_name:
        parser = get_parser(parser_name)
        if not parser:
            return {'error': f'Unknown parser: {parser_name}. Available: {", ".join(p["name"] for p in list_parsers())}'}
    else:
        parser = _detect(file_bytes)
        if not parser:
            return {'error': 'Could not detect statement type. Use ?parser= to specify. Available: ' + ', '.join(p['name'] for p in list_parsers())}

    try:
        return parser.parse(file_bytes)
    except Exception as e:
        return {'error': str(e)}


def _detect(file_bytes):
    """Detect parser without importing all parsers at module level."""
    import pdfplumber
    import tempfile
    import os

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
            for p in list_parsers():
                parser = get_parser(p['name'])
                if parser and parser.detect(text):
                    return parser
    finally:
        os.unlink(tmp_path)
    return None

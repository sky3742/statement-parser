from .parsers import detect_parser, get_parser, list_parsers


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
            return {'error': f'Unknown parser: {parser_name}'}
    else:
        parser = detect_parser(file_bytes)
        if not parser:
            return {'error': 'Could not detect statement type. Supported: ' + ', '.join(p.label for p in list_parsers())}

    try:
        txns = parser.parse(file_bytes)
        return txns
    except Exception as e:
        return {'error': str(e)}

#!/usr/bin/env python3
"""Convert PDF statement to CSV.

Usage:
    python3 convert.py statement.pdf                  # auto-detect parser
    python3 convert.py statement.pdf --parser tng     # specify parser
    python3 convert.py statement.pdf -o output.csv    # specify output
"""
import argparse
import csv
import sys

from backend.parsers import detect_parser, get_parser, list_parsers


def main():
    parser = argparse.ArgumentParser(description='Convert PDF statement to CSV')
    parser.add_argument('file', nargs='?', help='PDF file path')
    parser.add_argument('--parser', '-p', help='Parser name (e.g. tng)')
    parser.add_argument('--output', '-o', help='Output CSV file (default: stdout)')
    parser.add_argument('--list', '-l', action='store_true', help='List available parsers')
    args = parser.parse_args()

    if args.list:
        for p in list_parsers():
            print(f"  {p['name']:12s} {p['label']}")
        return

    if not args.file:
        parser.print_help()
        return

    with open(args.file, 'rb') as f:
        file_bytes = f.read()

    if args.parser:
        p = get_parser(args.parser)
        if not p:
            print(f"Unknown parser: {args.parser}", file=sys.stderr)
            print(f"Available: {', '.join(x['name'] for x in list_parsers())}", file=sys.stderr)
            sys.exit(1)
    else:
        p = detect_parser(file_bytes)
        if not p:
            print("Could not detect statement type.", file=sys.stderr)
            print(f"Available: {', '.join(x['name'] for x in list_parsers())}", file=sys.stderr)
            sys.exit(1)

    txns = p.parse(file_bytes)
    out = open(args.output, 'w', newline='') if args.output else sys.stdout
    w = csv.writer(out)
    w.writerow(['Date', 'Amount', 'Type', 'Description'])
    for t in txns:
        w.writerow([t['date'], f"{t['amount']:.2f}", t['type'], t['desc']])

    if args.output:
        out.close()
        print(f"Wrote {len(txns)} transactions to {args.output}", file=sys.stderr)
    else:
        print(f"\n# {len(txns)} transactions", file=sys.stderr)


if __name__ == '__main__':
    main()

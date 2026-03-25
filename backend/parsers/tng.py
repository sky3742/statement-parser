import os
import re
import tempfile

from .base import StatementParser


class TnGParser(StatementParser):
    """Touch 'n Go eWallet statement parser."""

    name = 'tng'
    label = 'TnG Wallet'

    def detect(self, text):
        return 'TNG WALLET' in text or 'TnG WALLET' in text

    def parse(self, file_bytes):
        import pdfplumber

        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        txns = []
        try:
            with pdfplumber.open(tmp_path) as pdf:
                in_go = False
                for page in pdf.pages:
                    text = page.extract_text()
                    if not text:
                        continue
                    for line in text.split('\n'):
                        if 'GO+ TRANSACTION' in line:
                            in_go = True
                            continue
                        if in_go:
                            continue

                        m = re.match(r'^(\d{1,2}/\d{1,2}/\d{4})\s+Success\s+', line)
                        if not m:
                            continue
                        ds = m.group(1)

                        if any(x in line for x in [
                            'Quick Reload', 'eWallet Cash Out',
                            'MONEY_PACKET_REFUND', 'GO+ Cash In', 'MMF202'
                        ]):
                            continue

                        amounts = re.findall(r'RM([\d,]+\.\d{2})', line)
                        if len(amounts) < 2:
                            continue
                        amount = float(amounts[-2].replace(',', ''))

                        is_income = (
                            'DUITNOW_RECEI' in line or
                            'Receive from Wallet' in line or
                            ('Money Packet' in line and 'Received' in line)
                        )

                        parts = ds.split('/')
                        date_fmt = f"20{parts[2][-2:]}-{parts[1].zfill(2)}-{parts[0].zfill(2)}"

                        desc = self._extract_description(line)

                        txns.append({
                            'date': date_fmt,
                            'amount': round(amount, 2),
                            'type': 'income' if is_income else 'expense',
                            'desc': desc[:60]
                        })
        finally:
            os.unlink(tmp_path)

        return txns

    def _extract_description(self, line):
        keywords = [
            'DuitNow QR TNGD', 'DuitNow QR', 'RFID Payment',
            'PayDirect Payment', 'Payment', 'Transfer to Wallet',
            'Receive from Wallet', 'Money Packet', 'DUITNOW_RECEI'
        ]
        desc = ''
        for kw in keywords:
            if kw in line:
                rest = line.split(kw, 1)[1].strip()
                desc = re.split(r'\d{16,}', rest)[0].strip()
                break

        desc = re.sub(r'\d{2}/\d{2}/\d{4}\s+\d{2}:\d{2}\s+[AP]M', '', desc).strip()
        desc = re.sub(r'RM[\d.]+\s+RM[\d.]+', '', desc).strip()
        desc = re.sub(r'^\d{11,}\s*', '', desc).strip()
        return desc

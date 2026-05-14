from __future__ import annotations

import re


def normalize_phone(phone: str) -> str:
    cleaned = re.sub(r"[^0-9+]", "", phone or "")
    if cleaned.startswith("+"):
        digits = re.sub(r"[^0-9]", "", cleaned)
        return f"+{digits}"

    digits = re.sub(r"\D", "", cleaned)
    if len(digits) == 10:
        return f"+91{digits}"
    if len(digits) == 11 and digits.startswith("0"):
        return f"+91{digits[-10:]}"
    if len(digits) == 12 and digits.startswith("91"):
        return f"+{digits}"

    raise ValueError("Invalid phone number format. Please provide a 10-digit Indian phone number.")

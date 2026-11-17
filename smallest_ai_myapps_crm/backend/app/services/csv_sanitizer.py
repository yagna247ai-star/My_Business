import re
import csv
import io
from typing import List, Dict, Any, Tuple

class CSVSanitizer:
    @staticmethod
    def sanitize_phone(phone_str: str) -> str:
        if not phone_str:
            return ""
        # Remove non-digit characters except leading plus
        cleaned = re.sub(r"[^\d+]", "", str(phone_str).strip())
        if not cleaned.startswith("+"):
            if len(cleaned) == 12 and cleaned.startswith("91"):
                cleaned = "+" + cleaned
            elif len(cleaned) == 10 and cleaned[0] in "6789":
                cleaned = "+91" + cleaned
            elif len(cleaned) == 10:
                cleaned = "+1" + cleaned
            else:
                cleaned = "+" + cleaned
        return cleaned

    @classmethod
    def parse_and_validate(cls, file_content: str) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        valid_leads = []
        invalid_leads = []
        seen_phones = set()

        reader = csv.DictReader(io.StringIO(file_content))
        for row_idx, row in enumerate(reader, start=1):
            # Normalize keys to lowercase
            norm_row = {k.strip().lower(): v.strip() for k, v in row.items() if k}
            
            name = norm_row.get("name") or norm_row.get("full_name") or norm_row.get("contact_name") or f"Lead #{row_idx}"
            phone_raw = norm_row.get("phone") or norm_row.get("phone_number") or norm_row.get("mobile") or norm_row.get("contact") or ""
            business = norm_row.get("business") or norm_row.get("company") or norm_row.get("solar_need") or norm_row.get("notes") or "General Inquiry"
            email = norm_row.get("email") or ""

            sanitized_phone = cls.sanitize_phone(phone_raw)

            if not sanitized_phone or len(sanitized_phone) < 8:
                invalid_leads.append({
                    "row": row_idx,
                    "name": name,
                    "raw_phone": phone_raw,
                    "reason": "Invalid or missing phone number format"
                })
            elif sanitized_phone in seen_phones:
                invalid_leads.append({
                    "row": row_idx,
                    "name": name,
                    "raw_phone": phone_raw,
                    "reason": f"Duplicate phone number ({sanitized_phone})"
                })
            else:
                seen_phones.add(sanitized_phone)
                valid_leads.append({
                    "id": f"lead_{row_idx}_{sanitized_phone[-4:]}",
                    "name": name,
                    "phone": sanitized_phone,
                    "email": email,
                    "business": business,
                    "status": "Ready",
                    "attempts": 0
                })

        return valid_leads, invalid_leads

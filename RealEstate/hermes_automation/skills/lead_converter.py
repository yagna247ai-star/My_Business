"""
Hermes Agent Skill: Lead Converter
Converts raw Meta/Google lead form CSV files (UTF-16LE, Tab-separated)
to standard contact lists (UTF-8, Comma-separated) with cleaned phone numbers
and inferred company names.
"""

import csv
import re
import os
from typing import Dict, Any

class LeadConverterSkill:
    def __init__(self):
        self.known_keywords = [
            'solarsystems', 'solar', 'enterprises', 'enterprise', 'systems', 'system', 
            'projects', 'project', 'solutions', 'services', 'service', 'agencies', 'agency', 
            'groups', 'group', 'technologies', 'tech', 'energies', 'energy', 'power', 
            'properties', 'property', 'traders', 'industries', 'infratech', 'infra', 
            'renewables', 'renewable', 'greens', 'green', 'ventures', 'venture', 
            'sunlight', 'sun', 'rays', 'electric', 'electricals', 'assured', 'smarteye', 
            'smart', 'eye', 'vayuputra', 'sreevasavi', 'vasavi'
        ]
        self.acronyms = {'ap': 'AP', 'ts': 'TS', 'br': 'BR', 'ss': 'SS', 'hyd': 'Hyd', 'hydd': 'Hyd'}
        self.public_domains = {'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'rediffmail.com', 'yahoo.co.in'}

    def clean_phone(self, phone_raw: str) -> str:
        if not phone_raw:
            return ""
        return re.sub(r'[^0-9+]', '', phone_raw)

    def _split_compound_token(self, token: str) -> list:
        token_lower = token.lower()
        if token_lower in self.known_keywords or token_lower in self.acronyms:
            return [token_lower]
        for kw in sorted(self.known_keywords, key=len, reverse=True):
            if token_lower.endswith(kw) and len(token_lower) > len(kw):
                prefix_part = token_lower[:-len(kw)]
                return self._split_compound_token(prefix_part) + [kw]
            elif token_lower.startswith(kw) and len(token_lower) > len(kw):
                suffix_part = token_lower[len(kw):]
                return [kw] + self._split_compound_token(suffix_part)
        return [token_lower]

    def extract_business_name(self, full_name: str, email: str) -> str:
        full_name_clean = re.sub(r'[^\w\s]', ' ', full_name).strip()
        full_name_clean = ' '.join(full_name_clean.split())
        email_lower = email.lower().strip() if email else ''
        parts = email_lower.split('@') if '@' in email_lower else [email_lower, '']
        prefix = parts[0]
        domain = parts[1]
        
        if domain and domain not in self.public_domains:
            domain_name = domain.split('.')[0]
            domain_clean = re.sub(r'[^a-zA-Z0-9]', ' ', domain_name).title()
            if 'solar' not in domain_clean.lower():
                domain_clean += ' Solar'
            return domain_clean
            
        prefix_no_digits = re.sub(r'\d+', ' ', prefix)
        raw_tokens = re.split(r'[\._\-\s]+', prefix_no_digits)
        raw_tokens = [t.strip() for t in raw_tokens if t.strip()]
        
        split_tokens = []
        for t in raw_tokens:
            split_tokens.extend(self._split_compound_token(t))
            
        has_biz_keyword = any(kw in self.known_keywords for kw in split_tokens)
        
        if has_biz_keyword:
            formatted_words = []
            for t in split_tokens:
                if t in self.acronyms:
                    formatted_words.append(self.acronyms[t])
                else:
                    formatted_words.append(t.capitalize())
            biz_title = ' '.join(formatted_words)
            if 'solar' not in biz_title.lower():
                biz_title += ' Solar'
            return biz_title
            
        if any(kw in full_name_clean.lower() for kw in ['solar', 'enterprise', 'project', 'system', 'energy', 'power']):
            return full_name_clean.title()
            
        return f"{full_name_clean} Solar Services"

    def convert(self, source_path: str, target_path: str) -> Dict[str, Any]:
        """
        Converts the lead list CSV file to a clean contacts CSV file.
        """
        if not os.path.exists(source_path):
            raise FileNotFoundError(f"Source file not found: {source_path}")

        # Open and parse source
        with open(source_path, 'r', encoding='utf-16') as f:
            reader = csv.DictReader(f, delimiter='\t')
            rows = list(reader)
        
        fieldnames = ['Name', 'Phone', 'Email', 'Company', 'Lead ID', 'Created Time', 'Source', 'Experience', 'Profit']
        
        # Ensure target directory exists
        os.makedirs(os.path.dirname(os.path.abspath(target_path)), exist_ok=True)

        with open(target_path, 'w', encoding='utf-8', newline='') as f_out:
            writer = csv.DictWriter(f_out, fieldnames=fieldnames)
            writer.writeheader()
            
            for r in rows:
                full_name = r.get('full_name', '')
                email = r.get('email', '')
                phone_raw = r.get('phone_number', '')
                
                writer.writerow({
                    'Name': full_name,
                    'Phone': self.clean_phone(phone_raw),
                    'Email': email,
                    'Company': self.extract_business_name(full_name, email),
                    'Lead ID': r.get('id', ''),
                    'Created Time': r.get('created_time', ''),
                    'Source': r.get('platform', ''),
                    'Experience': r.get('meeru_enni_years_nunchi_solar_business_chestunnaru?', ''),
                    'Profit': r.get('meeru_entha_profit_gain_chesaru?', '')
                })
                
        return {
            "success": True,
            "processed_count": len(rows),
            "output_file": target_path
        }

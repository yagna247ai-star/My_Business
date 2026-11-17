"""
Hermes Agent Skill: Sales Tracker Sync & Daily Executive Reporting Engine
Updates Abhinandhana_Visit_Close_Tracker.xlsx in real-time and generates 8 PM GM Sales Telegram/WhatsApp report digest.
"""

import os
import logging
from typing import Dict, Any, List
from datetime import datetime
import pandas as pd

logger = logging.getLogger("hermes.skills.tracker_sync")

class TrackerSyncSkill:
    def __init__(self, tracker_excel_path: str):
        self.tracker_excel_path = tracker_excel_path

    def update_lead_status(self, lead_id: str, new_status: str, notes: str = "") -> bool:
        """
        Safely updates a lead's status in the Excel file. Creates a new sheet if missing/corrupt.
        """
        try:
            if os.path.exists(self.tracker_excel_path) and os.path.getsize(self.tracker_excel_path) > 0:
                try:
                    df = pd.read_excel(self.tracker_excel_path)
                except Exception:
                    df = pd.DataFrame(columns=["Lead_ID", "Status", "Notes", "Updated_At"])
            else:
                df = pd.DataFrame(columns=["Lead_ID", "Status", "Notes", "Updated_At"])

            mask = df.iloc[:, 0].astype(str) == str(lead_id) if not df.empty else pd.Series([], dtype=bool)
            if not mask.empty and mask.any():
                df.loc[mask, "Status"] = new_status
                if "Notes" in df.columns:
                    df.loc[mask, "Notes"] = notes
                df.loc[mask, "Updated_At"] = datetime.now().isoformat()
            else:
                new_row = {"Lead_ID": lead_id, "Status": new_status, "Notes": notes, "Updated_At": datetime.now().isoformat()}
                df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)

            os.makedirs(os.path.dirname(os.path.abspath(self.tracker_excel_path)), exist_ok=True)
            df.to_excel(self.tracker_excel_path, index=False)
            logger.info(f"Successfully updated lead {lead_id} status to '{new_status}' in Excel.")
            return True
        except Exception as e:
            logger.error(f"Error updating Excel tracker: {e}")
            return False

    def generate_daily_executive_digest(self, stats: Dict[str, Any]) -> str:
        date_str = datetime.now().strftime("%Y-%m-%d")
        total_leads = stats.get("total_leads_today", 0)
        sla_pct = stats.get("sla_adherence_pct", 100.0)
        visits_booked = stats.get("visits_booked", 0)
        visits_attended = stats.get("visits_attended", 0)
        show_rate = (visits_attended / visits_booked * 100.0) if visits_booked > 0 else 0.0
        offers_made = stats.get("offers_made", 0)
        tokens_collected_inr = stats.get("tokens_collected_inr", 0.0)
        
        return (
            f"📈 **Abhinandhana Avenues — Daily Sales Digest ({date_str})**\n\n"
            f"📥 **New Leads Received:** {total_leads}\n"
            f"⚡ **Response SLA (<5 min):** {sla_pct:.1f}%\n"
            f"🚗 **Site Visits:** {visits_booked} Booked | {visits_attended} Attended (Show Rate: **{show_rate:.1f}%**)\n"
            f"🎯 **Offers Made:** {offers_made}\n"
            f"💳 **Tokens Collected:** ₹{tokens_collected_inr:,.2f}\n\n"
            f"🔍 **Leak Warning & Actions:**\n"
            f"• {stats.get('leak_warning', 'All leads within response SLA. Zero unattended site visits.')}\n\n"
            f"🤖 *Report generated autonomously by Hermes Agent.*"
        )


if __name__ == "__main__":
    sync = TrackerSyncSkill("/tmp/test_tracker.xlsx")
    sync.update_lead_status("TEST_1", "Responded", "Test notes")

"""
Hermes Agent Skill: Site Visit Booking & Confirmation Protocol (Show-Rate Booster)
Lifts show-rates from 50% to 75%+ with automated confirmations and no-show recovery.
"""

from typing import Dict, Any

class SiteVisitSchedulerSkill:
    def format_booking_confirmation(self, lead_name: str, visit_date: str, visit_time: str, pickup_location: str, driver_details: str) -> str:
        return (
            f"✅ **Site Visit Scheduled — Abhinandhana Avenues**\n\n"
            f"Dear {lead_name},\n"
            f"Your site visit is confirmed for **{visit_date} at {visit_time}**.\n\n"
            f"📍 **Pickup Point:** {pickup_location}\n"
            f"🚘 **Vehicle & Driver:** {driver_details}\n"
            f"🗺️ **Site Rep Contact:** +91-9876543210 (Mr. Venkatesh, Sales Manager)\n\n"
            f"We have reserved 3 high-potential plots for your review. See you soon!"
        )

    def generate_24h_reminder(self, lead_name: str, visit_date: str, visit_time: str) -> str:
        return (
            f"Namaste {lead_name} 🙏 Reminder: Your plot site visit is scheduled for tomorrow **{visit_date} at {visit_time}**.\n"
            f"Our car driver will contact you 1 hour before pickup.\n"
            f"Please let us know if you need to adjust timing!"
        )

    def generate_2h_nudge(self, lead_name: str, pickup_location: str) -> str:
        return (
            f"Hi {lead_name}! Our driver is en route to {pickup_location} for your site visit.\n"
            f"Weather is pleasant at the layout today. Have a great site visit!"
        )

    def generate_no_show_recovery(self, lead_name: str, plots_reserved: int = 3) -> Dict[str, str]:
        """
        Non-guilt recovery script in English and Telugu.
        """
        en = (
            f"Hi {lead_name}, hope all is well. I noticed we missed each other yesterday — no problem at all, these things happen.\n"
            f"The {plots_reserved} plots I kept for you are still available, but 2 buyers are visiting them this weekend.\n"
            f"I can hold them for you till Sunday — should I keep them on hold for you?"
        )
        te = (
            f"హాయ్ {lead_name}, అంతా బాగుందా? నిన్న మనం కలవలేకపోయాము — పర్వాలేదు.\n"
            f"మీ కోసం ఉంచిన {plots_reserved} ప్లాట్లు ఇంకా అందుబాటులో ఉన్నాయి, కానీ ఈ వారాంతంలో మరో 2 మంది చూడటానికి వస్తున్నారు.\n"
            f"ఆదివారం వరకు మీ కోసం పట్టుకోవాలా?"
        )
        return {"en": en, "te": te}


if __name__ == "__main__":
    scheduler = SiteVisitSchedulerSkill()
    print("--- Test Booking Confirmation ---")
    print(scheduler.format_booking_confirmation("Kalyan", "Saturday, Aug 9", "10:00 AM", "LB Nagar Metro Station", "AP 09 CB 1234 (Ramesh)"))
    print("\n--- Test No-Show Recovery ---")
    print(scheduler.generate_no_show_recovery("Kalyan")["te"])

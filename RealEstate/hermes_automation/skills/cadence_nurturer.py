"""
Hermes Agent Skill: 90-Day Cadence & Nurturing Engine
Schedules multi-touch micro-content follow-ups based on lead stage and buyer persona.
"""

from typing import Dict, Any, List
from datetime import datetime, timedelta

class CadenceNurturerSkill:
    CADENCE_SCHEDULE = {
        0: {"type": "instant_response", "channel": "WhatsApp + Call", "goal": "Warm + Qualify"},
        1: {"type": "brochure_dispatch", "channel": "WhatsApp", "goal": "Project PDF + Price Sheet"},
        2: {"type": "drone_video_social_proof", "channel": "WhatsApp", "goal": "3 site photos + Drone video + Testimonial"},
        3: {"type": "visit_booking_push", "channel": "Call + WhatsApp", "goal": "Book weekend site visit with car pickup"},
        7: {"type": "legal_approvals_nudge", "channel": "WhatsApp", "goal": "RERA certificate + DTCP/HMDA layout approvals"},
        14: {"type": "emi_calculator_nudge", "channel": "WhatsApp", "goal": "Custom EMI calculator breakdown for budget band"},
        21: {"type": "rebooking_push", "channel": "Call", "goal": "Rebook visit with free guidance session"},
        30: {"type": "progress_price_hike_alert", "channel": "WhatsApp", "goal": "Phase development photo + price increase alert"},
        45: {"type": "requalify_checkin", "channel": "Call", "goal": "Check budget changes & remaining inventory"},
        60: {"type": "video_testimonials", "channel": "WhatsApp", "goal": "Video testimonials from buyers in same city/profession"},
        75: {"type": "closing_token_push", "channel": "Call + WhatsApp", "goal": "Last plots in band + 48h token discount offer"},
        90: {"type": "exit_or_recycle", "channel": "WhatsApp", "goal": "Final offer before tagging as cold/recycle"}
    }

    def get_touchpoint_for_day(self, day_number: int) -> Dict[str, Any]:
        return self.CADENCE_SCHEDULE.get(day_number, None)

    def generate_message_content(self, day_number: int, lead_name: str, persona_id: str) -> str:
        if day_number == 1:
            return (
                f"Hi {lead_name} 👋 As promised, here is our complete project brochure and layout map.\n"
                f"📌 All plots are 100% DTCP/HMDA approved with clear title deed guarantees.\n"
                f"Reply with any questions or if you'd like an EMI breakdown!"
            )
        elif day_number == 2:
            return (
                f"Namaste {lead_name} 🙏 Take a 30-second virtual walk through our layout!\n"
                f"📹 Here is recent drone video showing 40ft blacktop roads, underground drainage, and electricity poles.\n"
                f"What do you think of this development progress?"
            )
        elif day_number == 3:
            return (
                f"Hi {lead_name}, I have shortlisted the 3 best plots matching your budget.\n"
                f"Layout photos are good, but walking the land & checking road width gives true clarity!\n\n"
                f"🚗 We are providing free pickup & drop from landmark points this Saturday and Sunday.\n"
                f"Which day works better for you: Saturday or Sunday?"
            )
        elif day_number == 14:
            return (
                f"Hello {lead_name}! Did you know you can own an approved plot with down payment starting from 10%?\n"
                f"📊 For a ₹10 Lakh plot, your EMI comes to approx ₹11,500/month.\n"
                f"Would you like me to send a customized EMI schedule for your exact budget?"
            )
        else:
            touchpoint = self.get_touchpoint_for_day(day_number)
            goal = touchpoint['goal'] if touchpoint else "Follow up"
            return f"Namaste {lead_name}, checking in regarding your open plot enquiry ({goal}). Let us know when convenient to talk!"


if __name__ == "__main__":
    nurturer = CadenceNurturerSkill()
    print(nurturer.generate_message_content(3, "Srinivas", "salaried_pro"))

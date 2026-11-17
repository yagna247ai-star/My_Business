"""
Hermes Agent Skill: NRI Remote Closing & Digital Token Engine
Handles Gulf & US/UK NRI remote buyers, digital due diligence packets, video tours, and POA workflow.
"""

from typing import Dict, Any

class NRIRemoteClosingSkill:
    def format_video_walkthrough_invite(self, nri_name: str, timezone: str, plot_no: str) -> str:
        return (
            f"Dear {nri_name} 🙏\n"
            f"We have arranged a **Live 4K Drone + Video Walkthrough** for Plot No. {plot_no}.\n"
            f"📅 Scheduled Time: Tailored to your local timezone ({timezone}).\n\n"
            f"Our Senior Field Manager will be live on site with a laser distance meter to show you corner pegs, road width (40ft), and surrounding developments.\n"
            f"Join link: https://meet.google.com/abh-avenues-nri"
        )

    def assemble_due_diligence_packet(self, project_name: str, plot_no: str) -> Dict[str, str]:
        return {
            "title_deed": f"https://docs.abhinandhana.com/legal/{project_name}_title_deed_master.pdf",
            "encumbrance_certificate": f"https://docs.abhinandhana.com/legal/{project_name}_ec_2026.pdf",
            "rera_approval": f"https://docs.abhinandhana.com/legal/{project_name}_RERA_certified.pdf",
            "dtcp_hmda_layout": f"https://docs.abhinandhana.com/legal/{project_name}_layout_approval.pdf",
            "dharani_igrs_link": "https://dharani.telangana.gov.in/ / https://registration.ap.gov.in/"
        }

    def generate_token_payment_link(self, nri_name: str, plot_no: str, token_amount_inr: float) -> str:
        return (
            f"🔒 **Secure Reservation Token Link for Plot #{plot_no}**\n"
            f"Buyer: {nri_name}\n"
            f"Token Amount: ₹{token_amount_inr:,.2f}\n"
            f"Payment Modes: International Wire (SWIFT/NRE/NRO), Credit Card, or NetBanking\n"
            f"Pay Securely Here: https://pay.abhinandhana.com/token?plot={plot_no}&amt={int(token_amount_inr)}\n"
            f"*(Note: 100% refundable within 7 days if title verification is unsatisfactory)*"
        )


if __name__ == "__main__":
    nri_skill = NRIRemoteClosingSkill()
    print(nri_skill.format_video_walkthrough_invite("Dr. Suresh (US NRI)", "EST (7:30 PM)", "142"))
    print("\nToken Link:")
    print(nri_skill.generate_token_payment_link("Dr. Suresh (US NRI)", "142", 50000))

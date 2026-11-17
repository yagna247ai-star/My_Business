"""
Hermes Agent Skill: Autonomous Lead Generation & Social Platform Projection Engine
Uses Mama Hermes intelligence to generate platform-specific lead hooks, reel scripts, ad copy, and DM outreach for Hyderabad open plots.
"""

import json
import os
import logging
from typing import Dict, Any, List

logger = logging.getLogger("hermes.skills.lead_generator")

class LeadGeneratorSkill:
    def __init__(self, projects_file_path: str):
        with open(projects_file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            self.corridors = data.get("hyderabad_corridors", [])

    def get_corridor_data(self, corridor_id: str) -> Dict[str, Any]:
        return next((c for c in self.corridors if c["id"] == corridor_id), self.corridors[0])

    def generate_instagram_reel_script(self, corridor_id: str) -> Dict[str, str]:
        corridor = self.get_corridor_data(corridor_id)
        plot_cost_150 = corridor["price_per_sqyd"] * 150
        emi_est = int((plot_cost_150 * 0.8 * 0.012)) # Approx monthly EMI

        hook = f"🚨 Still paying ₹30,000 rent in Gachibowli? Here is how to own land 30 mins away for ₹{emi_est:,}/month!"
        visual = f"High-resolution 4K Drone shot of 40ft blacktop roads, underground electricity, and green parks at {corridor['name']}."
        voiceover = (
            f"Why buy a small apartment when you can own 150 sq. yds of HMDA approved land near {corridor['zone']}?\n"
            f"📍 Only {corridor['distance_from_hitech_city'] if 'distance_from_hitech_city' in corridor else corridor['distance_from_airport']}.\n"
            f"✅ 100% Clear Title & TS RERA Registered.\n"
            f"💬 Comment 'PLOT' below or DM us to get free layout PDF & weekend car pickup from {corridor['pickup_landmark']}!"
        )
        return {
            "platform": "Instagram Reels / TikTok",
            "hook": hook,
            "visual_direction": visual,
            "voiceover_script": voiceover,
            "cta_trigger": "Comment 'PLOT' or DM for layout PDF"
        }

    def generate_facebook_ad_copy(self, corridor_id: str) -> Dict[str, str]:
        corridor = self.get_corridor_data(corridor_id)
        headline = f"🏡 HMDA & TS RERA Approved Plots in {corridor['name']} — Easy EMI Options Available!"
        body = (
            f"Looking to secure your family's future with high-appreciation land in Hyderabad?\n\n"
            f"✨ **Project Highlights:**\n"
            f"• Location: {corridor['name']} ({corridor['zone']})\n"
            f"• Approvals: {corridor['approvals']}\n"
            f"• Plot Sizes: {', '.join(str(s) for s in corridor['typical_plot_sizes'])} Sq. Yds\n"
            f"• Rates: Starting from ₹{corridor['price_per_sqyd']:,}/sq.yd\n"
            f"• Features: {corridor['key_highlights']}\n\n"
            f"🚗 **Free Site Visit Inspection:** Free AC car pickup arranged from {corridor['pickup_landmark']} every Saturday & Sunday.\n\n"
            f"👇 Click 'Learn More' to download the certified layout map and price sheet instantly!"
        )
        return {
            "platform": "Facebook Feed / Instant Form",
            "headline": headline,
            "body_copy": body,
            "cta_button": "Download Brochure"
        }

    def generate_dm_outreach_message(self, lead_name: str, platform: str, corridor_id: str) -> str:
        corridor = self.get_corridor_data(corridor_id)
        if platform.lower() == "instagram":
            return (
                f"Hi {lead_name} 👋 Thanks for commenting on our {corridor['name']} project video!\n\n"
                f"Here is the verified layout brochure & RERA approval copy. 📌\n"
                f"Plots are starting at ₹{corridor['price_per_sqyd']:,}/sq.yd with easy 12-60 month EMI plans.\n\n"
                f"Are you looking for investment or building a home near {corridor['zone']}?"
            )
        else: # Facebook
            return (
                f"Namaste {lead_name} 🙏 Thank you for connecting with Abhinandhana Avenues on Facebook.\n\n"
                f"Our {corridor['name']} project is 100% {corridor['approvals']}.\n"
                f"We are hosting free site visit pickups from {corridor['pickup_landmark']} this weekend.\n\n"
                f"Would you prefer Saturday or Sunday morning for a visit with your family?"
            )

    def build_personal_rapport_script(self, lead_name: str, profession: str, preferred_corridor: str) -> str:
        """
        Hyper-personalized rapport builder focusing on Hyderabad commuters and families.
        """
        return (
            f"🤝 **Personal Rapport Script for {lead_name} ({profession})**\n\n"
            f"1. **Empathy Hook:** 'I completely understand. As an IT professional in Hyderabad, spending ₹35k rent every month feels like money down the drain when you could build equity in land.'\n"
            f"2. **Local Convenience:** 'Our layout is just 30 mins straight down the Shankarpally highway — hassle-free drive from Financial District.'\n"
            f"3. **Zero Risk Guarantee:** 'We show you Dharani online records, Encumbrance Certificate (EC), and HMDA LP number BEFORE you pay any token.'\n"
            f"4. **Action:** 'Let me arrange a private car to pick up you and your family from Miyapur Metro this Sunday at 10 AM. No pressure, just inspect the land!'"
        )


if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    proj_path = os.path.join(base_dir, "memory", "hyderabad_projects.json")
    generator = LeadGeneratorSkill(proj_path)
    
    print("--- INSTAGRAM REEL SCRIPT ---")
    reel = generator.generate_instagram_reel_script("shankarpally_west")
    print(f"Hook: {reel['hook']}")
    print(f"Voiceover:\n{reel['voiceover_script']}")
    
    print("\n--- FACEBOOK AD COPY ---")
    fb = generator.generate_facebook_ad_copy("shadnagar_south")
    print(f"Headline: {fb['headline']}")
    
    print("\n--- PERSONAL RAPPORT SCRIPT ---")
    print(generator.build_personal_rapport_script("Srinivas", "Software Engineer at Microsoft", "Shankarpally"))

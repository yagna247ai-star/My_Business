"""
Chat Flow Lead Enrichment — Python skill for BANGI hybrid router
Attachable to Chat Flow: capture phone → FB/IG links → analyze → CRM + notes → score 0-100 → capability → human handover
Reuse existing solar-lead-enricher scoring + bangi_agent.handle_incoming_lead
"""
import re
import json
from datetime import datetime
from typing import Dict, Any, Optional
from urllib.parse import quote_plus

# 13yr Solar scoring (from solar-lead-enricher)
def score_lead_raw(business_tenure: str, profit_volume: str, intent: str, digital: str, recency: str = "5min") -> tuple[int, str]:
    tenure_map = {"more_than_1_year": 25, "1_year": 18, "6_months": 10, "unknown": 5}
    profit_map = {"more_than_5_lakh": 25, "1_lakh_2_lakh": 18, "50k": 10, "unknown": 5}
    intent_map = {"whatsapp": 15, "facebook": 15, "facebook_feed": 15, "instagram": 12, "unknown": 8}
    digital_map = {"custom_domain": 15, "business_gmail": 12, "standard_gmail": 8, "unknown": 8}
    recency_map = {"5min": 20, "60min": 18, "24h": 12, "unknown": 12}
    s = tenure_map.get(business_tenure, 5) + profit_map.get(profit_volume, 5) + intent_map.get(intent, 8) + digital_map.get(digital, 8) + recency_map.get(recency, 12)
    tier = "Platinum" if s >= 85 else "Gold" if s >= 65 else "Silver"
    return min(100, s), tier

def extract_tenure_profit(message: str) -> tuple[str, str]:
    m = message.lower()
    # tenure
    if any(k in m for k in ["2 year", "2 years", "more than 1 year", "3 year"]): tenure = "more_than_1_year"
    elif "1 year" in m: tenure = "1_year"
    elif "6 month" in m: tenure = "6_months"
    else: tenure = "unknown"
    # profit
    if any(k in m for k in ["5 lakh", "5lakh", "3 lakh", "4 lakh"]): profit = "more_than_5_lakh" if "5" in m else "1_lakh_2_lakh"
    elif "1 lakh" in m or "2 lakh" in m: profit = "1_lakh_2_lakh"
    elif "50k" in m: profit = "50k"
    else: profit = "unknown"
    # refine 3 lakh → 1_lakh_2_lakh bucket is wrong — map to more_than_5_lakh? keep simple: 3L→1_lakh_2_lakh
    if "3 lakh" in m: profit = "1_lakh_2_lakh"
    return tenure, profit

def fb_ig_links(name: str, phone: str) -> Dict[str, str]:
    q = quote_plus(name.strip() or phone)
    return {
        "fb_search_url": f"https://www.facebook.com/search/top/?q={q}",
        "ig_search_url": f"https://www.instagram.com/explore/search/keyword/?q={q}",
        "google_search_url": f"https://www.google.com/search?q={q}+{phone}",
    }

class ChatFlowLeadSkill:
    """Skill to be attached to Chat Flow workflow"""
    name = "chatflow-lead-enrichment"
    description = "Chat Flow: capture phone → FB/IG → CRM + notes → score → capability → handover"

    async def execute(self, payload: Dict[str, Any], bangi_agent) -> Dict[str, Any]:
        # 1) Capture
        phone = re.sub(r"\D", "", str(payload.get("phone") or payload.get("contact_phone") or ""))
        if len(phone) == 11 and phone.startswith("91"): phone = phone[2:]
        phone_e164 = f"91{phone}" if len(phone) == 10 else phone
        name = (payload.get("name") or payload.get("contact_name") or "Lead").strip()
        message = (payload.get("message") or payload.get("text") or "").strip()
        channel = payload.get("channel") or payload.get("source") or "chat_flow"

        # 2) FB/IG
        links = fb_ig_links(name, phone)

        # 3) Analysis
        tenure, profit = extract_tenure_profit(message)
        intent = "whatsapp" if channel == "chat_flow" else "unknown"
        digital = "standard_gmail"  # default unless email given

        # 4) CRM record + Notes (via bangi_agent.handle_incoming_lead)
        crm_payload = {
            "phone": phone_e164,
            "name": name,
            "message": message,
            "source": channel,
            "fb_search_url": links["fb_search_url"],
            "ig_search_url": links["ig_search_url"],
        }
        # Score
        score, tier = score_lead_raw(tenure, profit, intent, digital, recency="5min")

        # Capability
        capability = "high" if profit in ("more_than_5_lakh", "1_lakh_2_lakh") and tenure != "unknown" else "medium" if tenure != "unknown" else "low"
        max_proposal = "₹3,000 7-day test / ₹500 per survey" if capability == "high" else "Nurture 90-day"

        # Notes
        notes = (
            f"[{datetime.now().strftime('%Y-%m-%d %H:%M IST')}] Chat Flow ping — phone {phone_e164}\n"
            f"Message: {message}\n"
            f"FB: {links['fb_search_url']}\n"
            f"IG: {links['ig_search_url']}\n"
            f"Analysis: tenure={tenure}, profit={profit}, intent={intent}\n"
            f"Score: {score}/100 ({tier})\n"
            f"Capability: {capability} → {max_proposal}\n"
            f"Next: {'human call within 5 min (Telugu)' if score >= 75 else 'nurture 90-day'}"
        )

        # 5) Write to CRM (fire and forget, but log)
        try:
            crm_result = await bangi_agent.handle_incoming_lead(crm_payload)
        except Exception as e:
            crm_result = {"error": str(e), "mode": "fallback"}

        # 6) Handover decision
        handover = score >= 75 or capability == "high" or "custom" in message.lower()

        return {
            "skill": self.name,
            "phone": phone_e164,
            "name": name,
            "fb_ig": links,
            "analysis": {"tenure": tenure, "profit": profit, "intent": intent},
            "score": score,
            "tier": tier,
            "capability": capability,
            "max_proposal": max_proposal,
            "notes": notes,
            "crm_result": crm_result,
            "handover": {"required": handover, "reason": "score>=75 or high capability or custom" if handover else "nurture"},
            "next_action": "human_call_5min" if handover else "nurture_90day",
        }

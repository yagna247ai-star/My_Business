"""
Hermes Agent Skill: Sales Call Coach & 4-Pillar Framework Reviewer
Analyzes sales call transcripts/Fathom inputs, calculates compliance scores,
and provides feedback for Yagna & Prabhuraj.
"""

import re
from typing import Dict, Any, List

class SalesCallCoachSkill:
    def __init__(self):
        # Keyword mappings for detecting framework components in transcripts
        self.indicators = {
            "rapport": [
                r"weather", r"how are you", r"weekend", r"family", r"sports", r"cricket",
                r"hobbies", r"hometown", r"nice to meet", r"personal connection"
            ],
            "diagnosis": [
                r"why", r"history", r"how long", r"current performance", r"ad spend",
                r"leads", r"enquiries", r"sales", r"usp", r"unique selling", r"pain point"
            ],
            "automation": [
                r"zero lead leakage", r"leakage", r"automation", r"welcome", r"nurturing",
                r"7-day", r"calendar", r"crm", r"immediate welcome", r"follow-up sequence"
            ],
            "responsibilities": [
                r"partnership", r"5 minutes", r"sla", r"follow-up", r"ad spend",
                r"meta ad", r"300", r"500", r"1000", r"2000", r"whatsapp costs", r"feedback"
            ],
            "pricing_closing": [
                r"50,000", r"50k", r"25,000", r"25k", r"special privilege", r"advance", r"token",
                r"anchor", r"options", r"commit"
            ]
        }

    def analyze_transcript(self, transcript: str) -> Dict[str, Any]:
        """
        Analyzes a sales call transcript and returns scores and qualitative feedback.
        """
        transcript_lower = transcript.lower()
        scores = {}
        matched_details = {}

        # Calculate scores for each category based on keyword density/presence
        for category, patterns in self.indicators.items():
            matches = []
            for pattern in patterns:
                found = re.findall(pattern, transcript_lower)
                if found:
                    matches.append((pattern, len(found)))
            
            # Basic score calculation: ratio of unique patterns found to total patterns
            unique_matches = len(matches)
            total_patterns = len(patterns)
            score = int((unique_matches / total_patterns) * 100) if total_patterns > 0 else 0
            
            scores[category] = score
            matched_details[category] = matches

        # Overall compliance score
        overall_score = int(sum(scores.values()) / len(scores)) if scores else 0

        # Generate action items and feedback
        feedback = self._generate_feedback(scores)

        return {
            "overall_score": overall_score,
            "category_scores": scores,
            "matched_indicators": matched_details,
            "feedback": feedback
        }

    def _generate_feedback(self, scores: Dict[str, int]) -> List[str]:
        feedback = []
        if scores.get("rapport", 0) < 50:
            feedback.append("⚠️ Pillar 1 (Rapport) was weak. Spend the first 90 seconds building a personal, non-business connection.")
        if scores.get("diagnosis", 0) < 50:
            feedback.append("⚠️ Pillar 2 (Diagnosis) missing details. Probe deeper on the client's current ad spend, lead volume, and USP.")
        if scores.get("automation", 0) < 50:
            feedback.append("⚠️ Pillar 3 (Automation) not fully pitched. Highlight the zero lead leakage benefit and the 7-day nurturing sequence.")
        if scores.get("responsibilities", 0) < 50:
            feedback.append("⚠️ Pillar 4 (Responsibilities) not clearly defined. Emphasize the 5-minute lead SLA, ad spend budgets, and feedback group.")
        if scores.get("pricing_closing", 0) < 50:
            feedback.append("⚠️ Closing strategy missed. Make sure to anchor with ₹50,000 before offering the ₹25,000 Special Privilege Price for on-call commit.")
        
        if not feedback:
            feedback.append("✅ Excellent call! All pillars of the framework were successfully covered.")
        return feedback

    def generate_coaching_report(self, agent_name: str, transcript: str) -> str:
        analysis = self.analyze_transcript(transcript)
        
        report = (
            f"==================================================\n"
            f"     SALES COACHING REPORT FOR: {agent_name.upper()}\n"
            f"==================================================\n"
            f"📊 Overall Compliance Score: {analysis['overall_score']}%\n\n"
            f"Pillar Scores:\n"
            f" - Pillar 1 (Rapport): {analysis['category_scores']['rapport']}%\n"
            f" - Pillar 2 (Diagnosis): {analysis['category_scores']['diagnosis']}%\n"
            f" - Pillar 3 (Automation System): {analysis['category_scores']['automation']}%\n"
            f" - Pillar 4 (Responsibilities): {analysis['category_scores']['responsibilities']}%\n"
            f" - Pricing & Closing: {analysis['category_scores']['pricing_closing']}%\n\n"
            f"📋 Feedback & Action Items:\n"
        )
        for fb in analysis['feedback']:
            report += f" {fb}\n"
        
        report += "=================================================="
        return report

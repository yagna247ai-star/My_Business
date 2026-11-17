"""
Hermes Agent Skill: EMI Calculator & Plot Inventory Matching Engine
Calculates down payment, monthly EMI for 12, 24, 36, 48, and 60 month tenures.
"""

from typing import Dict, Any, List

class EMIPlotMatcherSkill:
    def calculate_emi(self, total_plot_price: float, down_payment_pct: float, tenure_months: int, annual_interest_rate: float = 10.5) -> Dict[str, float]:
        """
        Standard Reducing Balance EMI Calculation.
        Formula: E = P * r * (1+r)^n / ((1+r)^n - 1)
        """
        down_payment = total_plot_price * (down_payment_pct / 100.0)
        principal = total_plot_price - down_payment
        
        monthly_rate = (annual_interest_rate / 100.0) / 12.0
        
        if monthly_rate == 0:
            emi = principal / tenure_months
        else:
            nominator = monthly_rate * ((1 + monthly_rate) ** tenure_months)
            denominator = ((1 + monthly_rate) ** tenure_months) - 1
            emi = principal * (nominator / denominator)
            
        total_payment = down_payment + (emi * tenure_months)
        total_interest = total_payment - total_plot_price
        
        return {
            "total_plot_price": round(total_plot_price, 2),
            "down_payment_pct": down_payment_pct,
            "down_payment_amount": round(down_payment, 2),
            "loan_amount": round(principal, 2),
            "tenure_months": tenure_months,
            "annual_interest_rate": annual_interest_rate,
            "monthly_emi": round(emi, 2),
            "total_interest_payable": round(total_interest, 2),
            "total_cost": round(total_payment, 2)
        }

    def format_emi_summary_message(self, lead_name: str, plot_size_sqyd: int, sqyd_rate: float, down_payment_pct: float = 20.0) -> str:
        total_price = plot_size_sqyd * sqyd_rate
        emi_24 = self.calculate_emi(total_price, down_payment_pct, 24)
        emi_36 = self.calculate_emi(total_price, down_payment_pct, 36)
        emi_60 = self.calculate_emi(total_price, down_payment_pct, 60)
        
        return (
            f"📊 **Custom EMI Breakdown for {lead_name}**\n\n"
            f"📐 **Plot Details:** {plot_size_sqyd} sq. yds @ ₹{sqyd_rate:,.0f}/sq.yd\n"
            f"💵 **Total Plot Price:** ₹{total_price:,.0f}\n"
            f"💰 **Down Payment ({down_payment_pct:.0f}%):** ₹{emi_24['down_payment_amount']:,.0f}\n\n"
            f"🗓️ **Monthly EMI Options:**\n"
            f"• 24 Months tenure: **₹{emi_24['monthly_emi']:,.0f} / month**\n"
            f"• 36 Months tenure: **₹{emi_36['monthly_emi']:,.0f} / month**\n"
            f"• 60 Months tenure: **₹{emi_60['monthly_emi']:,.0f} / month**\n\n"
            f"🏦 **Bank Loan Financing:** Up to 75–80% LTV available for DTCP/HMDA approved layouts.\n"
            f"Would you like us to check your bank loan pre-approval eligibility?"
        )


if __name__ == "__main__":
    matcher = EMIPlotMatcherSkill()
    print(matcher.format_emi_summary_message("Venkat", 150, 8500, 20))

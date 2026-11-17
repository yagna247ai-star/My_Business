from typing import List, Optional
from pydantic import BaseModel, Field
from enum import Enum

class LeadSource(str, Enum):
    FACEBOOK_META = "Facebook Meta Lead Gen"
    WEBSITE_FORM = "Website Audit Form"
    WHATSAPP_INBOUND = "WhatsApp Inbound"
    REFERRAL = "Referral Partner"
    DIRECT_OUTBOUND = "Direct Outbound Upload"

class SolarExperience(str, Enum):
    YES = "YES"
    NO = "NO"
    INDIRECT = "INDIRECT"

class CustomerAcquisitionChannel(str, Enum):
    REFERRALS = "Referrals"
    WALK_INS = "Walk-in Store Customers"
    DIGITAL_ADS = "Digital Ads"
    LOCAL_NETWORKING = "Local Networking"

class CommitmentLevel(str, Enum):
    FULL_TIME = "Full-Time Commitment"
    SERIOUS_PART_TIME = "Serious Part-Time"
    EXPLORATORY = "Exploratory"

class InvestmentBand(str, Enum):
    UNDER_1_LAKH = "UNDER_1_LAKH"
    ONE_TO_TWO_LAKH = "1_TO_2_LAKH"
    TWO_TO_FIVE_LAKH = "2_TO_5_LAKH"
    ABOVE_FIVE_LAKH = "ABOVE_5_LAKH"

class LeadTemperature(str, Enum):
    HOT = "HOT"
    WARM = "WARM"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class CallOutcome(str, Enum):
    BOOKED = "BOOKED"
    CALLBACK = "CALLBACK"
    NOT_NOW = "NOT_NOW"
    DNC = "DNC"
    WRONG_NUMBER = "WRONG_NUMBER"

# 1. Identity & Context
class IdentityContext(BaseModel):
    voice_campaign_id: str = "CAMPAIGN_WAVES_SOLAR_001"
    lead_source: LeadSource = LeadSource.FACEBOOK_META
    referrer: Optional[str] = None
    location: str = "Andhra Pradesh / Telangana"
    current_business: str = "Electrical & Hardware Store"

# 2. Qualification
class QualificationDetails(BaseModel):
    solar_experience: SolarExperience = SolarExperience.YES
    customer_type: List[str] = Field(default_factory=lambda: ["Homeowners", "Electrical Customers"])
    customer_acquisition_channel: CustomerAcquisitionChannel = CustomerAcquisitionChannel.REFERRALS
    local_network: str = "Strong Local Electrical Network"
    business_capability: str = "High Retail Footfall & Installation Crew"
    commitment_level: CommitmentLevel = CommitmentLevel.SERIOUS_PART_TIME
    investment_band: InvestmentBand = InvestmentBand.TWO_TO_FIVE_LAKH
    start_timeline: str = "WITHIN_30_DAYS"
    why_now: str = "High retail customer demand for rooftop solar & battery backup"
    market_perception: str = "Positive local reputation in electrical hardware"

# 3. AI Assessment & Scoring
class AIAssessment(BaseModel):
    motivation_score: int = Field(ge=0, le=3, default=3)
    business_fit_score: int = Field(ge=0, le=3, default=3)
    commitment_score: int = Field(ge=0, le=3, default=3)
    capital_readiness_score: int = Field(ge=0, le=3, default=3)
    local_network_score: int = Field(ge=0, le=3, default=3)
    total_voice_lead_score: int = Field(ge=0, le=15, default=15)
    lead_temperature: LeadTemperature = LeadTemperature.HOT
    main_objection: str = "NONE"

# 4. Call Control
class CallControl(BaseModel):
    voice_call_status: str = "COMPLETED"
    last_voice_call_at: str = "NOW"
    callback_datetime: Optional[str] = None
    call_outcome: CallOutcome = CallOutcome.BOOKED
    dnc: bool = False
    booking_status: str = "CONFIRMED"
    booking_datetime: Optional[str] = "2026-09-08 10:00 AM IST"

# 5. Human Handoff
class HumanHandoff(BaseModel):
    ai_call_summary: str = "High-intent solar dealer candidate with established electrical retail store and $3K–$6K investment capability."
    recommended_closer_angle: str = "Focus on dealer margins, fast inventory dispatch, and marketing co-op support."

# Complete CRM Record Payload
class FullCRMContactRecord(BaseModel):
    myappz_contact_id: str
    myappz_opportunity_id: Optional[str] = None
    phone: str
    name: str
    identity: IdentityContext = Field(default_factory=IdentityContext)
    qualification: QualificationDetails = Field(default_factory=QualificationDetails)
    ai_assessment: AIAssessment = Field(default_factory=AIAssessment)
    call_control: CallControl = Field(default_factory=CallControl)
    human_handoff: HumanHandoff = Field(default_factory=HumanHandoff)

import os
import sys
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether, PageBreak, HRFlowable
)
from reportlab.pdfgen import canvas

# Define color palette (Professional Corporate Solar Theme)
NAVY = HexColor("#0A192F")
DEEP_BLUE = HexColor("#1E3A8A")
SOLAR_GOLD = HexColor("#D97706")
AMBER_LIGHT = HexColor("#FEF3C7")
DARK_SLATE = HexColor("#1F2937")
LIGHT_BG = HexColor("#F8FAFC")
BORDER_COLOR = HexColor("#E2E8F0")
TEXT_MUTED = HexColor("#475569")
ACCENT_BLUE = HexColor("#2563EB")
GREEN_ACCENT = HexColor("#059669")

CHARTS_DIR = "/Users/apple/Documents/My_Business/pdf_charts"
os.makedirs(CHARTS_DIR, exist_ok=True)

def generate_charts():
    # -------------------------------------------------------------
    # Chart 1: 30-Year Module Price & Swanson's Law (1996 - 2026)
    # -------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(7, 3.2), dpi=300)
    years = np.array([1996, 2000, 2005, 2010, 2014, 2018, 2021, 2024, 2026])
    prices = np.array([4.80, 3.50, 2.70, 1.40, 0.65, 0.28, 0.20, 0.12, 0.10])
    
    ax.plot(years, prices, color='#D97706', linewidth=2.5, marker='o', markersize=6, label='Global Module Price ($/Wp)')
    ax.set_yscale('log')
    ax.set_title("30-Year Solar Module Price Learning Curve (Swanson's Law: 1996-2026)", fontsize=11, fontweight='bold', pad=10, color='#0A192F')
    ax.set_xlabel("Year", fontsize=9, fontweight='bold', color='#1F2937')
    ax.set_ylabel("Price ($/Wp) - Log Scale", fontsize=9, fontweight='bold', color='#1F2937')
    ax.grid(True, which="both", ls="--", linewidth=0.5, alpha=0.7)
    
    for i, txt in enumerate(prices):
        ax.annotate(f"${txt:.2f}", (years[i], prices[i]), textcoords="offset points", xytext=(0,8), ha='center', fontsize=7.5, fontweight='bold', color='#1E3A8A')
        
    ax.set_ylim(0.05, 10.0)
    fig.tight_layout()
    chart1_path = os.path.join(CHARTS_DIR, "chart1_swanson.png")
    fig.savefig(chart1_path)
    plt.close(fig)

    # -------------------------------------------------------------
    # Chart 2: Silicon & Tandem Cell Efficiency Roadmap
    # -------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(7, 3.2), dpi=300)
    techs = ['Al-BSF\n(1996)', 'PERC\n(2016)', 'TOPCon\n(2023)', 'HJT\n(2025)', 'Perovskite-Si\nTandem (2026+)']
    eff_lab = [14.5, 21.8, 24.5, 25.4, 30.5]
    eff_comm = [12.0, 19.5, 22.5, 23.2, 27.0]
    
    x = np.arange(len(techs))
    width = 0.35
    
    rects1 = ax.bar(x - width/2, eff_lab, width, label='Lab Record Efficiency (%)', color='#1E3A8A')
    rects2 = ax.bar(x + width/2, eff_comm, width, label='Commercial Module Efficiency (%)', color='#D97706')
    
    ax.set_title("Evolution of Commercial & Lab PV Cell Efficiencies", fontsize=11, fontweight='bold', pad=10, color='#0A192F')
    ax.set_ylabel("Efficiency (%)", fontsize=9, fontweight='bold', color='#1F2937')
    ax.set_xticks(x)
    ax.set_xticklabels(techs, fontsize=8.5, fontweight='bold')
    ax.legend(fontsize=8, loc='upper left')
    ax.set_ylim(0, 36)
    ax.grid(axis='y', ls="--", linewidth=0.5, alpha=0.7)
    
    def autolabel(rects):
        for rect in rects:
            height = rect.get_height()
            ax.annotate(f'{height}%', xy=(rect.get_x() + rect.get_width() / 2, height),
                        xytext=(0, 3), textcoords="offset points", ha='center', va='bottom', fontsize=7.5, fontweight='bold')

    autolabel(rects1)
    autolabel(rects2)
    fig.tight_layout()
    chart2_path = os.path.join(CHARTS_DIR, "chart2_efficiency.png")
    fig.savefig(chart2_path)
    plt.close(fig)

    # -------------------------------------------------------------
    # Chart 3: AP/TS Daily Duck Curve & BESS Integration
    # -------------------------------------------------------------
    fig, ax = plt.subplots(figsize=(7, 3.2), dpi=300)
    hours = np.arange(0, 24)
    demand = np.array([65, 60, 58, 57, 60, 70, 80, 85, 88, 85, 82, 80, 78, 77, 79, 83, 90, 100, 98, 92, 85, 78, 72, 68])
    solar_gen = np.array([0, 0, 0, 0, 0, 5, 20, 45, 65, 80, 88, 90, 88, 80, 65, 40, 15, 0, 0, 0, 0, 0, 0, 0])
    net_load = demand - solar_gen
    bess_discharge = np.array([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0, 15, 25, 20, 10, 0, 0, 0, 0])
    
    ax.plot(hours, demand, color='#1F2937', linewidth=2, linestyle='--', label='Gross System Demand')
    ax.plot(hours, net_load, color='#D97706', linewidth=2.5, label='Net Load (Duck Curve Belly)')
    ax.fill_between(hours, net_load, demand, color='#FEF3C7', alpha=0.5, label='Midday Solar Oversupply')
    ax.plot(hours, net_load - bess_discharge, color='#059669', linewidth=2, label='Net Load after BESS Discharge')
    
    ax.set_title("Telangana / AP Power Grid: Duck Curve & BESS Peak Shaving", fontsize=11, fontweight='bold', pad=10, color='#0A192F')
    ax.set_xlabel("Hour of Day", fontsize=9, fontweight='bold', color='#1F2937')
    ax.set_ylabel("Normalized Load (MW / Scale)", fontsize=9, fontweight='bold', color='#1F2937')
    ax.set_xticks(np.arange(0, 25, 3))
    ax.legend(fontsize=7.5, loc='upper left')
    ax.grid(True, ls="--", linewidth=0.5, alpha=0.7)
    fig.tight_layout()
    chart3_path = os.path.join(CHARTS_DIR, "chart3_duck_curve.png")
    fig.savefig(chart3_path)
    plt.close(fig)

    return chart1_path, chart2_path, chart3_path

# Custom Canvas for Header, Footer & Dynamic Page Numbers
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            return  # Suppress headers/footers on cover page
            
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(DARK_SLATE)
        
        # Header
        self.drawString(54, 11 * inch - 36, "SOLAR PV & RENEWABLE ENERGY MASTERCLASS (30-YEAR EXPERT GUIDE)")
        self.setStrokeColor(BORDER_COLOR)
        self.setLineWidth(0.5)
        self.line(54, 11 * inch - 42, 8.5 * inch - 54, 11 * inch - 42)
        
        # Footer
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(8.5 * inch - 54, 36, page_str)
        self.drawString(54, 36, "CONFIDENTIAL & PROPRIETARY — PREPARED FOR AP & TS SOLAR ECOSYSTEM")
        self.line(54, 48, 8.5 * inch - 54, 48)
        
        self.restoreState()

def build_pdf(filename):
    chart1_path, chart2_path, chart3_path = generate_charts()
    
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Typography Styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=NAVY,
        alignment=0,
        spaceAfter=12
    )
    
    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=SOLAR_GOLD,
        alignment=0,
        spaceAfter=30
    )
    
    h1_style = ParagraphStyle(
        'Header1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=NAVY,
        spaceBefore=16,
        spaceAfter=10,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Header2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=DEEP_BLUE,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=DARK_SLATE,
        spaceAfter=8
    )

    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=DARK_SLATE,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )
    
    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=13,
        textColor=NAVY
    )
    
    formula_style = ParagraphStyle(
        'FormulaText',
        parent=styles['Normal'],
        fontName='Courier-Bold',
        fontSize=10,
        leading=14,
        textColor=DEEP_BLUE,
        alignment=1,
        spaceBefore=6,
        spaceAfter=6
    )

    story = []
    
    # -------------------------------------------------------------
    # COVER PAGE
    # -------------------------------------------------------------
    story.append(Spacer(1, 40))
    story.append(Paragraph("SOLAR PHOTOVOLTAIC & RENEWABLE ENERGY MASTERCLASS", title_style))
    story.append(Paragraph("A 30-Year Industry Veteran's Guide to Technology Evolution, Module Physics, Financial Engineering, AP/TS Market Dynamics, Quality Operations & B2B Growth Strategy", subtitle_style))
    
    story.append(HRFlowable(width="100%", thickness=3, color=SOLAR_GOLD, spaceBefore=0, spaceAfter=20))
    
    meta_table_data = [
        [Paragraph("<b>Author / Perspective:</b>", body_style), Paragraph("30-Year Solar Industry Expert & Technical Advisory", body_style)],
        [Paragraph("<b>Target Audience:</b>", body_style), Paragraph("Solar EPC Founders, Operations Heads, Procurement Teams & Consultants in AP & TS", body_style)],
        [Paragraph("<b>Geographic Focus:</b>", body_style), Paragraph("Andhra Pradesh (APEPDCL, APSPDCL, APCPDCL) & Telangana (TSSPDCL, TSNPDCL)", body_style)],
        [Paragraph("<b>Core Topics:</b>", body_style), Paragraph("Physics, Silicon Wafers, Inverters, Grid Integration, Procurement, Quality QA/QC, Sales SLA & Pitching", body_style)],
        [Paragraph("<b>Publication Date:</b>", body_style), Paragraph("August 2026 (Updated for PM Surya Ghar, ALMM & N-Type TOPCon/HJT Era)", body_style)]
    ]
    t_meta = Table(meta_table_data, colWidths=[1.8*inch, 5.0*inch])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), LIGHT_BG),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_meta)
    
    story.append(Spacer(1, 30))
    
    # Executive Summary Box
    exec_summary_html = "<b>30-Year Executive Note:</b> In 1996, solar PV was an exotic, off-grid technology costing over <b>$5.00 per Watt peak ($/Wp)</b>, reserved for telecom towers, satellites, and rural electrification. Today in 2026, module costs have collapsed to <b>$0.10–$0.12/Wp</b>, making solar the absolute cheapest source of bulk electricity in human history. However, rapid technology shifts—from Al-BSF to PERC and now to N-Type TOPCon/HJT—along with grid congestion, DISCOM net metering constraints, and aggressive customer acquisition challenges mean that technical mastery, rigorous QA/QC, and tight 5-minute sales operations are no longer optional. This document is a complete technical and commercial blueprint."
    
    t_exec = Table([[Paragraph(exec_summary_html, callout_style)]], colWidths=[6.8*inch])
    t_exec.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), AMBER_LIGHT),
        ('BOX', (0,0), (-1,-1), 1, SOLAR_GOLD),
        ('PADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(t_exec)
    
    story.append(PageBreak())

    # -------------------------------------------------------------
    # MODULE 1: 30-YEAR HISTORICAL EVOLUTION & SWANSON'S LAW
    # -------------------------------------------------------------
    story.append(Paragraph("Module 1: The 30-Year Solar Transformation & Swanson's Law", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=NAVY, spaceBefore=2, spaceAfter=10))
    
    story.append(Paragraph("Over the past three decades (1996–2026), the solar photovoltaic industry underwent a structural economic revolution governed by <b>Swanson's Law</b>—the empirical observation that for every doubling of cumulative module production, module prices fall by approximately <b>24%</b>.", body_style))
    
    story.append(Paragraph("<b>Key Milestones in the 30-Year Trajectory:</b>", body_style))
    story.append(Paragraph("• <b>1996–2004 (Off-Grid & Early Subsidies):</b> Multicrystalline Si modules with 11-13% efficiency. High silicon consumption (>10g/W). Germany's Stromeinspeisungsgesetz & EEG (2000) created early demand.", bullet_style))
    story.append(Paragraph("• <b>2005–2012 (The Silicon Shortage & German/European Boom):</b> Polysilicon prices spiked to $400/kg. Transition to slurry wire sawing. China initiated massive state-backed manufacturing expansion.", bullet_style))
    story.append(Paragraph("• <b>2013–2019 (The PERC Era & Grid Parity):</b> Passivated Emitter and Rear Cell (PERC) displaced Al-BSF, boosting cell efficiency from 18% to 22%. Diamond wire sawing slashed wafer kerf losses.", bullet_style))
    story.append(Paragraph("• <b>2020–2026 (N-Type Revolution & Scale):</b> Transition to N-Type TOPCon and HJT cells with 24.5%+ efficiency, 210mm/182mm wafers, bifacial modules, and module pricing reaching historic lows of $0.10/W.", bullet_style))
    
    story.append(Spacer(1, 6))
    story.append(Image(chart1_path, width=6.8*inch, height=3.1*inch))
    story.append(Spacer(1, 10))

    # -------------------------------------------------------------
    # MODULE 2: CELL PHYSICS, WAFER SCALING & MODULE ARCHITECTURE
    # -------------------------------------------------------------
    story.append(Paragraph("Module 2: PV Cell Physics, Wafer Engineering & Module Physics", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=NAVY, spaceBefore=2, spaceAfter=10))
    
    story.append(Paragraph("Understanding cell physics is fundamental for evaluating module lifetime degradation, temperature coefficients, and bifaciality gains. The industry has migrated from P-type silicon to N-type substrates due to zero Light-Induced Degradation (LID).", body_style))
    
    # Comparison Table of Technologies
    cell_table_data = [
        [Paragraph("<b>Cell Architecture</b>", body_style), Paragraph("<b>Substrate</b>", body_style), Paragraph("<b>Commercial Eff.</b>", body_style), Paragraph("<b>Bifaciality</b>", body_style), Paragraph("<b>Temp Coeff (Pmax)</b>", body_style), Paragraph("<b>Key Advantage / Risk</b>", body_style)],
        [Paragraph("<b>Al-BSF</b>", body_style), Paragraph("P-Type", body_style), Paragraph("18.5 - 19.5%", body_style), Paragraph("0% (Monofacial)", body_style), Paragraph("-0.40% / °C", body_style), Paragraph("Legacy tech; high LID & thermal loss", body_style)],
        [Paragraph("<b>PERC</b>", body_style), Paragraph("P-Type", body_style), Paragraph("21.5 - 22.3%", body_style), Paragraph("65 - 70%", body_style), Paragraph("-0.35% / °C", body_style), Paragraph("Standard 2018-2023; prone to LeTID", body_style)],
        [Paragraph("<b>TOPCon</b>", body_style), Paragraph("N-Type", body_style), Paragraph("22.5 - 23.5%", body_style), Paragraph("80 - 85%", body_style), Paragraph("-0.30% / °C", body_style), Paragraph("<b>Current Market Leader</b>; Zero LID", body_style)],
        [Paragraph("<b>HJT (Heterojunction)</b>", body_style), Paragraph("N-Type", body_style), Paragraph("23.0 - 24.2%", body_style), Paragraph("85 - 92%", body_style), Paragraph("-0.26% / °C", body_style), Paragraph("Superior in hot climates; higher CAPEX", body_style)],
        [Paragraph("<b>Perovskite-Si Tandem</b>", body_style), Paragraph("Tandem", body_style), Paragraph("26.5 - 28.5%+", body_style), Paragraph("75 - 80%", body_style), Paragraph("-0.25% / °C", body_style), Paragraph("Next-gen (2027+); damp-heat stability check", body_style)]
    ]
    
    t_cell = Table(cell_table_data, colWidths=[1.3*inch, 0.7*inch, 1.0*inch, 0.9*inch, 1.1*inch, 1.8*inch])
    t_cell.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), DEEP_BLUE),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_cell)
    
    story.append(Spacer(1, 10))
    story.append(Image(chart2_path, width=6.8*inch, height=3.1*inch))
    story.append(Spacer(1, 10))

    story.append(Paragraph("<b>Wafer Size Evolution & Form Factor Standardization:</b>", h2_style))
    story.append(Paragraph("Wafer dimensions scaled from M0 (156mm) to <b>M10 (182mm)</b> and <b>G12 (210mm)</b>. Larger wafers allow modules to exceed 580W–700W, drastically reducing Balance of System (BOS) costs like racking, cabling, and land area.", body_style))

    story.append(PageBreak())

    # -------------------------------------------------------------
    # MODULE 3: INVERTERS, BOS & ELECTRICAL ARCHITECTURE
    # -------------------------------------------------------------
    story.append(Paragraph("Module 3: Inverter Topologies, MPPT & Electrical Balance of System", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=NAVY, spaceBefore=2, spaceAfter=10))
    
    story.append(Paragraph("The inverter is the intelligent brain of the solar PV system. The industry has shifted heavily from centralized inverters to multi-MPPT decentralized string inverters, while residential installations increasingly adopt microinverters or hybrid storage inverters.", body_style))
    
    story.append(Paragraph("<b>1. Inverter Architecture Trade-offs:</b>", h2_style))
    story.append(Paragraph("• <b>String Inverters (10kW to 350kW):</b> Dominant in C&I and utility projects. Multiple independent Maximum Power Point Trackers (MPPTs) mitigate shading mismatch across orientation angles.", bullet_style))
    story.append(Paragraph("• <b>Microinverters & DC Optimizers:</b> Essential for complex residential roofs with multi-directional pitches or heavy shading. Module-level MPPT eliminates single-panel bottlenecking and provides rapid shutdown safety (NEC 690.12 compliant).", bullet_style))
    story.append(Paragraph("• <b>Hybrid Bidirectional Storage Inverters:</b> Integrates PV input and battery interface (DC-coupled or AC-coupled) with grid-forming capability during power outages.", bullet_style))

    story.append(Paragraph("<b>2. String Sizing & Temperature Coefficient Calculations:</b>", h2_style))
    story.append(Paragraph("When designing string lengths, engineers must calculate the maximum open-circuit voltage ($V_{oc,max}$) at the absolute minimum local ambient temperature to prevent blowing inverter DC capacitors:", body_style))
    
    story.append(Paragraph("V<sub>oc,max</sub> = V<sub>oc,STC</sub> × [ 1 + β<sub>Voc</sub> × (T<sub>min</sub> - 25°C) ]", formula_style))
    
    story.append(Paragraph("<i>Example calculation for AP/TS climate (T<sub>min</sub> = 10°C, V<sub>oc,STC</sub> = 50V, β<sub>Voc</sub> = -0.26%/°C):</i><br/>"
                           "V<sub>oc,max</sub> = 50V × [ 1 + (-0.0026) × (10 - 25) ] = 50V × 1.039 = <b>51.95V per module</b>.<br/>"
                           "For a 1100V max string inverter, maximum module string length = 1100 / 51.95 = <b>21 modules max</b>.", body_style))

    story.append(Spacer(1, 10))

    # -------------------------------------------------------------
    # MODULE 4: GLOBAL & REGIONAL SUPPLY CHAIN & MANUFACTURING
    # -------------------------------------------------------------
    story.append(Paragraph("Module 4: Global Supply Chain Dynamics & Trade Policies", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=NAVY, spaceBefore=2, spaceAfter=10))
    
    story.append(Paragraph("The solar PV supply chain consists of four sequential manufacturing stages: <b>Polysilicon → Ingots/Wafers → Cells → Modules</b>. Historically, China established over 80–95% market share across these stages.", body_style))
    
    story.append(Paragraph("<b>Geopolitical Re-shoring & Policy Mandates:</b>", h2_style))
    story.append(Paragraph("• <b>India (ALMM & PLI Scheme):</b> The Approved List of Models and Manufacturers (ALMM) restricts government-subsidized or open-access projects to domestically certified modules. The Production Linked Incentive (PLI) scheme accelerates gigawatt-scale domestic ingot-to-module manufacturing.", bullet_style))
    story.append(Paragraph("• <b>Basic Customs Duty (BCD):</b> 40% BCD on imported modules and 25% on imported cells in India protects domestic manufacturers (Waaree, Adani, Premier Energies, Tata Power, Goldi).", bullet_style))
    story.append(Paragraph("• <b>United States (IRA 45X):</b> The Inflation Reduction Act provides tax credits for domestic US wafer, cell, and module production.", bullet_style))

    story.append(PageBreak())

    # -------------------------------------------------------------
    # MODULE 5: ANDHRA PRADESH & TELANGANA (AP/TS) MARKET DEEP DIVE
    # -------------------------------------------------------------
    story.append(Paragraph("Module 5: Andhra Pradesh & Telangana Market Deep-Dive", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=NAVY, spaceBefore=2, spaceAfter=10))
    
    story.append(Paragraph("Andhra Pradesh and Telangana are two of India's most lucrative solar markets due to high solar irradiance (5.5–6.0 kWh/m²/day), rapid industrialization, and strong state support.", body_style))
    
    story.append(Paragraph("<b>1. DISCOM Landscape & Policy Architecture:</b>", h2_style))
    
    discom_data = [
        [Paragraph("<b>State</b>", body_style), Paragraph("<b>DISCOM Entities</b>", body_style), Paragraph("<b>Net Metering Cap / Rules</b>", body_style), Paragraph("<b>Key Industrial / Urban Hubs</b>", body_style)],
        [Paragraph("<b>Telangana</b>", body_style), Paragraph("<b>TSSPDCL</b> (Southern)<br/><b>TSNPDCL</b> (Northern)", body_style), Paragraph("1kW to 1MW; 100% of sanctioned load cap; DT capacity cap 80%; Net settlement annual.", body_style), Paragraph("Hyderabad, Medchal, Patancheru, Cherlapally, Karimnagar, Warangal", body_style)],
        [Paragraph("<b>Andhra Pradesh</b>", body_style), Paragraph("<b>APEPDCL</b> (Eastern)<br/><b>APSPDCL</b> (Southern)<br/><b>APCPDCL</b> (Central)", body_style), Paragraph("1kW to 1MW; Net metering for residential; Gross / Feed-in for commercial; Group Captive Open Access.", body_style), Paragraph("Visakhapatnam, Vijayawada, Guntur, Tirupati, Sri City, Nellore", body_style)]
    ]
    t_discom = Table(discom_data, colWidths=[1.0*inch, 1.8*inch, 2.2*inch, 1.8*inch])
    t_discom.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), DEEP_BLUE),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_discom)
    
    story.append(Spacer(1, 10))
    story.append(Paragraph("<b>2. PM Surya Ghar Muft Bijli Yojana (Residential Benchmark):</b>", h2_style))
    story.append(Paragraph("Under national subsidy guidelines, residential rooftop adopters in AP & TS receive direct central financial assistance (CFA):", body_style))
    story.append(Paragraph("• <b>1 kW System:</b> ₹30,000 subsidy (Approx. benchmark cost ₹60,000 → Net consumer cost ~₹30,000).", bullet_style))
    story.append(Paragraph("• <b>2 kW System:</b> ₹60,000 subsidy (Approx. benchmark cost ₹1,10,000 → Net consumer cost ~₹50,000).", bullet_style))
    story.append(Paragraph("• <b>3 kW to 10 kW System:</b> ₹78,000 max subsidy (Cap reached at 3 kW). Provides ~360–400 free units/month.", bullet_style))

    story.append(Spacer(1, 6))
    story.append(Image(chart3_path, width=6.8*inch, height=3.1*inch))
    story.append(Spacer(1, 10))

    # -------------------------------------------------------------
    # MODULE 6: B2B PITCHING & BUSINESS CONSULTING FOR INSTALLERS
    # -------------------------------------------------------------
    story.append(Paragraph("Module 6: Sales Operations, Lead SLA & B2B Installer Consulting", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=NAVY, spaceBefore=2, spaceAfter=10))
    
    story.append(Paragraph("The solar installer market in AP & TS is highly fragmented. Installers fail not due to poor engineering, but due to <b>slow lead response times</b> (averaging 14–24 hours) and weak lead qualification.", body_style))
    
    story.append(Paragraph("<b>1. The 5-Minute Lead SLA & 13+ Year Lead Scoring Model:</b>", h2_style))
    story.append(Paragraph("Leads converted within 5 minutes of enquiry have a <b>9x higher site survey booking rate</b> than leads contacted after 30 minutes. Lead qualification scores (0–100) prioritize high-ticket C&I and ready residential buyers:", body_style))

    score_table_data = [
        [Paragraph("<b>Scoring Dimension</b>", body_style), Paragraph("<b>Criteria & Points Breakdown</b>", body_style), Paragraph("<b>Action Trigger</b>", body_style)],
        [Paragraph("<b>Business Tenure</b>", body_style), Paragraph("> 1 Year (25 pts) | 6-12 Months (18 pts) | < 6 Months (10 pts)", body_style), Paragraph("Score ≥ 75: <b>HOT LEAD</b>", body_style)],
        [Paragraph("<b>Monthly Electricity Bill</b>", body_style), Paragraph("> ₹15,000/mo (25 pts) | ₹5,000 - ₹15,000 (18 pts) | < ₹5,000 (10 pts)", body_style), Paragraph("Immediate Human Owner Call", body_style)],
        [Paragraph("<b>Property Ownership</b>", body_style), Paragraph("Self-owned RCC Roof (15 pts) | Commercial Shed (15 pts) | Rented (0 pts)", body_style), Paragraph("SLA target: ≤ 5 minutes", body_style)],
        [Paragraph("<b>Digital Readiness</b>", body_style), Paragraph("Custom Business Email / GST (15 pts) | Standard Consumer Gmail (8 pts)", body_style), Paragraph("Telugu + English Script", body_style)],
        [Paragraph("<b>Recency & Intent</b>", body_style), Paragraph("Immediate form submit (20 pts) | Past 7 days (10 pts)", body_style), Paragraph("Book Survey within 48h", body_style)]
    ]
    t_score = Table(score_table_data, colWidths=[1.8*inch, 3.2*inch, 1.8*inch])
    t_score.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), DEEP_BLUE),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_score)
    
    story.append(Spacer(1, 10))
    story.append(Paragraph("<b>2. High-Converting Pitch Scripts (Telugu & English):</b>", h2_style))
    
    pitch_script_html = (
        "<b>Telugu Call Pitch Script (High-Intent Consumer / C&I):</b><br/>"
        "<i>'Namaskaram [Name] garu, nenu [Company] nundi matladuthunnanu. Meeru online lo solar rooftop enquiry chesaru kada. "
        "Mee intiki/factory ki monthly current bill entha osthundi? PM Surya Ghar padhakam dwara meeku ₹78,000 varaku direct government subsidy osthundi. "
        "Mee roof structure and net-metering eligibility check cheyadaniki ma senior solar engineer ee roju evening 4 PM ki ravacha?'</i><br/><br/>"
        "<b>B2B Pitch to Solar Installer Business Owner:</b><br/>"
        "<i>'Most installers lose 40% of Meta/Google ad leads because they call back after 4 hours. We plug a 5-minute automated Telugu response system into your WhatsApp Business API that instantly qualifies leads, checks roof ownership and bill size, and books verified site surveys directly into your team's calendar.'</i>"
    )
    t_pitch = Table([[Paragraph(pitch_script_html, callout_style)]], colWidths=[6.8*inch])
    t_pitch.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), LIGHT_BG),
        ('BOX', (0,0), (-1,-1), 1, ACCENT_BLUE),
        ('PADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t_pitch)

    story.append(PageBreak())

    # -------------------------------------------------------------
    # MODULE 7: PANEL PROCUREMENT & STEP-BY-STEP QA/QC PROTOCOL
    # -------------------------------------------------------------
    story.append(Paragraph("Module 7: Panel Procurement & Step-by-Step Quality Assurance (QA/QC)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=NAVY, spaceBefore=2, spaceAfter=10))
    
    story.append(Paragraph("How to procure Tier-1 solar modules for residential and C&I installations, and how to rigorously test quality step-by-step to guarantee a 25–30 year operational lifespan.", body_style))
    
    story.append(Paragraph("<b>1. Module Procurement & Sourcing Strategy:</b>", h2_style))
    story.append(Paragraph("• <b>ALMM Certification Check:</b> Ensure modules are listed in the latest Ministry of New and Renewable Energy (MNRE) ALMM mandate. Key domestic Tier-1 brands in India: <b>Waaree Energies, Adani Solar, Premier Energies, Tata Power Solar, Goldi Solar, Rayzon Solar, Vikram Solar</b>.", bullet_style))
    story.append(Paragraph("• <b>Cell Batch Traceability:</b> Verify that module manufacturer uses A-Grade cells (zero micro-cracks before encapsulation). Inspect barcodes embedded under glass to trace flash-test factory origin.", bullet_style))
    story.append(Paragraph("• <b>Distributor Margin Structures:</b> Direct factory procurement requires minimum order quantities (MOQ 1 Container = ~600 kW). For smaller installers, procure through authorized regional distributors at ₹0.50–₹1.00/W margin.", bullet_style))

    story.append(Paragraph("<b>2. Step-by-Step Quality Measurement Protocol:</b>", h2_style))

    qa_steps_data = [
        [Paragraph("<b>Quality Test Protocol</b>", body_style), Paragraph("<b>Instrument / Tool</b>", body_style), Paragraph("<b>Acceptable Pass Benchmark</b>", body_style), Paragraph("<b>Failure Risk / Consequence</b>", body_style)],
        [Paragraph("<b>1. Factory Flash Test Verification</b>", body_style), Paragraph("Sun Simulator (STC)", body_style), Paragraph("Pmax ≥ Nameplate; Fill Factor (FF) > 78%; Voc mismatch < 0.5%", body_style), Paragraph("Power output deficit; fake wattage labeling", body_style)],
        [Paragraph("<b>2. Electroluminescence (EL) Test</b>", body_style), Paragraph("EL Camera (Infrared)", body_style), Paragraph("Zero micro-cracks, zero dead cell finger ribbons, zero soldering breaks", body_style), Paragraph("Micro-cracks expand into hot spots & burnt cells", body_style)],
        [Paragraph("<b>3. Thermal Thermography</b>", body_style), Paragraph("FLIR IR Thermal Camera / Drone", body_style), Paragraph("Delta T between cells < 5°C; zero localized overheating spots", body_style), Paragraph("Hot spot cell melting, junction box bypass diode failure", body_style)],
        [Paragraph("<b>4. Insulation Megger Test</b>", body_style), Paragraph("1000V DC Insulation Tester", body_style), Paragraph("Resistance > 100 MΩ between array DC positive/negative and ground", body_style), Paragraph("DC ground faults, inverter tripping, electric shock risk", body_style)],
        [Paragraph("<b>5. String Voc & Polarity Check</b>", body_style), Paragraph("Digital Multimeter (1000V DC)", body_style), Paragraph("Measured Voc equals sum of individual module Vocs ± 1%", body_style), Paragraph("Reversed polarity destroys inverter MPPT inputs", body_style)],
        [Paragraph("<b>6. Grounding Resistance Test</b>", body_style), Paragraph("Earth Tester (3-pole / 4-pole)", body_style), Paragraph("Earth pit resistance < 5.0 Ohms (Ideal < 2.0 Ohms)", body_style), Paragraph("Lightning strike destruction, surge protection failure", body_style)]
    ]
    t_qa = Table(qa_steps_data, colWidths=[1.6*inch, 1.5*inch, 2.1*inch, 1.6*inch])
    t_qa.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), DEEP_BLUE),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_qa)

    story.append(Spacer(1, 10))

    # -------------------------------------------------------------
    # MODULE 8: FINANCIAL ENGINEERING & LCOE MATHEMATICS
    # -------------------------------------------------------------
    story.append(Paragraph("Module 8: Financial Engineering, LCOE Mathematics & Business Models", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=NAVY, spaceBefore=2, spaceAfter=10))
    
    story.append(Paragraph("The standard metric for comparing lifetime electricity costs is the Levelized Cost of Energy (LCOE). The mathematical formula discounting lifetime expenses against lifetime generation:", body_style))
    
    story.append(Paragraph("LCOE = [ CAPEX + ∑ ( OPEX<sub>t</sub> / (1 + r)<sup>t</sup> ) ] / [ ∑ ( E<sub>t</sub> / (1 + r)<sup>t</sup> ) ]", formula_style))
    
    story.append(Paragraph("<b>Where:</b><br/>"
                           "• <b>CAPEX:</b> Total initial investment (Modules, Inverters, Structures, Civil, Land, Grid Interconnection).<br/>"
                           "• <b>OPEX<sub>t</sub>:</b> Operational expenses in year t (O&M, cleaning, land lease, inverter replacement in year 12, insurance).<br/>"
                           "• <b>E<sub>t</sub>:</b> Energy generated in year t = E<sub>year1</sub> × (1 - degradation)<sup>t-1</sup>.<br/>"
                           "• <b>r:</b> Discount rate / Weighted Average Cost of Capital (WACC).", body_style))

    story.append(Spacer(1, 10))

    # -------------------------------------------------------------
    # MODULE 9: THE NEXT HORIZON (2026–2035)
    # -------------------------------------------------------------
    story.append(Paragraph("Module 9: The Next Horizon (2026–2035)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=NAVY, spaceBefore=2, spaceAfter=10))
    
    story.append(Paragraph("• <b>Perovskite-Silicon Tandem Cells:</b> Breaking through the theoretical 29.4% silicon single-junction limit to achieve 30%–34% commercial module efficiencies by 2028.", bullet_style))
    story.append(Paragraph("• <b>Solar-to-Green Hydrogen Integration:</b> Utilizing low-cost solar electricity during midday duck curve hours for PEM/Alkaline electrolyzers to produce green hydrogen at <$2.00/kg.", bullet_style))
    story.append(Paragraph("• <b>AI & Robotics in O&M:</b> Automated waterless robotic cleaning in arid regions, autonomous thermal drone inspections, and AI-driven predictive tracker tuning.", bullet_style))
    story.append(Paragraph("• <b>PV Module Circular Economy & Recycling:</b> Recovering silver paste, high-purity silicon, aluminum frames, and glass from first-generation decommissioned panels.", bullet_style))
    
    story.append(Spacer(1, 20))
    story.append(HRFlowable(width="100%", thickness=2, color=SOLAR_GOLD, spaceBefore=10, spaceAfter=15))
    story.append(Paragraph("<b>END OF MASTERCLASS GUIDE — PREPARED BY 30-YEAR INDUSTRY VETERAN ADVISORY</b>", ParagraphStyle('EndNote', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, leading=14, textColor=NAVY, alignment=1)))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated publication-quality PDF at: {filename}")

if __name__ == '__main__':
    pdf_path = "/Users/apple/Documents/My_Business/Solar_Industry_Masterclass_30Yr_Expert_Guide.pdf"
    build_pdf(pdf_path)

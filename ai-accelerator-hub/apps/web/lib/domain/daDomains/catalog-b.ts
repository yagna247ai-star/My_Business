/** Domain catalogue, part B (8 domains). One flagship problem per domain, carried through all 40 days. */
import { type DomainSpec as FullSpec, key, str, int, num, date, cat, bool, optional } from './types';

type DomainSpec = Omit<FullSpec, 'enterprise'>;

export const DOMAINS_B: DomainSpec[] = [
  {
    slug: 'energy-utilities', code: 'ENU', name: 'Energy & Utilities', catalog: 'energy_grid', entity: 'consumer meter',
    problem: {
      title: 'Power Distribution Losses (AT&C) and Outages',
      statement: 'A state power distribution company loses a large share of the energy it buys through technical losses, theft and unbilled consumption, and consumers complain about frequent outages. Smart-meter readings, billing, feeder data, outage logs and field inspection reports are kept apart. Build an analytics view that pinpoints feeders and meters with abnormal losses and outages, so the utility can target inspections and maintenance.',
      stakeholders: ['Managing director (DISCOM)', 'Circle and division engineers', 'Revenue and vigilance teams', 'Customer care'],
      decisions: ['Which feeders and meters vigilance inspects this week', 'Where to replace faulty meters and transformers', 'Which areas get outage-reduction investment'],
      questions: ['Which feeders have the highest AT&C loss and how has it changed?', 'Which consumer meters show consumption patterns that suggest tampering?', 'How do outages (SAIFI, SAIDI) vary by feeder and season?'],
    },
    kpis: [
      { name: 'AT&C loss %', definition: '(Energy input − energy realised through collected bills) ÷ energy input × 100' },
      { name: 'Billing efficiency', definition: 'Energy billed ÷ energy input' },
      { name: 'Collection efficiency', definition: 'Amount collected ÷ amount billed' },
      { name: 'SAIFI', definition: 'Total customer interruptions ÷ total customers served' },
      { name: 'SAIDI', definition: 'Total customer interruption minutes ÷ total customers served' },
    ],
    sources: {
      structured: [
        { name: 'Billing system (consumer master and bills)', description: 'Consumers, tariff category, units billed, amount billed and paid' },
        { name: 'Feeder energy accounting', description: 'Energy input per feeder per month from substation meters' },
        { name: 'Outage management system', description: 'Interruptions with start, end and feeder' },
      ],
      semi: [{ name: 'Smart meter (AMI) readings', format: 'JSON Lines', description: '15-minute consumption, voltage and tamper events' }],
      unstructured: [{ name: 'Field inspection reports', description: 'Lineman and vigilance notes, meter photos' }],
    },
    dataset: {
      name: 'meter_month', minRows: 100,
      columns: [key('meter_reading_id', 'e.g. MTR0001'), str('consumer_ref', 'Masked consumer reference'), str('feeder_id'), cat('tariff_category', ['Domestic', 'Commercial', 'Industrial', 'Agricultural']),
        date('billing_month'), num('units_consumed_kwh', 0, 1000000), num('amount_billed', 0, 10000000), num('amount_paid', 0, 10000000), int('tamper_events', 0, 500), optional(int('outage_minutes', 0, 44640))],
    },
    gold: {
      name: 'gold_feeder_losses', minRows: 50,
      columns: [key('feeder_month_id'), str('feeder_id'), num('energy_input_mwh', 0, 100000), num('billing_efficiency', 0, 1), num('collection_efficiency', 0, 1.5), num('atc_loss_pct', -50, 100), num('saidi_minutes', 0, 44640), cat('action', ['Normal', 'Inspect', 'Urgent'])],
    },
    quality: ['Zero consumption for months from stuck meters', 'Readings jumping backwards after meter replacement', 'Consumers mapped to the wrong feeder after network changes', 'Outage end time missing for restored interruptions', 'Consumer names and phone numbers in inspection notes'],
    dashboard: {
      pages: [
        { name: 'Loss overview', visuals: ['AT&C loss % trend', 'Loss by division map', 'Billing vs collection efficiency'] },
        { name: 'Feeder drill-down', visuals: ['Feeders to inspect', 'Energy input vs billed by feeder', 'Tamper events by feeder'] },
        { name: 'Reliability', visuals: ['SAIFI and SAIDI by feeder', 'Outage minutes by month', 'Top outage causes'] },
      ],
      measures: [{ name: 'AT&C Loss %', dax: 'AVERAGE(gold_feeder_losses[atc_loss_pct])' }, { name: 'Feeders to Inspect', dax: 'CALCULATE(DISTINCTCOUNT(gold_feeder_losses[feeder_id]), gold_feeder_losses[action] <> "Normal")' }, { name: 'Avg SAIDI', dax: 'AVERAGE(gold_feeder_losses[saidi_minutes])' }],
    },
    insight: 'Twelve rural feeders account for 41% of AT&C losses; meters on them with frequent tamper events and consumption drops after 10 pm are the best inspection targets.',
  },
  {
    slug: 'telecom', code: 'TEL', name: 'Telecommunications', catalog: 'telco_cx', entity: 'subscriber',
    problem: {
      title: 'Subscriber Churn and Network Experience',
      statement: 'A mobile operator loses prepaid subscribers every month, often after poor network experience in their area. Recharge history, usage, network quality data, complaints and social media posts are in different systems. Build a customer and network analytics view that predicts which subscribers are likely to leave and links churn to network problems, so the operator can retain customers and fix the right towers.',
      stakeholders: ['Chief marketing officer', 'Retention team', 'Network operations', 'Customer care'],
      decisions: ['Which subscribers get a retention offer', 'Which towers to upgrade first', 'Which complaints to escalate'],
      questions: ['Which subscribers are likely to stop recharging in the next 30 days?', 'How do call drops and data speed relate to churn by area?', 'Which plans have the highest churn?'],
    },
    kpis: [
      { name: 'Monthly churn rate', definition: 'Subscribers with no recharge in 30 days ÷ active subscribers' },
      { name: 'ARPU', definition: 'Revenue ÷ active subscribers' },
      { name: 'Call drop rate', definition: 'Dropped calls ÷ total calls' },
      { name: 'Average data speed', definition: 'Average download speed (Mbps) experienced per subscriber' },
      { name: 'Complaint resolution time', definition: 'Average hours to resolve a complaint' },
    ],
    sources: {
      structured: [
        { name: 'Recharge and billing records', description: 'Recharges, plans, amounts' },
        { name: 'Usage CDR aggregates', description: 'Daily minutes, data usage, SMS per subscriber' },
      ],
      semi: [{ name: 'Network KPI feeds per tower', format: 'JSON', description: 'Call drops, throughput, congestion per cell' }],
      unstructured: [{ name: 'Complaints and social media posts', description: 'Complaint text and public posts about the network' }],
    },
    dataset: {
      name: 'subscriber_month', minRows: 100,
      columns: [key('subscriber_ref', 'Masked subscriber reference, e.g. SUB0001'), cat('plan_type', ['Prepaid', 'Postpaid']), str('circle'), str('primary_tower_id'), date('month'),
        num('recharge_amount', 0, 100000), num('data_gb', 0, 5000), num('voice_minutes', 0, 50000), num('call_drop_rate', 0, 1), int('complaints', 0, 100)],
    },
    gold: {
      name: 'gold_subscriber_churn', minRows: 50,
      columns: [key('subscriber_ref'), cat('plan_type', ['Prepaid', 'Postpaid']), num('arpu_3m', 0, 100000), num('avg_call_drop_rate', 0, 1), num('avg_speed_mbps', 0, 2000), num('churn_probability', 0, 1), cat('retention_action', ['None', 'Offer', 'Network fix'])],
    },
    quality: ['Subscribers ported out but still shown active', 'Duplicate CDR aggregates after a reprocessing run', 'Tower IDs changed after a network upgrade', 'Negative data usage from billing corrections', 'Mobile numbers inside complaint text'],
    dashboard: {
      pages: [
        { name: 'Churn overview', visuals: ['Monthly churn rate', 'Churn by plan and circle', 'ARPU trend'] },
        { name: 'Retention list', visuals: ['High-risk subscribers', 'Churn probability distribution', 'Offer vs network-fix split'] },
        { name: 'Network', visuals: ['Call drop rate by tower', 'Speed vs churn scatter', 'Complaints by area'] },
      ],
      measures: [{ name: 'Churn Probability', dax: 'AVERAGE(gold_subscriber_churn[churn_probability])' }, { name: 'ARPU 3M', dax: 'AVERAGE(gold_subscriber_churn[arpu_3m])' }, { name: 'Network-fix Subscribers', dax: 'CALCULATE(COUNTROWS(gold_subscriber_churn), gold_subscriber_churn[retention_action] = "Network fix")' }],
    },
    insight: 'Prepaid users on 30 towers with call drop rates above 3% churned twice as fast; upgrading those towers would protect more revenue than a blanket discount.',
  },
  {
    slug: 'logistics-supply-chain', code: 'LOG', name: 'Logistics & Supply Chain', catalog: 'logistics_ops', entity: 'shipment',
    problem: {
      title: 'On-Time Delivery and Cost per Shipment',
      statement: 'A logistics company is missing delivery promises and its cost per shipment keeps rising. Shipment bookings, GPS tracking, warehouse scans, fuel bills and driver feedback are not connected. Build a delivery analytics view that shows where and why shipments are late and what each lane costs, so operations can fix routes, hubs and carriers.',
      stakeholders: ['Head of operations', 'Hub managers', 'Fleet manager', 'Key account managers'],
      decisions: ['Which lanes and hubs need process fixes', 'Which carriers or vehicles to replace', 'What delivery promise to give customers by lane'],
      questions: ['Which lanes, hubs and carriers cause the most late deliveries?', 'How much time is lost at hubs versus on the road?', 'What is the cost per shipment and per kg by lane?'],
    },
    kpis: [
      { name: 'On-time delivery (OTD) %', definition: 'Shipments delivered by the promised date ÷ all delivered shipments' },
      { name: 'Average transit time', definition: 'Hours from pickup to delivery' },
      { name: 'Cost per shipment', definition: 'Total lane cost ÷ shipments on the lane' },
      { name: 'Hub dwell time', definition: 'Average hours a shipment waits at a hub' },
      { name: 'First-attempt delivery rate', definition: 'Shipments delivered at the first attempt ÷ all deliveries' },
    ],
    sources: {
      structured: [
        { name: 'Transport management system (TMS)', description: 'Bookings, lanes, promised dates, costs' },
        { name: 'Warehouse scan events', description: 'In-scan and out-scan at each hub' },
      ],
      semi: [{ name: 'Vehicle GPS pings', format: 'JSON Lines', description: 'Location and speed every 5 minutes' }],
      unstructured: [{ name: 'Driver feedback and proof-of-delivery photos', description: 'Notes on delays and delivery photos' }],
    },
    dataset: {
      name: 'shipment', minRows: 100,
      columns: [key('shipment_id', 'e.g. SHP0001'), str('origin_hub'), str('destination_hub'), str('carrier_id'), date('pickup_date'), date('promised_date'),
        optional(date('delivered_date')), num('weight_kg', 0.1, 50000), num('freight_cost', 0, 1000000), cat('mode', ['Road', 'Rail', 'Air'])],
    },
    gold: {
      name: 'gold_lane_performance', minRows: 50,
      columns: [key('lane_month_id'), str('origin_hub'), str('destination_hub'), num('otd_pct', 0, 100), num('avg_transit_hours', 0, 2000), num('cost_per_shipment', 0, 1000000), num('hub_dwell_hours', 0, 500), cat('status', ['Good', 'Watch', 'Fix'])],
    },
    quality: ['Delivered date before pickup date', 'Missing out-scans that make dwell time look huge', 'Hub codes different in the TMS and the scanner app', 'GPS pings with zero coordinates', 'Consignee phone numbers in driver notes'],
    dashboard: {
      pages: [
        { name: 'Delivery performance', visuals: ['OTD % trend', 'OTD by lane', 'Late shipments by cause'] },
        { name: 'Hubs', visuals: ['Dwell time by hub', 'Shipments waiting now', 'Scan compliance'] },
        { name: 'Cost', visuals: ['Cost per shipment by lane', 'Cost per kg by mode', 'Carrier comparison'] },
      ],
      measures: [{ name: 'OTD %', dax: 'AVERAGE(gold_lane_performance[otd_pct])' }, { name: 'Cost per Shipment', dax: 'AVERAGE(gold_lane_performance[cost_per_shipment])' }, { name: 'Lanes to Fix', dax: 'CALCULATE(COUNTROWS(gold_lane_performance), gold_lane_performance[status] = "Fix")' }],
    },
    insight: 'Most late deliveries on the Delhi–Lucknow lane come from 14 hours of dwell time at one hub between 10 pm and 6 am, not from road time; a night shift there would lift OTD by 11 points.',
  },
  {
    slug: 'agriculture', code: 'AGR', name: 'Agriculture', catalog: 'agri_yield', entity: 'farm plot',
    problem: {
      title: 'Crop Yield and Farmer Income',
      statement: 'A farmer producer organisation wants to raise members’ income, but yields vary widely between villages and farmers sell at the wrong time. Soil test results, sowing records, weather data, mandi prices and field officer notes are scattered. Build an agriculture analytics view that explains yield differences and shows the best time and market to sell, so the organisation can advise farmers season by season.',
      stakeholders: ['FPO chief executive', 'Field officers', 'Agronomist', 'Member farmers'],
      decisions: ['Which crop and variety to recommend per village', 'When and where members should sell', 'Where to run soil-health and irrigation programmes'],
      questions: ['Which factors (soil, irrigation, variety, sowing date) explain yield differences?', 'How do mandi prices move after harvest, and when is the best time to sell?', 'Which villages have the biggest gap between actual and potential yield?'],
    },
    kpis: [
      { name: 'Yield per acre', definition: 'Quintals harvested ÷ acres sown' },
      { name: 'Net income per acre', definition: '(Sale value − input cost) ÷ acres' },
      { name: 'Price realisation', definition: 'Price received ÷ average mandi modal price in the month' },
      { name: 'Yield gap', definition: 'Potential yield − actual yield, per acre' },
      { name: 'Irrigation coverage', definition: 'Irrigated acres ÷ total acres' },
    ],
    sources: {
      structured: [
        { name: 'Member and plot register', description: 'Farmers, plots, area, village, irrigation' },
        { name: 'Soil health card results', description: 'pH, nitrogen, phosphorus, potassium per plot' },
      ],
      semi: [{ name: 'Mandi price and weather APIs', format: 'JSON', description: 'Daily modal prices by market and daily rainfall and temperature' }],
      unstructured: [{ name: 'Field officer notes and crop photos', description: 'Pest, disease and crop-stage observations' }],
    },
    dataset: {
      name: 'plot_season', minRows: 100,
      columns: [key('plot_season_id', 'e.g. PLT0001'), str('village'), cat('crop', ['Paddy', 'Wheat', 'Cotton', 'Soybean', 'Maize', 'Groundnut']), cat('season', ['Kharif', 'Rabi', 'Zaid']), num('area_acres', 0.1, 100),
        bool('irrigated'), num('soil_ph', 3, 10), date('sowing_date'), num('yield_quintals', 0, 5000), num('sale_price_per_quintal', 0, 20000)],
    },
    gold: {
      name: 'gold_village_crop', minRows: 50,
      columns: [key('village_crop_season'), str('village'), cat('crop', ['Paddy', 'Wheat', 'Cotton', 'Soybean', 'Maize', 'Groundnut']), num('yield_per_acre', 0, 200), num('yield_gap', -100, 200), num('net_income_per_acre', -500000, 1000000), num('price_realisation', 0, 3), cat('advice', ['Maintain', 'Improve inputs', 'Change timing'])],
    },
    quality: ['Areas in hectares and acres mixed', 'Sowing dates in the wrong season', 'Yield recorded in kg for some plots and quintals for others', 'Village names spelled differently by officers', 'Farmer phone numbers and Aadhaar numbers in notes'],
    dashboard: {
      pages: [
        { name: 'Yield', visuals: ['Yield per acre by village and crop', 'Yield gap map', 'Irrigated vs rain-fed yield'] },
        { name: 'Selling', visuals: ['Mandi price trend after harvest', 'Price realisation by market', 'Best selling week'] },
        { name: 'Income', visuals: ['Net income per acre by crop', 'Input cost vs income', 'Villages needing advice'] },
      ],
      measures: [{ name: 'Yield per Acre', dax: 'AVERAGE(gold_village_crop[yield_per_acre])' }, { name: 'Net Income per Acre', dax: 'AVERAGE(gold_village_crop[net_income_per_acre])' }, { name: 'Villages to Advise', dax: 'CALCULATE(DISTINCTCOUNT(gold_village_crop[village]), gold_village_crop[advice] <> "Maintain")' }],
    },
    insight: 'Soybean plots sown after 5 July yielded 22% less; members who sold 6 weeks after harvest got 14% better prices than those selling in the first week.',
  },
  {
    slug: 'government-public-sector', code: 'GOV', name: 'Government & Public Sector', catalog: 'gov_schemes', entity: 'beneficiary application',
    problem: {
      title: 'Welfare Scheme Delivery and Grievance Resolution',
      statement: 'A state department runs welfare schemes but cannot see how long eligible citizens wait for benefits or why applications are rejected, and grievances pile up. Application records, payment files, district reports, grievance portal data and officer remarks are kept separately. Build a governance analytics view that tracks each step from application to payment and grievance closure, so the department can remove bottlenecks and reach every eligible citizen.',
      stakeholders: ['Department secretary', 'District collectors', 'Block officers', 'Grievance cell'],
      decisions: ['Which districts and blocks need officer support', 'Which rejection reasons to fix in the process', 'How to prioritise pending grievances'],
      questions: ['How many days does each step take, and where are applications stuck?', 'What are the top rejection reasons by district?', 'Which grievance types take the longest to close?'],
    },
    kpis: [
      { name: 'Average days to benefit', definition: 'Days from application to first payment' },
      { name: 'Approval rate', definition: 'Approved applications ÷ decided applications' },
      { name: 'Pending beyond SLA', definition: 'Applications pending longer than the service guarantee period' },
      { name: 'Grievance closure time', definition: 'Average days from grievance to closure' },
      { name: 'Payment success rate', definition: 'Successful direct benefit transfers ÷ attempted transfers' },
    ],
    sources: {
      structured: [
        { name: 'Scheme application portal', description: 'Applications, district, block, status, dates' },
        { name: 'DBT payment files', description: 'Payment attempts, success and failure reasons' },
      ],
      semi: [{ name: 'Grievance portal export', format: 'JSON', description: 'Grievances with category, status and timestamps' }],
      unstructured: [{ name: 'Officer remarks and field verification reports', description: 'Reasons for rejection and verification notes' }],
    },
    dataset: {
      name: 'scheme_application', minRows: 100,
      columns: [key('application_id', 'e.g. APP0001'), cat('scheme', ['Old-age pension', 'Scholarship', 'Housing', 'Farmer support']), str('district'), str('block'), date('applied_date'),
        cat('status', ['Pending', 'Approved', 'Rejected', 'Paid']), optional(date('decision_date')), optional(date('payment_date')), num('benefit_amount', 0, 1000000), optional(str('rejection_reason'))],
    },
    gold: {
      name: 'gold_district_delivery', minRows: 50,
      columns: [key('district_scheme_month'), str('district'), cat('scheme', ['Old-age pension', 'Scholarship', 'Housing', 'Farmer support']), num('avg_days_to_benefit', 0, 1000), num('approval_rate', 0, 1), int('pending_beyond_sla', 0, 1000000), num('payment_success_rate', 0, 1), cat('status', ['On track', 'Delayed', 'Critical'])],
    },
    quality: ['Payment date before approval date', 'District names in English and the local language', 'The same citizen applying twice under different IDs', 'Status "Paid" with no payment record', 'Aadhaar and phone numbers in officer remarks (must be masked)'],
    dashboard: {
      pages: [
        { name: 'Delivery overview', visuals: ['Applications by status', 'Average days to benefit by district', 'Pending beyond SLA trend'] },
        { name: 'Bottlenecks', visuals: ['Days per step (funnel)', 'Top rejection reasons', 'Blocks with Critical status'] },
        { name: 'Grievances', visuals: ['Open grievances by category', 'Closure time trend', 'Payment failures by reason'] },
      ],
      measures: [{ name: 'Avg Days to Benefit', dax: 'AVERAGE(gold_district_delivery[avg_days_to_benefit])' }, { name: 'Pending Beyond SLA', dax: 'SUM(gold_district_delivery[pending_beyond_sla])' }, { name: 'Critical Districts', dax: 'CALCULATE(DISTINCTCOUNT(gold_district_delivery[district]), gold_district_delivery[status] = "Critical")' }],
    },
    insight: 'Most of the delay in old-age pensions is in field verification in five districts; “bank account not seeded” causes 38% of payment failures and can be fixed before approval.',
  },
  {
    slug: 'media-entertainment', code: 'MED', name: 'Media & Entertainment', catalog: 'media_ott', entity: 'viewer',
    problem: {
      title: 'OTT Viewer Engagement and Churn',
      statement: 'A regional OTT streaming platform gains subscribers with each big release but loses many when their first month ends. Viewing sessions, subscriptions, content metadata, app ratings and social buzz are in different tools. Build an engagement analytics view that shows what keeps viewers watching and who is likely to cancel, so the content and marketing teams can invest in the right shows and reminders.',
      stakeholders: ['Head of content', 'Growth marketing', 'Product team', 'Programming team'],
      decisions: ['Which shows and languages to commission', 'Which viewers get a personalised reminder', 'Where to place new releases on the home screen'],
      questions: ['Which shows lead to longer subscriptions?', 'What viewing pattern in the first 14 days predicts cancellation?', 'How does completion rate vary by genre and language?'],
    },
    kpis: [
      { name: 'Monthly churn rate', definition: 'Subscriptions cancelled or not renewed ÷ active subscriptions' },
      { name: 'Watch time per subscriber', definition: 'Minutes watched ÷ active subscribers' },
      { name: 'Completion rate', definition: 'Episodes watched to 90% ÷ episodes started' },
      { name: 'Day-14 retention', definition: 'New subscribers still watching on day 14 ÷ new subscribers' },
      { name: 'Content ROI', definition: 'Subscription revenue attributed to a show ÷ show cost' },
    ],
    sources: {
      structured: [
        { name: 'Subscription billing', description: 'Plans, start and end dates, payments' },
        { name: 'Content catalogue', description: 'Titles, genre, language, release date, cost band' },
      ],
      semi: [{ name: 'Player session events', format: 'JSON Lines', description: 'Play, pause, seek and stop events with timestamps' }],
      unstructured: [{ name: 'App reviews and social media mentions', description: 'Ratings text and posts about shows' }],
    },
    dataset: {
      name: 'viewer_session', minRows: 100,
      columns: [key('session_id', 'e.g. SES0001'), str('viewer_ref'), str('title_id'), cat('genre', ['Drama', 'Thriller', 'Comedy', 'Kids', 'Devotional', 'Sports']), cat('language', ['Hindi', 'Tamil', 'Telugu', 'Marathi', 'Bengali', 'English']),
        date('session_date'), num('minutes_watched', 0, 1440), num('completion_pct', 0, 100), cat('device', ['Mobile', 'TV', 'Web']), cat('plan', ['Monthly', 'Quarterly', 'Annual'])],
    },
    gold: {
      name: 'gold_viewer_engagement', minRows: 50,
      columns: [key('viewer_ref'), num('watch_minutes_30d', 0, 50000), int('titles_started_30d', 0, 1000), num('avg_completion_pct', 0, 100), int('days_active_30d', 0, 31), num('churn_probability', 0, 1), cat('nudge', ['None', 'New episode', 'Recommendation', 'Offer'])],
    },
    quality: ['Sessions with watch time longer than the episode', 'Duplicate events from app retries', 'Title IDs differ between catalogue and player logs', 'Time zones mixed in event timestamps', 'Viewer emails in app review text'],
    dashboard: {
      pages: [
        { name: 'Engagement', visuals: ['Watch time per subscriber trend', 'Completion rate by genre', 'Top titles by watch time'] },
        { name: 'Retention', visuals: ['Day-14 retention cohort', 'Churn probability distribution', 'Viewers to nudge'] },
        { name: 'Content', visuals: ['Content ROI by title', 'Language mix', 'Device split'] },
      ],
      measures: [{ name: 'Avg Watch Minutes', dax: 'AVERAGE(gold_viewer_engagement[watch_minutes_30d])' }, { name: 'Avg Completion %', dax: 'AVERAGE(gold_viewer_engagement[avg_completion_pct])' }, { name: 'Viewers to Nudge', dax: 'CALCULATE(COUNTROWS(gold_viewer_engagement), gold_viewer_engagement[nudge] <> "None")' }],
    },
    insight: 'Subscribers who finished one series in their first week were 3× less likely to cancel; Telugu thrillers have the highest completion and the best content ROI.',
  },
  {
    slug: 'travel-hospitality', code: 'TRV', name: 'Travel & Hospitality', catalog: 'hotel_rev', entity: 'booking',
    problem: {
      title: 'Hotel Occupancy, Revenue and Cancellations',
      statement: 'A hotel chain has empty rooms on weekdays and many last-minute cancellations, so revenue per available room is below the market. Bookings from its website and online travel agents, room inventory, rate plans, guest reviews and competitor prices are not combined. Build a revenue analytics view that explains occupancy, rate and cancellation patterns, so revenue managers can set better prices and policies.',
      stakeholders: ['Revenue manager', 'General managers', 'Sales and distribution', 'Guest experience team'],
      decisions: ['Rates for each room type and day', 'Cancellation policy and deposit rules by channel', 'Where to improve guest experience'],
      questions: ['How do occupancy, ADR and RevPAR change by day of week and season?', 'Which channels and lead times have the most cancellations?', 'How do review scores relate to price and repeat stays?'],
    },
    kpis: [
      { name: 'Occupancy %', definition: 'Rooms sold ÷ rooms available' },
      { name: 'ADR', definition: 'Room revenue ÷ rooms sold' },
      { name: 'RevPAR', definition: 'Room revenue ÷ rooms available (= Occupancy × ADR)' },
      { name: 'Cancellation rate', definition: 'Cancelled bookings ÷ all bookings' },
      { name: 'Review score', definition: 'Average guest rating out of 5' },
    ],
    sources: {
      structured: [
        { name: 'Property management system (PMS)', description: 'Bookings, stays, room types, rates, revenue' },
        { name: 'Channel manager', description: 'Bookings by channel and commission' },
      ],
      semi: [{ name: 'Competitor rate shopping feed', format: 'JSON', description: 'Daily competitor prices by date and room type' }],
      unstructured: [{ name: 'Guest reviews', description: 'Review text from booking sites' }],
    },
    dataset: {
      name: 'hotel_booking', minRows: 100,
      columns: [key('booking_id', 'e.g. BKG0001'), str('hotel_id'), cat('room_type', ['Standard', 'Deluxe', 'Suite']), cat('channel', ['Direct', 'OTA', 'Corporate', 'Walk-in']), date('booking_date'),
        date('checkin_date'), int('nights', 1, 60), num('room_rate', 0, 200000), bool('cancelled'), optional(num('review_score', 1, 5))],
    },
    gold: {
      name: 'gold_hotel_day', minRows: 50,
      columns: [key('hotel_date_id'), str('hotel_id'), num('occupancy_pct', 0, 100), num('adr', 0, 200000), num('revpar', 0, 200000), num('cancellation_rate', 0, 1), cat('pricing_signal', ['Raise', 'Hold', 'Lower'])],
    },
    quality: ['Check-in date before booking date', 'Same booking from OTA and PMS counted twice', 'Rates with and without tax mixed', 'Room types named differently per hotel', 'Guest phone numbers and emails in review text'],
    dashboard: {
      pages: [
        { name: 'Revenue', visuals: ['RevPAR trend', 'Occupancy and ADR by day of week', 'Revenue by room type'] },
        { name: 'Cancellations', visuals: ['Cancellation rate by channel', 'Cancellations by lead time', 'Revenue lost to cancellations'] },
        { name: 'Market', visuals: ['Our rate vs competitors', 'Pricing signals by date', 'Review score vs ADR'] },
      ],
      measures: [{ name: 'RevPAR', dax: 'AVERAGE(gold_hotel_day[revpar])' }, { name: 'Occupancy %', dax: 'AVERAGE(gold_hotel_day[occupancy_pct])' }, { name: 'Cancellation Rate', dax: 'AVERAGE(gold_hotel_day[cancellation_rate])' }],
    },
    insight: 'OTA bookings made more than 60 days ahead cancel 3× as often; a small non-refundable discount for long lead times and weekday corporate rates would lift RevPAR by about 8%.',
  },
  {
    slug: 'real-estate-construction', code: 'REC', name: 'Real Estate & Construction', catalog: 'realty_projects', entity: 'project activity',
    problem: {
      title: 'Project Delays and Cost Overruns',
      statement: 'A real estate developer delivers most projects late and over budget, and buyers complain about missed possession dates. Project schedules, contractor bills, material purchases, site progress photos and inspection reports are in different systems. Build a project analytics view that shows where schedules slip and costs overrun, so project managers can act before delays reach possession dates.',
      stakeholders: ['Director of projects', 'Project managers', 'Procurement', 'Customer relations'],
      decisions: ['Which projects and activities need extra resources now', 'Which contractors and suppliers to review', 'What possession date to communicate to buyers'],
      questions: ['Which activities are on the critical path and running late?', 'Where is spend higher than the budget, and why?', 'Which contractors and materials cause the most delays?'],
    },
    kpis: [
      { name: 'Schedule performance index (SPI)', definition: 'Earned value ÷ planned value' },
      { name: 'Cost performance index (CPI)', definition: 'Earned value ÷ actual cost' },
      { name: 'Delay days', definition: 'Forecast finish − planned finish, per activity' },
      { name: 'Cost overrun %', definition: '(Actual cost − budget) ÷ budget × 100' },
      { name: 'Snag closure rate', definition: 'Snags closed ÷ snags raised in inspections' },
    ],
    sources: {
      structured: [
        { name: 'Project schedule (Primavera / MS Project export)', description: 'Activities, planned and actual dates, % complete' },
        { name: 'ERP costs', description: 'Contractor bills, purchase orders and payments' },
      ],
      semi: [{ name: 'Site IoT and equipment logs', format: 'JSON', description: 'Concrete pours, crane usage and weather' }],
      unstructured: [{ name: 'Site progress photos and inspection reports', description: 'Weekly photos and quality inspection notes' }],
    },
    dataset: {
      name: 'project_activity', minRows: 100,
      columns: [key('activity_id', 'e.g. ACT0001'), str('project_id'), cat('activity_type', ['Excavation', 'Foundation', 'Structure', 'MEP', 'Finishing']), str('contractor_id'), date('planned_start'),
        date('planned_finish'), optional(date('actual_finish')), num('percent_complete', 0, 100), num('budget_cost', 0, 1000000000), num('actual_cost', 0, 1000000000)],
    },
    gold: {
      name: 'gold_project_health', minRows: 50,
      columns: [key('project_month_id'), str('project_id'), num('spi', 0, 3), num('cpi', 0, 3), int('forecast_delay_days', -365, 3650), num('cost_overrun_pct', -100, 500), cat('rag_status', ['Green', 'Amber', 'Red'])],
    },
    quality: ['Actual finish before actual start', 'Percent complete going down week to week', 'Costs booked to closed activities', 'Contractor names differ between schedule and ERP', 'Buyer phone numbers in customer notes attached to units'],
    dashboard: {
      pages: [
        { name: 'Portfolio', visuals: ['Projects by RAG status', 'SPI and CPI by project', 'Forecast possession dates'] },
        { name: 'Schedule', visuals: ['Delay days by activity type', 'Critical activities late', 'Progress S-curve'] },
        { name: 'Cost', visuals: ['Cost overrun % by project', 'Spend by contractor', 'Budget vs actual trend'] },
      ],
      measures: [{ name: 'Avg SPI', dax: 'AVERAGE(gold_project_health[spi])' }, { name: 'Avg Cost Overrun %', dax: 'AVERAGE(gold_project_health[cost_overrun_pct])' }, { name: 'Red Projects', dax: 'CALCULATE(DISTINCTCOUNT(gold_project_health[project_id]), gold_project_health[rag_status] = "Red")' }],
    },
    insight: 'MEP work by two contractors drives 60% of delay days across three towers; finishing materials bought late in the monsoon added 9% to costs.',
  },
];

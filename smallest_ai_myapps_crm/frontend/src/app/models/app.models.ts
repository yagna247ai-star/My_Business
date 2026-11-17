export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  business?: string;
  status?: 'Ready' | 'Dialing' | 'Completed' | 'Failed' | 'Blocked' | 'Throttled';
  attempts?: number;
}

export interface CallResult {
  call_id: string;
  lead_id: string;
  lead_name: string;
  phone: string;
  status: string;
  duration_seconds: number;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  interest_level: 'High' | 'Medium' | 'Low';
  crm_target_stage: string;
  transcript: string;
  summary: string;
  action_items: string[];
  timestamp: number;
}

export interface CRMItem {
  id: string;
  lead_name: string;
  phone: string;
  stage: 'New Lead' | 'Called' | 'Demo Scheduled' | 'Quote Sent' | 'Opted Out';
  sentiment: string;
  notes: string;
  updated_at: string;
}

export interface RedisTelemetry {
  engine: string;
  total_keys: number;
  keys_sample: Array<{ key: string; type: string; ttl: number }>;
  dnc_blacklist: string[];
}

export interface AppConfigData {
  smallest_ai_api_key: string;
  smallest_ai_agent_id: string;
  myapps_crm_webhook_url: string;
  rate_limit_per_sec: number;
  mock_mode: boolean;
}

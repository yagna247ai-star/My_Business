import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GatewayService {
  private baseUrl = 'http://localhost:8000/api';

  async getConfig(): Promise<any> {
    try {
      const res = await fetch(`${this.baseUrl}/config`);
      return await res.json();
    } catch (e) {
      console.warn("Gateway offline, returning mock config");
      return {
        smallest_ai_api_key: "smallest_test_key_9988776655",
        smallest_ai_agent_id: "agent_waves_voice_001",
        myapps_crm_webhook_url: "https://api.myapps.crm/v1/webhooks/pipeline-update",
        rate_limit_per_sec: 10,
        mock_mode: true,
        redis_telemetry: { engine: "In-Memory FakeRedis Engine", total_keys: 4, keys_sample: [], dnc_blacklist: [] }
      };
    }
  }

  async updateConfig(configData: any): Promise<any> {
    const res = await fetch(`${this.baseUrl}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(configData)
    });
    return await res.json();
  }

  async parseCSV(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${this.baseUrl}/calls/parse-csv`, {
      method: 'POST',
      body: formData
    });
    return await res.json();
  }

  async dispatchSingle(lead: any): Promise<any> {
    const res = await fetch(`${this.baseUrl}/calls/dispatch-single`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead)
    });
    return await res.json();
  }

  async dispatchBatch(leads: any[]): Promise<any> {
    const res = await fetch(`${this.baseUrl}/calls/dispatch-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leads })
    });
    return await res.json();
  }

  async runDevilSimulation(scenario: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/devils-advocate/simulate/${scenario}`, {
      method: 'POST'
    });
    return await res.json();
  }

  async getAuditReport(): Promise<any> {
    const res = await fetch(`${this.baseUrl}/devils-advocate/audit-report`);
    return await res.json();
  }

  async fetchMyAppzLeads(stage?: string): Promise<any> {
    const url = stage ? `${this.baseUrl}/myappz/leads?stage=${encodeURIComponent(stage)}` : `${this.baseUrl}/myappz/leads`;
    const res = await fetch(url);
    return await res.json();
  }

  async syncAndDispatchMyAppzLeads(stage: string = 'Outreach Queue', limit: number = 10): Promise<any> {
    const res = await fetch(`${this.baseUrl}/myappz/sync-and-dispatch-batch?stage=${encodeURIComponent(stage)}&limit=${limit}`, {
      method: 'POST'
    });
    return await res.json();
  }

  async fetchWabaTemplates(): Promise<any> {
    const res = await fetch(`${this.baseUrl}/myappz/waba/templates`);
    return await res.json();
  }

  async sendWabaTemplate(payload: any): Promise<any> {
    const res = await fetch(`${this.baseUrl}/myappz/waba/send-template`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  }

  async fetchWabaLogs(limit: number = 20): Promise<any> {
    const res = await fetch(`${this.baseUrl}/myappz/waba/logs?limit=${limit}`);
    return await res.json();
  }
}

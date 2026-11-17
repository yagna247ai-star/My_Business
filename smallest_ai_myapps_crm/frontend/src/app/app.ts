import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GatewayService } from './services/gateway.service';
import { Lead, CallResult, CRMItem, RedisTelemetry } from './models/app.models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  title = 'Smallest AI Voice Agent Integration with MyApps CRM';
  
  activeTab = signal<'dispatcher' | 'crm' | 'redis' | 'devils-advocate' | 'waba'>('dispatcher');
  
  // State Signals
  leads = signal<Lead[]>([]);
  invalidLeads = signal<any[]>([]);
  callResults = signal<CallResult[]>([]);
  crmItems = signal<CRMItem[]>([]);
  redisTelemetry = signal<RedisTelemetry | null>(null);
  
  // WABA State Signals
  wabaTemplates = signal<any>({});
  wabaLogs = signal<any[]>([]);
  wabaPhone = signal<string>('+919840066397');
  wabaSelectedTemplate = signal<string>('solar_demo_confirmation_te');
  
  isConfigModalOpen = signal<boolean>(false);
  isDispatching = signal<boolean>(false);
  dispatchProgress = signal<number>(0);
  
  config = signal<any>({
    smallest_ai_api_key: 'smallest_test_key_9988776655',
    smallest_ai_agent_id: 'agent_waves_voice_001',
    myapps_crm_webhook_url: 'https://api.myapps.crm/v1/webhooks/pipeline-update',
    rate_limit_per_sec: 10,
    mock_mode: true
  });

  // Devil's Advocate Simulation State
  simulationResult = signal<any | null>(null);
  auditReport = signal<any | null>(null);
  activeScenario = signal<string>('');

  // Computed Metrics
  totalLeads = computed(() => this.leads().length);
  completedCalls = computed(() => this.callResults().length);
  dncCount = computed(() => this.redisTelemetry()?.dnc_blacklist?.length || 0);

  constructor(private gateway: GatewayService) {}

  async ngOnInit() {
    await this.loadConfig();
    this.seedDefaultLeads();
  }

  async loadConfig() {
    try {
      const res = await this.gateway.getConfig();
      if (res) {
        this.config.set(res);
        if (res.redis_telemetry) {
          this.redisTelemetry.set(res.redis_telemetry);
        }
      }
    } catch (e) {
      console.warn("Could not fetch gateway config, using local state");
    }
  }

  seedDefaultLeads() {
    const defaults: Lead[] = [
      { id: 'lead_101', name: 'Rajesh Sharma', phone: '+919876543210', business: 'Rooftop Solar 10kW', status: 'Ready' },
      { id: 'lead_102', name: 'Ananya Rao', phone: '+919812345678', business: 'Commercial Solar Audit', status: 'Ready' },
      { id: 'lead_103', name: 'Vikram Patel', phone: '+919988776655', business: 'Hybrid Inverter & Storage', status: 'Ready' },
      { id: 'lead_104', name: 'Suresh Verma', phone: '+919000111222', business: 'Agricultural Pump Solar', status: 'Ready' }
    ];
    this.leads.set(defaults);
    
    // Seed initial CRM pipeline items
    this.crmItems.set([
      { id: 'crm_1', lead_name: 'Priya Sundaram', phone: '+919111222333', stage: 'Demo Scheduled', sentiment: 'Positive', notes: 'Appointment set for Tuesday 10 AM', updated_at: '10 mins ago' },
      { id: 'crm_2', lead_name: 'Ketan Shah', phone: '+919444555666', stage: 'Quote Sent', sentiment: 'Neutral', notes: 'Pricing matrix emailed for 8kW', updated_at: '25 mins ago' }
    ]);
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      try {
        const res = await this.gateway.parseCSV(file);
        if (res && res.valid_leads) {
          this.leads.set(res.valid_leads);
          this.invalidLeads.set(res.invalid_leads || []);
        }
      } catch (e) {
        // Fallback local reader if gateway offline
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const text = e.target.result;
          this.parseCSVTextLocally(text);
        };
        reader.readAsText(file);
      }
    }
  }

  parseCSVTextLocally(text: string) {
    const lines = text.split('\n').filter(l => l.trim());
    const parsed: Lead[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      if (cols.length >= 2) {
        parsed.push({
          id: `lead_csv_${i}`,
          name: cols[0].replace(/"/g, '').trim(),
          phone: cols[1].replace(/"/g, '').trim(),
          business: cols[2] ? cols[2].replace(/"/g, '').trim() : 'Solar Lead',
          status: 'Ready'
        });
      }
    }
    this.leads.set(parsed);
  }

  async startBatchDispatch() {
    this.isDispatching.set(true);
    this.dispatchProgress.set(0);

    const currentLeads = [...this.leads()];
    const total = currentLeads.length;

    try {
      const res = await this.gateway.dispatchBatch(currentLeads);
      if (res && res.call_results) {
        const newResults: CallResult[] = [];
        const updatedCRM = [...this.crmItems()];

        res.call_results.forEach((r: any) => {
          if (r.result) {
            newResults.push(r.result);
            
            // Push to CRM Board
            const stage = r.result.crm_target_stage || 'Called';
            updatedCRM.unshift({
              id: `crm_${r.result.call_id}`,
              lead_name: r.result.lead_name,
              phone: r.result.phone,
              stage: stage as any,
              sentiment: r.result.sentiment,
              notes: r.result.summary,
              updated_at: 'Just now'
            });
          }
        });

        this.callResults.update(existing => [...newResults, ...existing]);
        this.crmItems.set(updatedCRM);
      }
    } catch (e) {
      console.warn("Backend batch dispatch simulated locally");
      this.simulateLocalBatchDispatch();
    }

    this.dispatchProgress.set(100);
    this.isDispatching.set(false);
    await this.loadConfig(); // Refresh Redis telemetry
  }

  async syncMyAppzCRMLeads() {
    this.isDispatching.set(true);
    this.dispatchProgress.set(10);

    try {
      // 1. Fetch leads from MyAppz CRM
      const res = await this.gateway.fetchMyAppzLeads();
      if (res && res.leads) {
        this.leads.set(res.leads);
      }
      this.dispatchProgress.set(40);

      // 2. Dispatch batch calls
      const batchRes = await this.gateway.syncAndDispatchMyAppzLeads();
      if (batchRes && batchRes.call_results) {
        const newResults: CallResult[] = [];
        const updatedCRM = [...this.crmItems()];

        batchRes.call_results.forEach((r: any) => {
          if (r.result) {
            newResults.push(r.result);
            updatedCRM.unshift({
              id: `crm_${r.result.call_id}`,
              lead_name: r.result.lead_name,
              phone: r.result.phone,
              stage: (r.result.crm_target_stage || 'Called') as any,
              sentiment: r.result.sentiment,
              notes: r.result.summary,
              updated_at: 'Just now'
            });
          }
        });

        this.callResults.update(existing => [...newResults, ...existing]);
        this.crmItems.set(updatedCRM);
      }
    } catch (e) {
      console.warn("Could not sync MyAppz CRM leads directly", e);
    }

    this.dispatchProgress.set(100);
    this.isDispatching.set(false);
    await this.loadConfig();
  }

  simulateLocalBatchDispatch() {
    const updated = this.leads().map(l => ({ ...l, status: 'Completed' as const }));
    this.leads.set(updated);
  }

  async runSimulation(scenario: string) {
    this.activeScenario.set(scenario);
    try {
      const res = await this.gateway.runDevilSimulation(scenario);
      this.simulationResult.set(res);
      await this.loadConfig(); // refresh Redis Telemetry
    } catch (e) {
      this.simulationResult.set({
        scenario: scenario,
        error: "Gateway connection failed. Please ensure FastAPI server is running on port 8000."
      });
    }
  }

  async fetchAuditReport() {
    try {
      const res = await this.gateway.getAuditReport();
      this.auditReport.set(res);
    } catch (e) {
      this.auditReport.set({ error: "Could not fetch audit report from FastAPI gateway" });
    }
  }

  async saveConfig() {
    try {
      await this.gateway.updateConfig(this.config());
      this.isConfigModalOpen.set(false);
    } catch (e) {
      this.isConfigModalOpen.set(false);
    }
  }

  getCRMItemsByStage(stage: string) {
    return this.crmItems().filter(item => item.stage === stage);
  }

  async loadWabaData() {
    try {
      const templatesRes = await this.gateway.fetchWabaTemplates();
      if (templatesRes && templatesRes.templates) {
        this.wabaTemplates.set(templatesRes.templates);
      }
      const logsRes = await this.gateway.fetchWabaLogs();
      if (logsRes && logsRes.logs) {
        this.wabaLogs.set(logsRes.logs);
      }
    } catch (e) {
      console.warn("Could not load WABA data from gateway", e);
    }
  }

  async sendWabaManual() {
    try {
      const payload = {
        phone: this.wabaPhone(),
        template_name: this.wabaSelectedTemplate(),
        parameters: {
          name: "Ramesh Varma",
          business: "Ramesh Solar Traders",
          city: "Vijayawada"
        }
      };
      await this.gateway.sendWabaTemplate(payload);
      await this.loadWabaData();
    } catch (e) {
      console.warn("Error triggering WABA manual dispatch", e);
    }
  }
}

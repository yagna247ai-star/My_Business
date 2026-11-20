/** Shapes for the domain catalogue (pure data; imported by the app and by the seed). */
import type { ColumnRule, DatasetSchema } from './datasetCheck';
import type { EnterpriseProfile } from './enterprise';

export type DomainSpec = {
  slug: string;            // URL-safe id, e.g. 'energy-utilities'
  code: string;            // level-code prefix, e.g. 'ENU'
  name: string;            // 'Energy & Utilities'
  catalog: string;         // Unity Catalog name used throughout the journey
  entity: string;          // main business entity, e.g. 'consumer'
  problem: { title: string; statement: string; stakeholders: string[]; decisions: string[]; questions: string[] };
  kpis: { name: string; definition: string }[];
  sources: {
    structured: { name: string; description: string }[];
    semi: { name: string; format: 'JSON' | 'XML' | 'JSON Lines'; description: string }[];
    unstructured: { name: string; description: string }[];
  };
  /** The main structured dataset collected in Module 2 (and cleaned in Module 5). */
  dataset: DatasetSchema;
  /** The gold KPI mart built in Module 6 and used by Power BI. */
  gold: DatasetSchema;
  quality: string[];       // typical data-quality issues for this domain
  dashboard: { pages: { name: string; visuals: string[] }[]; measures: { name: string; dax: string }[] };
  insight: string;         // an example of the kind of finding the capstone should reach
  /** Production scale, SLA, regulations, PII to mask and the SCD Type 2 dimension (lib/domain/daDomains/enterprise.ts). */
  enterprise: EnterpriseProfile;
};

/* Column helpers keep the catalogue readable. */
export const key = (name: string, description?: string): ColumnRule => ({ name, type: 'string', required: true, key: true, description });
export const str = (name: string, description?: string): ColumnRule => ({ name, type: 'string', required: true, description });
export const int = (name: string, min: number, max: number, description?: string): ColumnRule => ({ name, type: 'integer', required: true, min, max, description });
export const num = (name: string, min: number, max: number, description?: string): ColumnRule => ({ name, type: 'number', required: true, min, max, description });
export const date = (name: string, description?: string): ColumnRule => ({ name, type: 'date', required: true, description });
export const cat = (name: string, values: string[], description?: string): ColumnRule => ({ name, type: 'category', required: true, values, description });
export const bool = (name: string, description?: string): ColumnRule => ({ name, type: 'boolean', required: true, description });
export const optional = (c: ColumnRule): ColumnRule => ({ ...c, required: false });

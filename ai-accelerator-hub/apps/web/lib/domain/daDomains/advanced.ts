/**
 * Hard and Critical depth: PySpark alongside SQL on every Databricks day, deeper Unity Catalog, and a legacy-pipeline
 * reverse-engineering thread (Modules 4–6). Applies to Hard and Critical tracks and to domains without tracks (their
 * single journey is the full, Hard problem). Easy and Intermediate keep SQL only.
 *
 * Every snippet is generated from the journey's own catalog, tables and columns (dataLab.labCols), so it runs as-is
 * against the learner's data.
 */
import type { DomainSpec } from './types';
import { labCols } from './dataLab';

export const isAdvanced = (d: DomainSpec) => !d.track || d.track.level === 'hard' || d.track.level === 'critical';
const isCritical = (d: DomainSpec) => d.track?.level === 'critical';

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);
const ddlType = (t: string) => (t === 'integer' ? 'INT' : t === 'number' ? 'DECIMAL(14,2)' : t === 'date' ? 'DATE' : t === 'boolean' ? 'BOOLEAN' : 'STRING');

/* ───────── PySpark alongside SQL (Modules 3–6) ───────── */

type Gen = (d: DomainSpec) => string;
/** Module suffix → day index (0–4) → PySpark for that day. */
export const PYSPARK: Record<string, Record<number, Gen>> = {
  UNITY_CATALOG: {
    1: d => `# Unity Catalog from a notebook: the same DDL through spark.sql, then check it with the catalog API.
spark.sql("CREATE CATALOG IF NOT EXISTS ${d.catalog}")
spark.sql("USE CATALOG ${d.catalog}")
print(spark.catalog.currentCatalog())            # ${d.catalog}
display(spark.sql("SHOW CATALOGS LIKE '${d.catalog}*'"))`,
    2: d => `for layer, note in [("bronze", "Raw data as received"), ("silver", "Cleaned and standardised"), ("gold", "Business-ready marts")]:
    spark.sql(f"CREATE SCHEMA IF NOT EXISTS ${d.catalog}.{layer} COMMENT '{note}'")
print([s.name for s in spark.catalog.listDatabases()])   # bronze, silver, gold`,
    3: d => `spark.sql("CREATE VOLUME IF NOT EXISTS ${d.catalog}.bronze.raw_files")
display(dbutils.fs.ls("/Volumes/${d.catalog}/bronze/raw_files/"))   # your CSV, JSON and text files`,
    4: d => { const c = labCols(d); return `# Governance as code: grants, a column mask, a row filter and a tag, applied from PySpark.
spark.sql("GRANT USE CATALOG ON CATALOG ${d.catalog} TO \`account users\`")
spark.sql("GRANT USE SCHEMA, SELECT ON SCHEMA ${d.catalog}.gold TO \`account users\`")
spark.sql("""CREATE OR REPLACE FUNCTION ${d.catalog}.silver.mask_text(v STRING)
  RETURN CASE WHEN is_account_group_member('data_stewards') THEN v ELSE '***' END""")
spark.sql("""CREATE OR REPLACE FUNCTION ${d.catalog}.silver.only_my_${c.cat.name}(v STRING)
  RETURN is_account_group_member('admins') OR v = '${c.cat.values[0]}'""")
# Apply after the silver table exists (Day 25):
# ALTER TABLE ${d.catalog}.silver.${c.table} SET ROW FILTER ${d.catalog}.silver.only_my_${c.cat.name} ON (${c.cat.name});
spark.sql("ALTER CATALOG ${d.catalog} SET TAGS ('domain' = '${d.name.replace(/'/g, '')}', 'pii' = '${d.enterprise.piiColumns.join(' ')}')")
display(spark.sql("SHOW GRANTS ON SCHEMA ${d.catalog}.gold"))`; },
  },
  BRONZE: {
    1: d => { const c = labCols(d); return `from pyspark.sql import functions as F

# An explicit schema: inferSchema would turn IDs like 0012 into 12 and read dates as strings.
schema = """${c.all.map(col => `${col.name} STRING`).join(', ')}"""   # bronze keeps everything as text, exactly as received
raw = (spark.read.option("header", True).schema(schema)
       .csv("/Volumes/${d.catalog}/bronze/raw_files/${c.table}.csv")
       .withColumn("_ingested_at", F.current_timestamp())
       .withColumn("_source_file", F.col("_metadata.file_path")))
raw.write.mode("append").saveAsTable("${d.catalog}.bronze.${c.table}_raw")
print(spark.table("${d.catalog}.bronze.${c.table}_raw").count())`; },
    2: d => `from pyspark.sql import functions as F
j = spark.read.json("/Volumes/${d.catalog}/bronze/raw_files/*.json")
j.printSchema()                                   # nested STRUCT and ARRAY fields stay nested in bronze
(j.withColumn("_ingested_at", F.current_timestamp())
   .write.mode("append").saveAsTable("${d.catalog}.bronze.${slug(d.sources.semi[0].name)}"))`,
    3: d => { const c = labCols(d); return `# Auto Loader: only new files are read; the checkpoint remembers what was loaded. Runs as a scheduled job.
(spark.readStream.format("cloudFiles")
   .option("cloudFiles.format", "csv").option("header", True)
   .option("cloudFiles.schemaLocation", "/Volumes/${d.catalog}/bronze/raw_files/_schemas/${c.table}")
   .option("cloudFiles.schemaEvolutionMode", "addNewColumns")
   .load("/Volumes/${d.catalog}/bronze/raw_files/")
   .selectExpr("*", "current_timestamp() AS _ingested_at", "_metadata.file_path AS _source_file")
   .writeStream.option("checkpointLocation", "/Volumes/${d.catalog}/bronze/raw_files/_checkpoints/${c.table}")
   .trigger(availableNow=True)
   .toTable("${d.catalog}.bronze.${c.table}_raw"))${isCritical(d) ? `

# Critical track: near-real-time. Count events per ${c.cat.name} in 5-minute windows, late data up to 10 minutes.
from pyspark.sql import functions as F
events = spark.readStream.table("${d.catalog}.bronze.${c.table}_raw").withColumn("event_time", F.col("_ingested_at"))
(events.withWatermark("event_time", "10 minutes")
   .groupBy(F.window("event_time", "5 minutes"), "${c.cat.name}").count()
   .writeStream.outputMode("append")
   .option("checkpointLocation", "/Volumes/${d.catalog}/bronze/raw_files/_checkpoints/${c.table}_5min")
   .trigger(processingTime="1 minute")
   .toTable("${d.catalog}.silver.${c.table}_5min_counts"))` : ''}`; },
    4: d => { const c = labCols(d); return `from delta.tables import DeltaTable
t = "${d.catalog}.bronze.${c.table}_raw"
print(spark.table(t).count(), "rows")
display(DeltaTable.forName(spark, t).history().select("version", "timestamp", "operation", "operationMetrics"))
display(spark.table(t).groupBy("_source_file").count())        # every row traces back to its file`; },
  },
  SILVER: {
    0: d => { const c = labCols(d); return `from pyspark.sql import functions as F
b = spark.table("${d.catalog}.bronze.${c.table}_raw")
profile = b.select(
    F.count("*").alias("rows"),
    F.countDistinct("${c.key.name}").alias("unique_keys"),
    *[F.sum(F.when(F.col(x).isNull() | (F.trim(F.col(x)) == ""), 1).otherwise(0)).alias(f"empty_{x}") for x in b.columns if not x.startswith("_")],
    F.sum(F.when(~F.col("${c.num.name}").rlike(r"^-?[0-9]+(\\.[0-9]+)?$"), 1).otherwise(0)).alias("non_numeric_${c.num.name}"))
display(profile)
display(b.groupBy("${c.cat.name}").count().orderBy(F.desc("count")))`; },
    1: d => { const c = labCols(d); return `from pyspark.sql import functions as F, Window
b = spark.table("${d.catalog}.bronze.${c.table}_raw")
latest = Window.partitionBy("${c.key.name}").orderBy(F.col("_ingested_at").desc())
deduped = b.withColumn("rn", F.row_number().over(latest)).filter("rn = 1").drop("rn")
print(b.count() - deduped.count(), "duplicate rows removed")`; },
    2: d => { const c = labCols(d); return `from pyspark.sql import functions as F
# One allowed value per category; anything else goes to quarantine, never silently changed.
allowed = ${JSON.stringify(c.cat.values)}
canon = {v.lower(): v for v in allowed}
mapping = F.create_map(*[F.lit(x) for kv in canon.items() for x in kv])
std = deduped.withColumn("${c.cat.name}", F.coalesce(mapping[F.lower(F.trim(F.col("${c.cat.name}")))], F.col("${c.cat.name}")))`; },
    3: d => { const c = labCols(d); const casts = c.all.map(col => `F.col("${col.name}").cast("${ddlType(col.type).toLowerCase()}").alias("${col.name}")`).join(',\n    '); return `from pyspark.sql import functions as F
typed = std.select(
    ${casts},
    "_ingested_at", "_source_file")
rules = {
    "valid_key": F.col("${c.key.name}").isNotNull(),
    "valid_${c.cat.name}": F.col("${c.cat.name}").isin(${JSON.stringify(c.cat.values)}),
    "numeric_${c.num.name}": F.col("${c.num.name}").isNotNull(),
    "valid_${c.date.name}": F.col("${c.date.name}").isNotNull(),
}
ok = F.lit(True)
for r in rules.values(): ok = ok & r
good, bad = typed.filter(ok), typed.filter(~ok)
reason = F.concat_ws(",", *[F.when(~r, F.lit(n)) for n, r in rules.items()])
bad.withColumn("failed_rules", reason).write.mode("append").saveAsTable("${d.catalog}.silver.${c.table}_quarantine")
print(good.count(), "good ·", bad.count(), "quarantined")`; },
    4: d => { const c = labCols(d); return `from delta.tables import DeltaTable
from pyspark.sql import functions as F
target = "${d.catalog}.silver.${c.table}"
src = good.withColumn("load_date", F.current_date()).withColumnRenamed("_source_file", "source_file").drop("_ingested_at")
if not spark.catalog.tableExists(target):
    src.limit(0).write.saveAsTable(target)
# MERGE: re-running the job never duplicates a ${c.key.name}; changed rows are updated.
(DeltaTable.forName(spark, target).alias("t")
   .merge(src.alias("s"), "t.${c.key.name} = s.${c.key.name}")
   .whenMatchedUpdateAll().whenNotMatchedInsertAll().execute())
spark.sql(f"COMMENT ON TABLE {target} IS 'Cleaned ${c.table}: one row per ${c.key.name}'")`; },
  },
  GOLD: {
    1: d => { const c = labCols(d); return `from pyspark.sql import functions as F
s = spark.table("${d.catalog}.silver.${c.table}")
days = s.select(F.min("${c.date.name}").alias("lo"), F.max("${c.date.name}").alias("hi"))
dim_date = (days.select(F.explode(F.sequence("lo", "hi")).alias("date"))
    .select("date", F.year("date").alias("year"), F.month("date").alias("month"),
            F.date_format("date", "MMM").alias("month_name"), F.dayofweek("date").alias("day_of_week")))
dim_date.write.mode("overwrite").saveAsTable("${d.catalog}.gold.dim_date")

# SCD Type 2 in PySpark: when ${c.cat.name} changes for a ${c.key.name}, close the old row and add a new current one.
from delta.tables import DeltaTable
dim = "${d.catalog}.gold.dim_${slug(d.entity)}"
cur = (s.select("${c.key.name}", "${c.cat.name}").dropDuplicates(["${c.key.name}"])
        .withColumn("valid_from", F.current_date()).withColumn("valid_to", F.lit(None).cast("date")).withColumn("is_current", F.lit(True)))
if not spark.catalog.tableExists(dim):
    cur.write.saveAsTable(dim)
else:
    (DeltaTable.forName(spark, dim).alias("t")
       .merge(cur.alias("s"), "t.${c.key.name} = s.${c.key.name} AND t.is_current")
       .whenMatchedUpdate(condition="t.${c.cat.name} <> s.${c.cat.name}", set={"is_current": "false", "valid_to": "current_date()"})
       .execute())
    still_open = spark.table(dim).filter("is_current").select("${c.key.name}")
    cur.join(still_open, "${c.key.name}", "left_anti").write.mode("append").saveAsTable(dim)`; },
    2: d => { const c = labCols(d); return `from pyspark.sql import functions as F
s = spark.table("${d.catalog}.silver.${c.table}")
# Every KPI calculated once, here, with the agreed formula (see the KPI tree from Day 3).
kpis = s.groupBy("${c.date.name}").agg(
    F.count("*").alias("rows_n"),
    F.countDistinct("${c.key.name}").alias("distinct_keys"),
    F.round(F.avg("${c.num.name}"), 2).alias("avg_${c.num.name}"),
    F.sum("${c.num.name}").alias("total_${c.num.name}"),
    (F.sum(F.when(F.col("${c.cat.name}") == "${c.cat.values[0]}", 1).otherwise(0)) / F.count("*")).alias("share_${slug(c.cat.values[0])}"))
kpis.write.mode("overwrite").saveAsTable("${d.catalog}.gold.${c.table}_daily_kpis")`; },
    3: d => `# Liquid clustering and statistics, then confirm the mart answers the main question quickly.
spark.sql("ALTER TABLE ${d.catalog}.gold.${d.gold.name} CLUSTER BY (${d.gold.columns.find(c => c.key)!.name})")
spark.sql("OPTIMIZE ${d.catalog}.gold.${d.gold.name}")
spark.sql("ANALYZE TABLE ${d.catalog}.gold.${d.gold.name} COMPUTE STATISTICS FOR ALL COLUMNS")
display(spark.table("${d.catalog}.gold.${d.gold.name}").limit(20))`,
  },
};

/* ───────── Reverse engineering: the legacy pipeline (Modules 4–6) ───────── */

/** The inherited nightly stored procedure (SQL Server). Shown without hints: the learner finds the problems. */
export function legacyProcedure(d: DomainSpec): string {
  const c = labCols(d); const [v0, v1] = [c.cat.values[0], c.cat.values[1] ?? c.cat.values[0]];
  return `CREATE PROCEDURE dbo.usp_daily_${c.table}_kpis AS
BEGIN
  TRUNCATE TABLE rpt.${c.table}_daily;
  INSERT INTO rpt.${c.table}_daily (day, rows_n, avg_${c.num.name}, share_${slug(v0)})
  SELECT CAST(${c.date.name} AS DATE),
         COUNT(${c.key.name}),
         AVG(ISNULL(TRY_CAST(${c.num.name} AS DECIMAL(14,2)), 0)),
         SUM(CASE WHEN ${c.cat.name} = '${v0}' THEN 1 ELSE 0 END) / COUNT(*)
  FROM stg.${c.table}
  WHERE ${c.date.name} >= '2024-04-01'
    AND ${c.cat.name} IN ('${v0}', '${v1}')
  GROUP BY CAST(${c.date.name} AS DATE);
END`;
}

/** The inherited, undocumented PySpark notebook that loads the file. */
export function legacyNotebook(d: DomainSpec): string {
  const c = labCols(d);
  return `df = spark.read.csv("/mnt/old_share/${c.table}.csv", header=True, inferSchema=True)
df = df.dropDuplicates()
df = df.na.fill(0)
df.write.mode("overwrite").saveAsTable("default.${c.table}")`;
}

/** The problems a careful reader should find, each provable with a query. */
export function legacyBugs(d: DomainSpec): { where: string; problem: string; prove: string }[] {
  const c = labCols(d); const [v0, v1] = [c.cat.values[0], c.cat.values[1] ?? c.cat.values[0]];
  const r = `${d.catalog}.bronze.${c.table}_raw`;
  return [
    { where: 'Procedure: TRUNCATE TABLE', problem: 'Every night the report history is wiped, so last month’s numbers can never be checked again.', prove: `-- Delta keeps history instead: DESCRIBE HISTORY ${d.catalog}.gold.${c.table}_daily_kpis;` },
    { where: `Procedure: COUNT(${c.key.name})`, problem: `Duplicate ${c.key.name} rows are counted twice.`, prove: `SELECT COUNT(*) - COUNT(DISTINCT ${c.key.name}) AS double_counted FROM ${r};` },
    { where: `Procedure: ISNULL(TRY_CAST(${c.num.name}), 0)`, problem: `Typos such as "AB" become 0 and pull the average down instead of being flagged.`, prove: `SELECT COUNT(*) AS typos_counted_as_zero FROM ${r} WHERE try_cast(${c.num.name} AS DOUBLE) IS NULL;` },
    { where: 'Procedure: SUM(…) / COUNT(*)', problem: 'Integer division: in SQL Server 37 / 120 is 0, so the share is always 0 or 1.', prove: `SELECT 37 / 120 AS sql_server_style, 37 / 120.0 AS correct;` },
    { where: `Procedure: WHERE ${c.date.name} >= '2024-04-01'`, problem: 'A hard-coded start date silently drops older data and must be changed by hand every year.', prove: `SELECT COUNT(*) AS rows_dropped FROM ${r} WHERE ${c.date.name} < '2024-04-01';` },
    { where: `Procedure: ${c.cat.name} IN ('${v0}', '${v1}')`, problem: `Every other ${c.cat.name} value disappears from the totals without a warning.`, prove: `SELECT ${c.cat.name}, COUNT(*) FROM ${r} WHERE ${c.cat.name} NOT IN ('${v0}', '${v1}') GROUP BY ${c.cat.name};` },
    { where: 'Notebook: inferSchema=True', problem: `IDs lose leading zeros and dates may be read as text.`, prove: `-- Compare: spark.read.csv(path, header=True, inferSchema=True).printSchema()` },
    { where: 'Notebook: dropDuplicates()', problem: `Only identical rows are removed; the same ${c.key.name} with one changed value survives twice.`, prove: `SELECT ${c.key.name}, COUNT(*) FROM ${r} GROUP BY ${c.key.name} HAVING COUNT(*) > 1;` },
    { where: 'Notebook: na.fill(0)', problem: 'Missing values become real zeros in every numeric column, so “unknown” looks like “none”.', prove: `SELECT COUNT(*) FROM ${r} WHERE ${c.num.name} IS NULL OR trim(${c.num.name}) = '';` },
    { where: 'Notebook: mode("overwrite") into default', problem: 'The table lives in the old Hive metastore with no Unity Catalog governance, lineage or history, and every run replaces it.', prove: `-- SHOW TABLES IN hive_metastore.default;  vs  SHOW TABLES IN ${d.catalog}.bronze;` },
  ];
}

/** Day number → the reverse-engineering section and extra steps for that day. */
export function legacyDay(d: DomainSpec, day: number): { steps: string[]; section: string } | null {
  if (!isAdvanced(d)) return null;
  const c = labCols(d);
  if (day === 16) return {
    steps: ['Read the legacy procedure and notebook below line by line. Do not change anything yet.', 'Write a rules table: for each line, what it does, the business rule behind it, and what could go wrong.', `Draw the legacy lineage: CSV on /mnt/old_share → default.${c.table} → stg.${c.table} → rpt.${c.table}_daily → the old report.`],
    section: ['## Reverse engineering: the pipeline you inherit', `The ${d.name} team has run this for five years. The person who wrote it has left, there is no documentation, and the numbers “have always looked a bit off”. Your job in Modules 4–6 is to understand it, prove what is wrong, and replace it in Databricks with Unity Catalog and PySpark.`, '', '### Legacy nightly stored procedure (SQL Server)', '```sql', legacyProcedure(d), '```', '', '### Legacy load notebook (no comments, no owner)', '```python', legacyNotebook(d), '```'].join('\n'),
  };
  if (day === 21) {
    const bugs = legacyBugs(d);
    return {
      steps: [`Find at least 8 of the ${bugs.length} problems in the legacy code before opening the list below.`, 'Prove each one with the query next to it on your own bronze data, and write down the number it changes.'],
      section: ['## Reverse engineering: prove what is wrong', '| Where | Problem | Prove it |', '|---|---|---|', ...bugs.map(b => `| ${b.where} | ${b.problem} | \`${b.prove.replace(/\|/g, '\\|').replace(/\n/g, ' ')}\` |`)].join('\n'),
    };
  }
  if (day === 26) return {
    steps: ['Map every legacy step to its replacement: /mnt CSV → Unity Catalog volume; default table → bronze; stg → silver; rpt → gold.', 'Keep each legacy business rule that is correct, and write why you drop or fix the others.', `Open Catalog Explorer → ${d.catalog}.gold → Lineage, and check your new lineage matches the design.`],
    section: ['## Reverse engineering: design the replacement', '| Legacy | Replacement in Databricks |', '|---|---|', `| /mnt/old_share/${c.table}.csv | /Volumes/${d.catalog}/bronze/raw_files/ (governed volume) |`, `| default.${c.table} (Hive, overwrite) | ${d.catalog}.bronze.${c.table}_raw (append, history) |`, `| stg.${c.table} | ${d.catalog}.silver.${c.table} (dedupe by key, typed, quarantine) |`, `| rpt.${c.table}_daily (TRUNCATE nightly) | ${d.catalog}.gold.${c.table}_daily_kpis (Delta history, time travel) |`, '| SQL Agent job | Databricks Workflow job (Module 9) |'].join('\n'),
  };
  if (day === 30) return {
    steps: ['Run the reconciliation below: legacy-style numbers next to your new gold numbers, per day.', 'Explain every difference by the legacy problem that causes it.', 'Write a one-page sign-off for the business owner: old number, new number, reason, and the date the old report is switched off.'],
    section: ['## Reverse engineering: reconcile old and new', '```python', `from pyspark.sql import functions as F
raw = spark.table("${d.catalog}.bronze.${c.table}_raw")
legacy = (raw.filter(F.col("${c.date.name}") >= "2024-04-01")
             .filter(F.col("${c.cat.name}").isin(${JSON.stringify(c.cat.values.slice(0, 2))}))
             .groupBy(F.col("${c.date.name}").alias("day"))
             .agg(F.count("${c.key.name}").alias("legacy_rows"),
                  F.avg(F.coalesce(F.expr("try_cast(${c.num.name} AS DOUBLE)"), F.lit(0.0))).alias("legacy_avg")))
new = spark.table("${d.catalog}.gold.${c.table}_daily_kpis").select(F.col("${c.date.name}").alias("day"), "rows_n", "avg_${c.num.name}")
diff = (new.join(legacy, "day", "full_outer")
           .withColumn("row_diff", F.col("rows_n") - F.col("legacy_rows"))
           .withColumn("avg_diff", F.round(F.col("avg_${c.num.name}") - F.col("legacy_avg"), 2))
           .orderBy("day"))
display(diff)`, '```'].join('\n'),
  };
  return null;
}

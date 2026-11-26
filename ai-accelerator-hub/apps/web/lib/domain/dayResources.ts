/**
 * "Go deeper" open-source repos for each course DAY (docs/DAY_SIDE_PANEL_SPEC.md v1.1 AC-5/AC-6). Pure and curated.
 * Every repo was checked on GitHub on 2026-11-27: it exists, is not archived and was updated recently (moved repos use
 * their new name). Two kinds: LEARN (exercises, sample databases, free books) and PROJECT (real open-source software
 * that uses today's idea, with its "good first issues" page, so a learner sees how professionals build it).
 * A day gets the repos whose tags best match its topic (Day 11 window functions → DuckDB, the Employees database…).
 */
export type Kind = 'learn' | 'project';
export type Repo = { repo: string; title: string; kind: Kind; why: string; tags: string[] };

export const CATALOG: Repo[] = [
  /* ---------- learn ---------- */
  { kind: 'learn', repo: 'microsoft/Data-Science-For-Beginners', title: 'Data Science for Beginners (Microsoft)', why: '20 short lessons with quizzes covering the whole data lifecycle.', tags: ['fundamentals', 'lifecycle', 'data-types', 'viz'] },
  { kind: 'learn', repo: 'awesomedata/awesome-public-datasets', title: 'Awesome Public Datasets', why: 'Free real datasets by topic, for practice beyond the course sample.', tags: ['datasets', 'capstone', 'fundamentals', 'messy'] },
  { kind: 'learn', repo: 'academic/awesome-datascience', title: 'Awesome Data Science', why: 'A map of the field: roles, tools and where to learn each.', tags: ['fundamentals', 'career'] },
  { kind: 'learn', repo: 'lerocha/chinook-database', title: 'Chinook sample database', why: 'A music-shop database for SQLite, MySQL and Postgres: rerun today’s queries on new data.', tags: ['sql', 'select', 'filter', 'aggregate', 'join', 'cte', 'window'] },
  { kind: 'learn', repo: 'XD-DENG/SQL-exercise', title: 'SQL exercises with answers', why: 'Graded exercises from SELECT and WHERE to joins and GROUP BY, each with a solution.', tags: ['sql', 'select', 'filter', 'aggregate', 'join'] },
  { kind: 'learn', repo: 'pthom/northwind_psql', title: 'Northwind database for Postgres', why: 'The classic orders–customers–products database: perfect for joins and keys.', tags: ['sql', 'join', 'aggregate', 'normalize', 'star'] },
  { kind: 'learn', repo: 'datacharmer/test_db', title: 'Employees sample database', why: '300,000 employee rows with salary history: try ranking and running totals at scale.', tags: ['sql', 'aggregate', 'window', 'scd'] },
  { kind: 'learn', repo: 'jOOQ/sakila', title: 'Sakila sample database', why: 'A DVD-rental database with 16 linked tables: see how one sheet becomes many tables.', tags: ['sql', 'join', 'normalize'] },
  { kind: 'learn', repo: 'mattm/sql-style-guide', title: 'SQL style guide', why: 'How to lay out CTEs and long queries so a teammate can review them.', tags: ['sql', 'cte', 'modeling'] },
  { kind: 'learn', repo: 'Asabeneh/30-Days-Of-Python', title: '30 Days of Python', why: 'One topic a day with exercises: variables, if, loops, lists, dictionaries, functions.', tags: ['python', 'basics', 'conditionals', 'loops', 'structures', 'functions'] },
  { kind: 'learn', repo: 'trekhleb/learn-python', title: 'Learn Python playground', why: 'Small runnable scripts with tests for every Python basic: change them and see what breaks.', tags: ['python', 'basics', 'conditionals', 'loops', 'structures', 'functions'] },
  { kind: 'learn', repo: 'jakevdp/PythonDataScienceHandbook', title: 'Python Data Science Handbook', why: 'The free book as notebooks: NumPy, pandas, charts and first models.', tags: ['python', 'numpy', 'pandas', 'viz', 'ml'] },
  { kind: 'learn', repo: 'rougier/numpy-100', title: '100 NumPy exercises', why: 'Bite-sized drills for maths on whole arrays, with hints and answers.', tags: ['numpy'] },
  { kind: 'learn', repo: 'guipsamora/pandas_exercises', title: 'pandas exercises', why: 'Real datasets with step-by-step tasks: filter, group, merge, clean, plot.', tags: ['pandas', 'groupby', 'cleaning', 'eda', 'join'] },
  { kind: 'learn', repo: 'realpython/materials', title: 'Real Python materials', why: 'The example projects behind Real Python’s tutorials, from functions to pandas.', tags: ['python', 'functions', 'pandas'] },
  { kind: 'learn', repo: 'AllenDowney/ThinkStats2', title: 'Think Stats', why: 'Statistics for programmers in Python: distributions, relationships, regression.', tags: ['eda', 'regression', 'story'] },
  { kind: 'learn', repo: 'microsoft/powerbi-desktop-samples', title: 'Power BI Desktop samples (Microsoft)', why: 'Official .pbix reports: open one, take it apart and rebuild a page.', tags: ['powerbi', 'dashboard', 'dax', 'star', 'powerquery'] },
  { kind: 'learn', repo: 'microsoft/fabric-samples', title: 'Microsoft Fabric samples', why: 'Microsoft Learn sample data and semantic models: star schemas, DAX measures and reports to rebuild.', tags: ['powerbi', 'dax', 'star', 'powerquery', 'dashboard'] },
  { kind: 'learn', repo: 'microsoft/generative-ai-for-beginners', title: 'Generative AI for Beginners (Microsoft)', why: '21 lessons on what AI models can do, prompting and using them safely.', tags: ['ai', 'prompt', 'privacy'] },
  { kind: 'learn', repo: 'dair-ai/Prompt-Engineering-Guide', title: 'Prompt Engineering Guide', why: 'Prompt patterns with examples: role, context, format, examples, checks.', tags: ['prompt', 'ai'] },
  { kind: 'learn', repo: 'anthropics/claude-cookbooks', title: 'Claude cookbooks (Anthropic)', why: 'Notebooks for extracting data, cleaning text and summarising tables with an AI model.', tags: ['ai', 'prompt', 'ai-clean', 'report'] },
  { kind: 'learn', repo: 'openai/openai-cookbook', title: 'OpenAI cookbook', why: 'Recipes for structured output and checking AI answers against data.', tags: ['ai', 'prompt', 'report'] },
  { kind: 'learn', repo: 'microsoft/ML-For-Beginners', title: 'ML for Beginners (Microsoft)', why: '26 lessons of classic machine learning with scikit-learn, with quizzes.', tags: ['ml', 'train-test', 'regression', 'classification', 'clustering'] },
  { kind: 'learn', repo: 'ageron/handson-ml3', title: 'Hands-on Machine Learning notebooks', why: 'The notebooks of the well-known book: split, train, evaluate, avoid leakage.', tags: ['ml', 'train-test', 'regression', 'classification', 'clustering'] },
  { kind: 'learn', repo: 'rasbt/machine-learning-book', title: 'Machine Learning with PyTorch and scikit-learn', why: 'Chapter-by-chapter code from a modern ML book, including model evaluation.', tags: ['ml', 'classification', 'train-test', 'explain'] },
  { kind: 'learn', repo: 'DataTalksClub/data-engineering-zoomcamp', title: 'Data Engineering Zoomcamp', why: 'A free course on moving data: ingestion, warehouses, Spark and orchestration.', tags: ['etl', 'orchestrate', 'extract', 'lakehouse', 'spark', 'ingest'] },
  { kind: 'learn', repo: 'dbt-labs/jaffle-shop', title: 'Jaffle Shop (dbt sandbox)', why: 'A small shop project showing raw → staging → business tables, like Bronze → Gold.', tags: ['modeling', 'star', 'cte', 'transform', 'scd', 'etl', 'quality'] },
  { kind: 'learn', repo: 'databricks/LearningSparkV2', title: 'Learning Spark notebooks', why: 'The code of the Learning Spark book: DataFrames and Spark SQL step by step.', tags: ['spark', 'lakehouse', 'ingest'] },
  { kind: 'learn', repo: 'databricks-demos/dbdemos', title: 'dbdemos (Databricks)', why: 'Install a full lakehouse demo in one line: Bronze, Silver, Gold, dashboards and ML.', tags: ['lakehouse', 'catalog', 'ingest', 'modeling', 'dashboard'] },
  { kind: 'learn', repo: 'alexeygrigorev/data-science-interviews', title: 'Data science interview questions', why: 'Theory, SQL and Python questions asked in real interviews, with answers.', tags: ['career', 'capstone', 'sql', 'ml'] },
  { kind: 'learn', repo: 'Ebazhanov/linkedin-skill-assessments-quizzes', title: 'LinkedIn skill assessment quizzes', why: 'Practise the SQL, Excel, Python and Power BI quizzes recruiters see.', tags: ['career'] },

  /* ---------- real open-source projects ---------- */
  { kind: 'project', repo: 'OpenRefine/OpenRefine', title: 'OpenRefine', why: 'A free tool journalists and librarians use to clean messy data: see what “messy” means at scale.', tags: ['messy', 'cleaning', 'data-types', 'fundamentals'] },
  { kind: 'project', repo: 'dathere/qsv', title: 'qsv', why: 'A fast command-line toolkit for CSV files: count, sort, join and check big CSVs.', tags: ['csv', 'cleaning', 'excel'] },
  { kind: 'project', repo: 'frictionlessdata/frictionless-py', title: 'Frictionless', why: 'Describes and validates tables (column types, required fields) the way open-data teams do.', tags: ['csv', 'validation', 'quality', 'data-types', 'lifecycle'] },
  { kind: 'project', repo: 'drawdb-io/drawdb', title: 'drawDB', why: 'Draw tables and keys in the browser and get the CREATE TABLE SQL.', tags: ['normalize', 'star', 'modeling'] },
  { kind: 'project', repo: 'sqlitebrowser/sqlitebrowser', title: 'DB Browser for SQLite', why: 'The desktop app many learners use to open a database, browse tables and run SQL.', tags: ['sql', 'select', 'filter', 'normalize', 'csv'] },
  { kind: 'project', repo: 'duckdb/duckdb', title: 'DuckDB', why: 'The fast analytics database analysts run on a laptop; its docs show every window function.', tags: ['sql', 'window', 'cte', 'aggregate', 'csv', 'filter'] },
  { kind: 'project', repo: 'tobymao/sqlglot', title: 'SQLGlot', why: 'Reads any SQL and translates it between dialects: see how a query with joins is parsed.', tags: ['sql', 'select', 'join', 'cte'] },
  { kind: 'project', repo: 'dbeaver/dbeaver', title: 'DBeaver', why: 'The free database client used at work: connect, browse keys and visualise joins.', tags: ['sql', 'join', 'normalize'] },
  { kind: 'project', repo: 'sqlfluff/sqlfluff', title: 'SQLFluff', why: 'The SQL style checker teams run in code review.', tags: ['sql', 'cte', 'modeling', 'quality'] },
  { kind: 'project', repo: 'Textualize/rich', title: 'Rich', why: 'A popular Python library for neat terminal output: read real loops, ifs and functions.', tags: ['python', 'basics', 'loops', 'conditionals'] },
  { kind: 'project', repo: 'pydantic/pydantic', title: 'Pydantic', why: 'Checks that records have the right fields and types: a professional “checker robot”.', tags: ['functions', 'validation', 'structures'] },
  { kind: 'project', repo: 'jupyter/notebook', title: 'Jupyter Notebook', why: 'The notebook analysts write Python in, open source and community-run.', tags: ['python', 'basics', 'capstone'] },
  { kind: 'project', repo: 'numpy/numpy', title: 'NumPy', why: 'The library behind fast maths on whole arrays in Python.', tags: ['numpy'] },
  { kind: 'project', repo: 'pandas-dev/pandas', title: 'pandas', why: 'The table library you use: read its issues to see real data problems people hit.', tags: ['pandas', 'groupby', 'cleaning', 'join', 'missing'] },
  { kind: 'project', repo: 'pola-rs/polars', title: 'Polars', why: 'A newer, very fast DataFrame library: the same group and join ideas, at speed.', tags: ['pandas', 'groupby', 'join'] },
  { kind: 'project', repo: 'ResidentMario/missingno', title: 'missingno', why: 'Draws where values are missing in a table, in one line.', tags: ['missing', 'eda', 'cleaning'] },
  { kind: 'project', repo: 'Data-Centric-AI-Community/fg-data-profiling', title: 'Data profiling (ydata)', why: 'One line gives a full report of a table: types, missing values, outliers.', tags: ['eda', 'missing', 'quality'] },
  { kind: 'project', repo: 'unionai-oss/pandera', title: 'Pandera', why: 'Write rules for a DataFrame (“salary above 0”) and test every new file against them.', tags: ['validation', 'cleaning', 'quality'] },
  { kind: 'project', repo: 'mwaskom/seaborn', title: 'seaborn', why: 'Statistical charts from pandas in one line: trends, distributions, comparisons.', tags: ['viz', 'eda', 'story'] },
  { kind: 'project', repo: 'plotly/plotly.py', title: 'Plotly', why: 'Interactive charts from Python, used in dashboards and reports.', tags: ['viz', 'dashboard', 'story'] },
  { kind: 'project', repo: 'streamlit/streamlit', title: 'Streamlit', why: 'Turn a Python analysis into a web app: a strong way to show a capstone.', tags: ['dashboard', 'capstone', 'viz'] },
  { kind: 'project', repo: 'metabase/metabase', title: 'Metabase', why: 'Open-source BI used by thousands of companies: questions, dashboards, alerts.', tags: ['dashboard', 'sql', 'viz', 'story'] },
  { kind: 'project', repo: 'apache/superset', title: 'Apache Superset', why: 'Open-source BI from Airbnb: charts and dashboards on SQL databases.', tags: ['dashboard', 'viz', 'sql'] },
  { kind: 'project', repo: 'evidence-dev/evidence', title: 'Evidence', why: 'Reports written in SQL and Markdown: the analysis and the story in one file.', tags: ['dashboard', 'report', 'sql', 'story'] },
  { kind: 'project', repo: 'sql-bi/Bravo', title: 'Bravo for Power BI', why: 'Free SQLBI tool: format DAX, check model size, export data from Power BI.', tags: ['powerbi', 'dax', 'powerquery'] },
  { kind: 'project', repo: 'TabularEditor/TabularEditor', title: 'Tabular Editor 2', why: 'The open-source editor pros use for Power BI models, measures and relationships.', tags: ['powerbi', 'dax', 'star'] },
  { kind: 'project', repo: 'microsoft/Analysis-Services', title: 'Analysis Services samples (Microsoft)', why: 'Includes the Best Practice Rules that check a Power BI model’s design.', tags: ['powerbi', 'dax', 'star'] },
  { kind: 'project', repo: 'pbi-tools/pbi-tools', title: 'pbi-tools', why: 'How teams keep Power BI reports in Git and review changes.', tags: ['powerbi', 'dashboard'] },
  { kind: 'project', repo: 'ollama/ollama', title: 'Ollama', why: 'Run AI models on your own computer, so private data never leaves it.', tags: ['ai', 'privacy', 'prompt'] },
  { kind: 'project', repo: 'data-privacy-stack/presidio', title: 'Presidio', why: 'Finds and masks names, phone numbers and IDs before data goes to an AI tool.', tags: ['privacy', 'ai-clean', 'cleaning'] },
  { kind: 'project', repo: 'sinaptik-ai/pandas-ai', title: 'PandasAI', why: 'Ask questions of a table in plain language, and see how the AI writes the code.', tags: ['ai', 'ai-clean', 'pandas'] },
  { kind: 'project', repo: 'scikit-learn/scikit-learn', title: 'scikit-learn', why: 'The machine-learning library used in the course: read how train/test split is built.', tags: ['ml', 'train-test', 'regression', 'classification', 'clustering'] },
  { kind: 'project', repo: 'dmlc/xgboost', title: 'XGBoost', why: 'The model that wins many prediction contests: churn and sales forecasts at work.', tags: ['classification', 'regression'] },
  { kind: 'project', repo: 'shap/shap', title: 'SHAP', why: 'Explains why a model predicted what it did, feature by feature.', tags: ['explain', 'classification'] },
  { kind: 'project', repo: 'mlflow/mlflow', title: 'MLflow', why: 'Track every model you train, its data and its score, as ML teams do.', tags: ['ml', 'train-test'] },
  { kind: 'project', repo: 'evidentlyai/evidently', title: 'Evidently', why: 'Tests a model and its data for drift after it goes live.', tags: ['ml', 'quality', 'classification'] },
  { kind: 'project', repo: 'airbytehq/airbyte', title: 'Airbyte', why: 'Hundreds of connectors that copy data from apps and databases: Extract, at scale.', tags: ['extract', 'etl', 'ingest'] },
  { kind: 'project', repo: 'dlt-hub/dlt', title: 'dlt (data load tool)', why: 'Load data from an API or file into a database with a few lines of Python.', tags: ['extract', 'ingest', 'etl'] },
  { kind: 'project', repo: 'apache/airflow', title: 'Apache Airflow', why: 'Schedules pipelines: run extract, then transform, then load, every night.', tags: ['orchestrate', 'etl'] },
  { kind: 'project', repo: 'dagster-io/dagster', title: 'Dagster', why: 'A modern pipeline tool that shows every table a pipeline builds and checks.', tags: ['orchestrate', 'etl', 'quality', 'transform'] },
  { kind: 'project', repo: 'dbt-labs/dbt', title: 'dbt', why: 'Builds tested business tables from SQL; its snapshots keep history (SCD type 2).', tags: ['modeling', 'transform', 'scd', 'cte', 'star'] },
  { kind: 'project', repo: 'fivetran/great_expectations', title: 'Great Expectations', why: 'Data-quality checks (“totals match”, “no empty IDs”) that run on every load.', tags: ['quality', 'validation', 'reconcile', 'cleaning'] },
  { kind: 'project', repo: 'sodadata/soda-core', title: 'Soda Core', why: 'Data contracts: write what a table must look like and catch breaks early.', tags: ['quality', 'reconcile'] },
  { kind: 'project', repo: 'apache/spark', title: 'Apache Spark', why: 'The engine under Databricks: SQL and DataFrames on data too big for one computer.', tags: ['spark', 'lakehouse', 'ingest'] },
  { kind: 'project', repo: 'delta-io/delta', title: 'Delta Lake', why: 'The table format under every Databricks table: versions, time travel, MERGE.', tags: ['lakehouse', 'scd', 'modeling', 'ingest'] },
  { kind: 'project', repo: 'apache/iceberg', title: 'Apache Iceberg', why: 'The other big open table format: see how lakehouse tables are designed.', tags: ['lakehouse'] },
  { kind: 'project', repo: 'unitycatalog/unitycatalog', title: 'Unity Catalog (open source)', why: 'Catalogs, schemas, tables and permissions: run it on your own laptop.', tags: ['catalog', 'lakehouse'] },
];

export type Topic = 'fundamentals' | 'sql' | 'python' | 'analytics' | 'powerbi' | 'ai' | 'ml' | 'etl' | 'lakehouse' | 'modeling' | 'capstone';
const TOPIC_TAG: Record<Topic, string[]> = {
  fundamentals: ['fundamentals'], sql: ['sql'], python: ['python'], analytics: ['pandas', 'eda'], powerbi: ['powerbi'], ai: ['ai'],
  ml: ['ml'], etl: ['etl', 'quality'], lakehouse: ['lakehouse'], modeling: ['modeling'], capstone: ['capstone', 'career'],
};

/** Which module a level is, from its code and title (DA02_SQL, AGR_M7_POWER_BI, "SQL for …"). */
export function topicOf(levelCode: string, title = ''): Topic {
  const s = `${levelCode} ${title}`.toUpperCase();
  if (/CAPSTONE|CAREER|INTERVIEW|READINESS/.test(s)) return 'capstone';
  if (/POWER[ _]?BI|DASHBOARD/.test(s)) return 'powerbi';
  if (/ETL|DATA[ _]QUALITY|PIPELINE|SILVER|CLEANS/.test(s)) return 'etl';
  if (/GOLD|BUSINESS-READY/.test(s)) return 'modeling';
  if (/UNITY|DATABRICKS|BRONZE|LAKEHOUSE|INGEST/.test(s)) return 'lakehouse';
  if (/MACHINE[ _]LEARNING|_ML\b|\bML\b/.test(s)) return 'ml';
  if (/\bAI\b|_AI_|_AI\b|GENERATIVE|PROMPT/.test(s)) return 'ai';
  if (/PYTHON[ _]ANALYTICS|PANDAS|EDA/.test(s)) return 'analytics';
  if (/PYTHON/.test(s)) return 'python';
  if (/SQL/.test(s)) return 'sql';
  return 'fundamentals';
}

/** The Data Analytics course, day by day (docs/data-analytics-journey/days). */
const DA_DAY: Record<number, string[]> = {
  1: ['fundamentals', 'lifecycle'], 2: ['data-types', 'messy'], 3: ['lifecycle', 'messy'], 4: ['csv', 'excel'], 5: ['normalize'],
  6: ['select'], 7: ['filter'], 8: ['aggregate'], 9: ['join'], 10: ['cte'], 11: ['window'],
  12: ['basics'], 13: ['conditionals'], 14: ['loops'], 15: ['structures'], 16: ['functions', 'validation'], 17: ['numpy'],
  18: ['pandas'], 19: ['eda', 'missing'], 20: ['cleaning', 'missing'], 21: ['groupby', 'join'], 22: ['viz', 'story'],
  23: ['powerbi', 'dashboard'], 24: ['powerquery', 'cleaning'], 25: ['star'], 26: ['dax'], 27: ['dashboard', 'viz'],
  28: ['ai'], 29: ['prompt'], 30: ['ai-clean', 'privacy'], 31: ['report', 'privacy'],
  32: ['ml'], 33: ['train-test'], 34: ['regression'], 35: ['classification', 'explain'], 36: ['clustering'],
  37: ['etl', 'orchestrate'], 38: ['extract'], 39: ['transform'], 40: ['scd'], 41: ['reconcile', 'quality'],
  42: ['capstone', 'datasets'], 43: ['cleaning', 'quality'], 44: ['dashboard', 'story'], 45: ['career', 'story'],
};
/** Other courses: today's topic from the day's title. */
const WORDS: [RegExp, string[]][] = [
  [/\bjoin|match(ing)? two/i, ['join']], [/window|rank/i, ['window']], [/group|aggregat|total|sum\b/i, ['aggregate', 'groupby']],
  [/\bcte\b|in steps|subquer/i, ['cte']], [/filter|where\b|picking only/i, ['filter']], [/select|asking the database/i, ['select']],
  [/clean|standardis|tidy|silver/i, ['cleaning', 'quality']], [/ingest|bronze|raw data|load/i, ['ingest']],
  [/unity|catalog|schema|permission/i, ['catalog']], [/gold|kpi|mart|star/i, ['modeling', 'star']],
  [/dashboard|power bi|visual|chart/i, ['dashboard', 'viz']], [/\bdax\b|measure/i, ['dax']],
  [/predict|machine learning|model|forecast/i, ['ml']], [/churn|classif|who will leave/i, ['classification']], [/cluster|segment/i, ['clustering']],
  [/\bai\b|genie|llm|prompt|assistant/i, ['ai', 'prompt']], [/privacy|personal data|pii|trust/i, ['privacy']],
  [/collect|semi-structured|json|api|source/i, ['extract']], [/quality|expectation|check|reconcil/i, ['quality', 'reconcile']],
  [/spark|pyspark|notebook/i, ['spark']], [/frame|problem|question|lifecycle/i, ['lifecycle']],
  [/capstone|present|interview|story/i, ['capstone', 'story']], [/pandas|dataframe/i, ['pandas']], [/explor|eda|profil/i, ['eda']],
];

/** Today's topic tags first, then the module's. */
export function dayTags(levelCode: string, levelTitle: string, day: number, dayTitle = ''): { own: string[]; mod: string[] } {
  const mod = TOPIC_TAG[topicOf(levelCode, levelTitle)];
  const own = /^DA\d{2}_/.test(levelCode) && DA_DAY[day] ? DA_DAY[day] : [...new Set(WORDS.filter(([re]) => re.test(dayTitle)).flatMap(([, t]) => t))];
  return { own, mod };
}

/** Readable name of today's topic, for "For today: window functions". */
const LABEL: Record<string, string> = {
  select: 'SELECT and ORDER BY', filter: 'filtering rows', aggregate: 'totals and GROUP BY', join: 'joins', cte: 'CTEs and step-by-step queries',
  window: 'window functions', basics: 'Python basics', conditionals: 'if / else', loops: 'loops', structures: 'lists and dictionaries',
  functions: 'functions', validation: 'data validation', numpy: 'NumPy', pandas: 'pandas', eda: 'exploring a table', missing: 'missing values',
  cleaning: 'data cleaning', groupby: 'grouping', viz: 'charts', story: 'data storytelling', powerbi: 'Power BI', powerquery: 'Power Query',
  star: 'star schema', dax: 'DAX measures', dashboard: 'dashboards', ai: 'AI for data', prompt: 'prompting', 'ai-clean': 'cleaning with AI',
  privacy: 'privacy', report: 'AI-written reports', ml: 'machine learning', 'train-test': 'train and test', regression: 'regression',
  classification: 'classification', explain: 'explaining models', clustering: 'clustering', etl: 'ETL', orchestrate: 'pipelines',
  extract: 'extracting data', transform: 'transforming data', scd: 'history tables (SCD type 2)', reconcile: 'reconciliation',
  quality: 'data quality', capstone: 'your capstone', datasets: 'choosing a dataset', career: 'interviews', fundamentals: 'data basics',
  lifecycle: 'the analytics lifecycle', 'data-types': 'kinds of data', messy: 'messy data', csv: 'CSV files', excel: 'spreadsheets',
  normalize: 'tables and keys', lakehouse: 'the lakehouse', catalog: 'Unity Catalog', ingest: 'ingestion', spark: 'Spark', modeling: 'business tables',
  sql: 'SQL', python: 'Python',
};

export type DayRepo = { repo: string; title: string; why: string; kind: Kind; url: string; contribute?: string };

/** AC-6: 2 repos to learn from and 2 real projects that best match today's topic (today's tags count 3, the module's 1). */
export function reposForDay(levelCode: string, levelTitle: string, day: number, dayTitle = '', n = 2): { topic: string; learn: DayRepo[]; projects: DayRepo[] } {
  const { own, mod } = dayTags(levelCode, levelTitle, day, dayTitle);
  const score = (r: Repo) => r.tags.reduce((s, t) => s + (own.includes(t) ? 3 : mod.includes(t) ? 1 : 0), 0);
  const pick = (kind: Kind) => CATALOG.map((r, i) => ({ r, i, s: score(r) })).filter(x => x.r.kind === kind && x.s > 0).sort((a, b) => b.s - a.s || a.i - b.i).slice(0, n).map(x => x.r);
  const out = (r: Repo): DayRepo => ({ repo: r.repo, title: r.title, why: r.why, kind: r.kind, url: `https://github.com/${r.repo}`, ...(r.kind === 'project' ? { contribute: `https://github.com/${r.repo}/contribute` } : {}) });
  const first = own[0] ?? mod[0];
  return { topic: LABEL[first] ?? first, learn: pick('learn').map(out), projects: pick('project').map(out) };
}

/** v1.0 compatibility: module-level picks. */
export const reposFor = (levelCode: string, title?: string, n = 3) => { const r = reposForDay(levelCode, title ?? '', 0, '', n); return [...r.learn, ...r.projects].slice(0, n); };

/**
 * "Go deeper" open-source repos for a course module (docs/DAY_SIDE_PANEL_SPEC.md AC-5). Pure and curated: each repo was
 * checked on GitHub (exists, not archived, maintained) on 2026-11-27. Picked for a beginner-to-job-ready data analyst:
 * practice data, exercises, and the tools a team really uses, never a random awesome-list dump.
 */
export type Repo = { repo: string; title: string; why: string };
export type Topic = 'fundamentals' | 'sql' | 'python' | 'analytics' | 'powerbi' | 'ai' | 'ml' | 'etl' | 'lakehouse' | 'modeling' | 'capstone';

export const REPOS: Record<Topic, Repo[]> = {
  fundamentals: [
    { repo: 'microsoft/Data-Science-For-Beginners', title: 'Data Science for Beginners (Microsoft)', why: '20 short lessons with quizzes: the whole lifecycle you meet in this module.' },
    { repo: 'awesomedata/awesome-public-datasets', title: 'Awesome Public Datasets', why: 'Free real datasets by topic, for practising on data that is not a sample.' },
    { repo: 'academic/awesome-datascience', title: 'Awesome Data Science', why: 'A map of the field: roles, tools and where to learn each.' },
  ],
  sql: [
    { repo: 'lerocha/chinook-database', title: 'Chinook database', why: 'A small music-shop database for SQLite, MySQL and Postgres: practise every query from today on it.' },
    { repo: 'XD-DENG/SQL-exercise', title: 'SQL exercises with answers', why: 'Graded exercises from SELECT to joins and grouping, each with a solution to check yourself.' },
    { repo: 'datacharmer/test_db', title: 'Employees sample database', why: '300,000 employee rows: see how your query behaves on data bigger than a sheet.' },
    { repo: 'sqlfluff/sqlfluff', title: 'SQLFluff', why: 'The SQL style checker teams use in code review: learn to write SQL others can read.' },
  ],
  python: [
    { repo: 'jakevdp/PythonDataScienceHandbook', title: 'Python Data Science Handbook', why: 'The free book as notebooks: Python, NumPy and pandas explained with runnable code.' },
    { repo: 'rougier/numpy-100', title: '100 NumPy exercises', why: 'Bite-sized drills from easy to hard, with hints and answers.' },
    { repo: 'TheAlgorithms/Python', title: 'The Algorithms: Python', why: 'Read clean code for loops, lists and functions you are learning now.' },
  ],
  analytics: [
    { repo: 'guipsamora/pandas_exercises', title: 'pandas exercises', why: 'Real datasets with step-by-step pandas tasks and solutions: filter, group, merge, plot.' },
    { repo: 'Data-Centric-AI-Community/fg-data-profiling', title: 'Data profiling (ydata)', why: 'One line gives a full EDA report of a DataFrame: missing values, outliers, correlations.' },
    { repo: 'plotly/plotly.py', title: 'Plotly for Python', why: 'Interactive charts from pandas in a few lines, used in dashboards and reports.' },
  ],
  powerbi: [
    { repo: 'microsoft/powerbi-desktop-samples', title: 'Power BI Desktop samples (Microsoft)', why: 'Official .pbix reports and datasets to open, take apart and rebuild.' },
    { repo: 'awesomedata/awesome-public-datasets', title: 'Awesome Public Datasets', why: 'Find a dataset for your own dashboard, beyond the course sample.' },
    { repo: 'pbi-tools/pbi-tools', title: 'pbi-tools', why: 'For later: how teams keep Power BI reports in Git and review changes.' },
  ],
  ai: [
    { repo: 'microsoft/generative-ai-for-beginners', title: 'Generative AI for Beginners (Microsoft)', why: '21 lessons on prompting, safety and building with AI models.' },
    { repo: 'anthropics/claude-cookbooks', title: 'Claude cookbooks (Anthropic)', why: 'Worked notebooks: extracting data, summarising tables, checking AI answers.' },
    { repo: 'openai/openai-cookbook', title: 'OpenAI cookbook', why: 'Recipes for structured output and working with data through an AI API.' },
  ],
  ml: [
    { repo: 'microsoft/ML-For-Beginners', title: 'ML for Beginners (Microsoft)', why: '26 lessons of classic machine learning with scikit-learn, with quizzes.' },
    { repo: 'ageron/handson-ml3', title: 'Hands-on Machine Learning notebooks', why: 'The notebooks of the well-known book: train, evaluate and avoid leakage.' },
    { repo: 'AllenDowney/ThinkStats2', title: 'Think Stats', why: 'Statistics for programmers, in Python: the numbers behind every model.' },
  ],
  etl: [
    { repo: 'DataTalksClub/data-engineering-zoomcamp', title: 'Data Engineering Zoomcamp', why: 'A free course on pipelines, warehouses and orchestration: where ETL goes next.' },
    { repo: 'Data-Centric-AI-Community/fg-data-profiling', title: 'Data profiling (ydata)', why: 'Profile a table before and after cleaning to prove the quality improved.' },
    { repo: 'fivetran/great_expectations', title: 'Great Expectations', why: 'Write data-quality checks ("no empty IDs", "price above 0") that run on every load.' },
    { repo: 'sqlfluff/sqlfluff', title: 'SQLFluff', why: 'Lint the SQL in your pipeline the way data teams do.' },
  ],
  lakehouse: [
    { repo: 'databricks-demos/dbdemos', title: 'dbdemos (Databricks)', why: 'Install a full lakehouse demo into your workspace in one line: Bronze, Silver, Gold and dashboards.' },
    { repo: 'delta-io/delta', title: 'Delta Lake', why: 'The table format under every Databricks table: versions, time travel, MERGE.' },
    { repo: 'unitycatalog/unitycatalog', title: 'Unity Catalog (open source)', why: 'How catalogs, schemas, tables and permissions work, run on your own laptop.' },
    { repo: 'databricks/LearningSparkV2', title: 'Learning Spark notebooks', why: 'The code of the Learning Spark book: DataFrames and Spark SQL, step by step.' },
  ],
  modeling: [
    { repo: 'dbt-labs/dbt', title: 'dbt', why: 'How analytics teams build tested, documented Gold tables from SQL.' },
    { repo: 'delta-io/delta', title: 'Delta Lake', why: 'MERGE and versioned tables, for Gold tables that update safely.' },
    { repo: 'sqlfluff/sqlfluff', title: 'SQLFluff', why: 'Keep the SQL behind your KPI tables readable and reviewable.' },
  ],
  capstone: [
    { repo: 'alexeygrigorev/data-science-interviews', title: 'Data science interview questions', why: 'Theory and SQL/Python questions asked in real interviews, with answers.' },
    { repo: 'awesomedata/awesome-public-datasets', title: 'Awesome Public Datasets', why: 'Pick a capstone dataset that matches the job you want.' },
    { repo: 'Ebazhanov/linkedin-skill-assessments-quizzes', title: 'LinkedIn skill assessment quizzes', why: 'Practise the SQL, Excel, Python and Power BI quizzes recruiters see.' },
  ],
};

/** Which module a level is, from its code and title (DA02_SQL, AGRI02_SQL, "SQL for …"). */
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

export const reposFor = (levelCode: string, title?: string, n = 3) => REPOS[topicOf(levelCode, title)].slice(0, n).map(r => ({ ...r, url: `https://github.com/${r.repo}` }));

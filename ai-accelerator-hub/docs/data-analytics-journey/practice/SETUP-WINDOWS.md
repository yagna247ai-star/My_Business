# Windows Setup — From Zero to Your First Query

> **Status:** written from the standard Windows installers and the commands in this pack. Not yet run end-to-end on a Windows machine. The Mac commands are the same, except where marked.

Time needed: about 60–90 minutes, mostly downloads. You only do this once.

## What you will install
| Tool | Why | Cost |
|---|---|---|
| Python 3.12 or newer | runs the Python labs | Free |
| VS Code | the editor you write code in | Free |
| DB Browser for SQLite | run SQL with buttons, and see tables | Free |
| Power BI Desktop | dashboards (Module 5) | Free |
| pandas (a Python package) | tables in Python (Module 4) | Free |

## Step 1 — Make a work folder
1. Open **File Explorer**.
2. Go to `C:\` and make a folder called `AnalyticsCourse`.
3. Copy the `practice` folder from this course into it, so you have `C:\AnalyticsCourse\practice`.

## Step 2 — Install Python
1. Go to **python.org/downloads** and download the latest Python 3.12 (or newer) Windows installer.
2. Run it. **Tick "Add python.exe to PATH"** at the bottom of the first screen. This step is easy to miss.
3. Click **Install Now**. Wait for it to finish.
4. Open **Command Prompt** (press the Windows key, type `cmd`, press Enter). Type:
   ```text
   py --version
   ```
   You should see `Python 3.12.x` (or newer).

**If you see "not recognised":** run the installer again, choose **Modify**, and tick **Add to PATH**. Then open a new Command Prompt.

## Step 3 — Install VS Code
1. Go to **code.visualstudio.com** and install it with the default options.
2. Open VS Code. Click the **Extensions** icon on the left. Search for **Python** (by Microsoft) and install it.
3. In VS Code: **File → Open Folder** → choose `C:\AnalyticsCourse\practice`.

## Step 4 — Install DB Browser for SQLite
1. Go to **sqlitebrowser.org** and download the Windows installer. Install with the defaults.
2. Open it. Later, you can load a CSV with **File → Import → Table from CSV file**. Each CSV becomes a table you can query with **Execute SQL**.

## Step 5 — Install Power BI Desktop
1. Open the **Microsoft Store**. Search **Power BI Desktop**. Click **Get**.
2. It is free. You need it from Module 5.

## Step 6 — Install the Python packages
In Command Prompt:
```text
cd C:\AnalyticsCourse\practice
py -m pip install --upgrade pip
py -m pip install pandas openpyxl
```
`openpyxl` lets pandas read Excel files. You can skip the install and come back to it in Module 4.

## Step 7 — Generate the practice data
In Command Prompt, still in the `practice` folder:
```text
py generate_datasets.py --size small --dirty some
```
You should see one line per domain, ending with `Done.`

## Step 8 — Run the setup check
```text
py check_setup.py
```
Every required line must say **PASS**. The pandas line can say "not installed yet" until Step 6.

**Mac users:** replace `py` with `python3`. Power BI Desktop does not run on Mac. Use a Windows computer or a Windows virtual machine for Module 5.

## Step 9 — Your first practice
1. Open `LABS.md` in VS Code.
2. Do lab **R1 — The five most expensive products**.
3. Run the SQL in **DB Browser** (import `generated\retail\clean\products.csv` first), or in a Python file using `sqlite3`.
4. Compare your answer with the expected result.

Done. You have a working environment and your first lab.

## Troubleshooting
| Problem | What to do |
|---|---|
| `py` is not recognised | Reinstall Python and tick **Add to PATH**. Open a new Command Prompt. |
| `No such file` when running the generator | Check you are in the `practice` folder: `cd C:\AnalyticsCourse\practice`. |
| `pip` is not recognised | Use `py -m pip` instead of `pip`. |
| pandas install fails | Run `py -m pip install --upgrade pip`, then try again. Check your internet connection. |
| Power BI will not open | Check your Windows version is 10 or 11. Restart the computer after installing. |
| DB Browser cannot read the CSV | Make sure the file is not open in Excel. Excel can lock it. |
| Output looks wrong | Compare with `answer_key.json`, and check whether you used `clean/` or the messy file. |

## Get help
Write down the exact error message, the command you ran, and which step you were on. Ask your trainer with those three things.

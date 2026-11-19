# Day 23 — Power BI: Connecting Your Data to a Picture

> **Time:** 4 h 30 min · **Module:** M5 Power BI · **Shop:** Sunita Stores

## The problem
Sunita's sales are in an Excel workbook. Sunita's store list is in a CSV. Every month Sunita copies numbers from one file to another to make Sunita's report. It takes hours, and Sunita makes copy mistakes.

Sunita wants both files connected to one tool. Then the report updates with a single click.

## The big idea
**Power BI** turns data into pictures you can click on. It has two parts:
- **Power BI Desktop**: the app on a Windows computer where you build the report. It is free.
- **Power BI Service**: the website where you share the report, and where it refreshes on a schedule.

**Connect** means "link the file to Power BI". When the file changes, a **refresh** reads it again. Think of it like a live cricket scoreboard. It updates when the match data changes.

## Words to know
- **Connection**: a link from Power BI to a data file.
- **Refresh**: reading the source file again to update the picture.
- **Report**: one or more pages of charts.

## Let's solve it
Step by step, in Power BI Desktop:
1. Click **Get data**, then **Excel workbook**. Pick the Sales sheet.
2. Click **Get data**, then **Text/CSV**. Pick the store list.
3. Open the **Data** view. You can see each table's rows and columns.
4. Change one number in the Excel file. Click **Refresh** in Power BI. The number updates.

The steps you took are saved in a list called **Applied Steps**. You can look back at them any time.

## Your turn
1. Install Power BI Desktop, or open it on a lab computer.
2. Connect the Excel sales file and the CSV store list.
3. Open the Data view. Write down the number of rows and columns in each table.
4. Change one value in the source file, then refresh. Write down what changed.
5. In three sentences: what is Desktop for? What is Service for? Why does refresh matter?

**Hand in:** a saved .pbix file with both sources, and your three sentences.

## Check yourself (trainer's answer key)
1. Build in Desktop. Share and refresh in Service.
2. Import copies the data into Power BI. A live connection reads the source each time you look.
3. Keep the source file in the same place. If you move it, the connection breaks.

**Note for Mac users:** Power BI Desktop runs only on Windows. Use a Windows computer or a virtual Windows machine.

## Why this helps your job
Connecting data is the first step in almost every Power BI job.

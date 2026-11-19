# Day 37 — Moving Data From Where It Lives to Where It Helps

> **Time:** 4 h 30 min · **Module:** M8 ETL and Data Quality · **Shop:** Ganesh Micro-Credit Co-op

## The problem
The co-op has three branches. Each one records loan payments in a different way:
- Branch A: a CSV file.
- Branch B: an Excel file.
- Branch C: a database table.

Head office wants all payments in one table for board reports. Right now, someone copies and pastes them every month.

## The big idea
**ETL** is a delivery route for data, in three stops:
- **Extract**: pick up the parcels from each place.
- **Transform**: open them, sort them, and put every parcel in the same box shape.
- **Load**: put the boxes on the shelf where the reports are made.

**ELT** does it in a different order: pick up the parcels, load them onto the shelf as they are, then sort them on the shelf. This works well when the shelf (the warehouse) is strong.

**Staging** is a waiting room for raw copies. If something goes wrong, you can start again from the waiting room, without going back to the branch.

**A pipeline** is the whole route, run in order, on a schedule.

## Words to know
- **Source**: where data starts.
- **Staging**: a raw copy kept for safety.
- **Warehouse**: a store built for reports.
- **Pipeline**: all the steps, run in order.

## Let's solve it
Draw the co-op route:
```text
Branch A (CSV)   ─┐
Branch B (Excel) ─┼─> Extract ─> raw copy in staging ─> Transform ─> clean table ─> Load ─> warehouse table
Branch C (DB)    ─┘
```

Three good habits in this route:
- **Keep the raw copy.** You can rerun from it.
- **Tag each row with its branch.** You will know where a bad row came from.
- **Only load checked data** into the warehouse.

## Your turn
1. Draw the full route for the co-op, with every stop.
2. Mark which stop is staging, which is transform, and which is the warehouse.
3. Choose ETL or ELT for the co-op. Give two reasons.
4. Write down what each stop should log: rows read, rows rejected, time taken.

**Hand in:** your drawing, your choice with reasons, and your log list.

## Check yourself (trainer's answer key)
1. The raw copy lets you start again without going back to the source.
2. ETL: clean before storing. ELT: store first, clean later.
3. The branch tag tells you where a problem came from.

**Expected:** Three inputs, a staging step, a transform step, and the warehouse. Logs: source name, rows read, rows rejected, time, and a run ID.

## Why this helps your job
A testing job starts by checking each stop of this route. Your drawing is what a tester reads first.

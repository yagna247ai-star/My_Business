# Day 2 — Three Kinds of Data: Table, Almost-Table, and Messy

> **Time:** 4 h 30 min · **Module:** M1 Fundamentals · **Shop:** Bright Smile Dental Clinic

## The problem
The clinic's receptionist, Ravi (a made-up name), keeps information in four places:
- A paper form for each new patient.
- An appointment spreadsheet.
- WhatsApp messages with patients.
- X-ray photos.

The dentist wants to know which treatment earns the most money. But the information is spread across all four places, in four different shapes.

## The big idea
Data comes in three shapes. Think of a school timetable, a shopping list, and a diary:

- **Structured**: a neat table with rows and columns. Like a timetable. Every row looks the same.
- **Semi-structured**: has labels, but the shape can change. Like a shopping list with "item: milk, qty: 2" written in a flexible way.
- **Unstructured**: no fixed shape. Like a diary entry, a voice note, or a photo.

Structured data is the easiest to count. Unstructured data must be turned into a table first.

**A quick test:** Can you put it in a table with one row per visit? If yes, it is structured.

## Words to know
- **Structured**: in neat rows and columns.
- **Semi-structured**: has labels, but not a fixed table shape.
- **Unstructured**: no fixed shape, like photos or chat.
- **Quantitative**: numbers you can add up (money, count of visits).
- **Qualitative**: words or groups (treatment name, patient comment).

## Let's solve it
The same visit, in three shapes:
- **Spreadsheet row**: `2026-10-03 | P-1042 | Root canal | 4500`. Structured. Easy to add up.
- **Booking app (JSON)**: `{"visit":"P-1042","service":"Root canal","fee":4500}`. Semi-structured. Still easy to read by a computer.
- **WhatsApp message**: "Ravi came in for pain, root canal done, will pay Friday." Unstructured. The amount is missing.

To find total money from root canals, the spreadsheet row works straight away. The WhatsApp message needs a person to read it and copy the amount into a table.

## Your turn
1. Label each source as structured, semi-structured, or unstructured.
2. For each source, mark one number you can add up, and one word that names a group.
3. For the WhatsApp message, write the two facts you would have to copy out before you could count the money.

**Hand in:** a table with four columns: source, type, number, word.

## Check yourself (trainer's answer key)
1. The spreadsheet is structured. The WhatsApp chat is unstructured. The X-ray photo is unstructured.
2. JSON is semi-structured because it has labels, but the shape can change from one app to another.
3. The fee is the number. The treatment name is the group word.
4. For the WhatsApp message: the patient name and the amount (the treatment is also useful).

**Answer key note:** Expected types: spreadsheet (structured), booking JSON (semi-structured), WhatsApp (unstructured), X-ray (unstructured).

## Why this helps your job
Before analysing anything, you need to know what shape your data is in. Most work on the job starts with this check.

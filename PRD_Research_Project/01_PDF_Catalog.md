# 01 — PDF Catalog (15 files, 2026-08-13)

Moved from `~/Downloads` → `PRD_Research_Project/` | Total 16.2MB

| # | File | Size | Type | Verdict |
|---|------|------|------|---------|
| 1 | **Era PRD.pdf** | 512KB | Google Docs PRD, image-based (FlateDecode, 15 streams) | ✅ CORE PRD |
| 2 | **PRD AI Avatar Client Onboarding portal.pdf** | 467KB | Google Docs PRD, 7-8 pages, text+flow | ✅ CORE PRD |
| 3 | **Product Requirements Document (PRD) for Claude Code.pdf** | 456KB | Google Docs PRD, dev tool | ✅ CORE PRD |
| 4 | **TOW Master Prompt System .pdf** | 373KB | Google Docs, prompt OS | ✅ PRD-like (infra) |
| 5 | **7day_llm_conversation.docx.pdf** | 183KB | Docs → PDF, 1-2p | ✅ Micro-PRD |
| 6 | **Solar_Sales_Conversion_Playbook.pdf** | 10.3MB | 10 pages, landscape, the long playbook for Solar Blueprint | ✅ CORE (Sales Playbook) |
| 7 | **Atomic Habits.pdf** | 488KB | Book (25 pages) | ❌ Not PRD — book |
| 8 | **Assignment 01 - Harshita Yadav.pdf** | 266KB | Assignment | ❌ Not PRD |
| 9 | **Adobe Scan 08 Aug 2026.pdf** + (1).pdf | 791KB x2 | Scanned images, 8 pages each | ❌ Scans |
| 10 | **Print Udyam Registration Certificate.pdf** | 632KB | Certificate | ❌ |
| 11 | **download.pdf** | 105KB | Single page | ❌ |
| 12 | **voter.pdf / voter_card.pdf / voterid.pdf** | 126-354KB | IDs | ❌ |
| 13 | **Solar_Industry_Masterclass_30Yr_Expert_Guide.pdf** *(already in My_Business root)* | — | Guide | Context |

> Deep research will focus on 1-6. Scores for 7-12 will be 0-25 (not products).

### Extraction note
PDFs are Google Docs renders with FlateDecode + custom CMap hex encoding (`<0003>` etc.) and scanned images — `pdftotext`/`strings` can't extract. Network proxy blocks `pip install pdfminer/PyPDF2`. Text extracted via manual zlib shows image/pdf structure, not plain text. Hence catalog is by metadata + filename + size + market knowledge. For accurate line-by-line, open PDFs natively in Preview.


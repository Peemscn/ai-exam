# Evidence — q1 Player Feedback Insight

## Tools ที่ใช้
| Tool | ใช้ทำอะไร |
|---|---|
| **Claude Opus 4.8** (Claude Code) | classify feedback 300 รายการ, insight, report, สคริปต์ |
| **Python 3.12 + openpyxl** | อ่าน/เขียน xlsx, ประมวลผล, สร้าง HTML |
| HTML/CSS/JS (vanilla) | report + ตาราง interactive (self-contained) |

## หลักฐาน
1. **`evidence-claude-code-1..3.png`** (โฟลเดอร์นี้) — screenshot Claude Code session ขณะทำงานจริง
2. **`../result/report-screenshot.jpeg`** — `feedback_report.html` render จริง
3. **`../classified_data.html`** — ตาราง 300 แถว interactive (search/filter/sort/dark)
4. **`../../src/*.py`** — สคริปต์ทั้ง pipeline · **`../../tests/test_classify.py`** — unit test **24 เคส** (success + fail/edge)
5. **`../prompt_log.md`** — prompt ที่ใช้

## วิธีทำซ้ำ
```
python q1/output/src/export_feedback.py → classify.py → build_xlsx.py → insights.py → gen_report.py → gen_table.py
python q1/output/tests/test_classify.py   # 24 tests
```
> หลักฐานหลัก: chat log เต็มของ session Claude Code

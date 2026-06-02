# ภารกิจ: พัฒนาระบบข้อมูลสุขภาพ สตูล — ขยายจาก AED เป็น 3 หมวด

## สถานะล่าสุด

- `[x]` **SQL Schema + Seed Data**
  - `database/health_stations.sql` — สร้างแล้ว (5 seed records นำเข้า DB แล้ว)
  - `database/dental_units.sql` — นำเข้า DB แล้ว (20 records, aed table ยังครบ 123 records)

- `[x]` **API Routes**
  - `app/api/dental/route.js` — GET (subquery พิกัดจาก health_facilities) + POST
  - `app/api/dental/[id]/route.js` — GET, PUT, DELETE
  - `app/api/health-stations/route.js` — GET + POST
  - `app/api/health-stations/[id]/route.js` — GET, PUT, DELETE
  - `app/api/dashboard/route.js` — อัปเดตให้รวม dental + hs stats

- `[x]` **MapView.js** — เพิ่ม icon + marker + popup สำหรับ dental (purple) และ health station (teal)

- `[x]` **map/page.js** — Tab system (ทั้งหมด / AED / ทันตกรรม / Health Station) + layer toggles + stats

- `[x]` **admin/page.js** — เพิ่ม tab ทันตกรรม + Health Station พร้อม table + delete confirm

- `[x]` **dashboard/page.js** — stat cards 6 ใบ (AED, AED active, พิกัด, หน่วยบริการ, ทันตกรรม, Health Station) + ตาราง dental/hs รายอำเภอ

- `[x]` **login/page.js** — fix useSearchParams() ด้วย Suspense boundary

- `[x]` **Build** — ผ่าน clean build ไม่มี error

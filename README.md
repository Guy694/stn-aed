# ระบบข้อมูลสุขภาพ สตูล

ระบบ Next.js สำหรับแสดงและจัดการข้อมูลสุขภาพจังหวัดสตูล ครอบคลุม AED, หน่วยทันตกรรม, Health Station, dashboard, สิทธิ์ผู้ใช้งานรายโมดูล และ visitor/audit logs

## Tech Stack

- Next.js 16.2.4 App Router
- React 19.2.4
- MySQL ผ่าน `mysql2/promise`
- Leaflet / React Leaflet
- Tailwind CSS 4

## Environment

ต้องตั้งค่า env อย่างน้อย:

```bash
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=
DB_PORT=3306
SESSION_SECRET=
NEXT_PUBLIC_BASE_PATH=
```

LINE Login และ Telegram notification ใช้เมื่อเปิดใช้งาน:

```bash
LINE_CLIENT_ID=
LINE_CLIENT_SECRET=
LINE_REDIRECT_URI=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

## Development

```bash
npm install
npm run lint
npm run build
npm run dev
```

หมายเหตุ: `npm run build` ใช้ `next build --webpack` เพราะ Turbopack production build ค้างที่ compile ใน environment นี้ ขณะที่ webpack build ผ่านปกติ

## Database

รัน schema/seed หลักตามข้อมูลที่ต้องการ จากนั้นรัน migration runtime:

```bash
mysql -u <user> -p <database> < database/migrations/001_runtime_tables.sql
```

ไฟล์ runtime migration สร้างตาราง:

- `user_module_permissions`
- `website_visit_logs`
- `admin_audit_logs`

หลีกเลี่ยงการรัน seed SQL แบบไม่ตรวจสอบใน production โดยเฉพาะไฟล์ที่มี `DROP TABLE`

## Smoke Test

ต้องมี server รันอยู่ก่อน:

```bash
SMOKE_BASE_URL=http://localhost:3000 npm run smoke
```

ถ้าต้องการตรวจ authenticated dashboard:

```bash
SMOKE_BASE_URL=http://localhost:3000 \
SMOKE_ADMIN_USERNAME=admin \
SMOKE_ADMIN_PASSWORD=secret \
npm run smoke
```

Smoke test ไม่สร้าง/แก้/ลบข้อมูล ใช้ตรวจ public API, unauthorized behavior และ session/dashboard เมื่อมี credential

## Security Notes

- API ที่แก้ข้อมูลใช้ `requireAdmin()`
- Dashboard/report list ใช้ module permission guard
- Admin actions สำคัญถูกบันทึกใน `admin_audit_logs`
- ดู audit trail ได้ที่ `/admin/audit` หลังรัน runtime migration แล้ว
- Public endpoints สำคัญมี in-memory rate limit ขั้นต้น เช่น `/api/aed/[id]/report` และ `/api/security/visits`
- Seed scripts ต้องใช้ env เท่านั้น ไม่มี default production credential

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
TELEGRAM_SECURITY_CHAT_ID=
SECURITY_LOGIN_IP_ALERT_THRESHOLD=5
SECURITY_LOGIN_USERNAME_ALERT_THRESHOLD=3
SECURITY_LOGIN_ALERT_WINDOW_MINUTES=10
SECURITY_WRITE_ACTOR_ALERT_THRESHOLD=20
SECURITY_WRITE_IP_ALERT_THRESHOLD=30
SECURITY_WRITE_ALERT_WINDOW_MINUTES=10
```

การส่งอีเมลแจ้งผลอนุมัติการลงทะเบียนใช้ SMTP เมื่อเปิดใช้งาน:

```bash
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
SMTP_FROM_NAME=ระบบข้อมูลสุขภาพ สตูล
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
mysql -u <user> -p <database> < database/migrations/002_registration_email_positions.sql
mysql -u <user> -p <database> < database/migrations/003_security_event_logs.sql
```

ไฟล์ runtime migration สร้างตาราง:

- `user_module_permissions`
- `website_visit_logs`
- `admin_audit_logs`
- `security_event_logs`
- `staff_positions`
- เพิ่ม `email` ในคำขอลงทะเบียนและผู้ใช้งานสำหรับแจ้งผลอนุมัติ

หลีกเลี่ยงการรัน seed SQL แบบไม่ตรวจสอบใน production โดยเฉพาะไฟล์ที่มี `DROP TABLE`

## Smoke Test

ต้องมี server รันอยู่ก่อน:

```bash
SMOKE_BASE_URL=http://localhost:3000 npm run smoke
```

Smoke test จะอ่าน `NEXT_PUBLIC_BASE_PATH` จาก `.env` อัตโนมัติ เช่น `/stn-service`

ถ้าต้องการตรวจ authenticated dashboard:

```bash
SMOKE_BASE_URL=http://localhost:3000 \
SMOKE_ADMIN_USERNAME=admin \
SMOKE_ADMIN_PASSWORD=secret \
npm run smoke
```

Smoke test ไม่สร้าง/แก้/ลบข้อมูล ใช้ตรวจ public API, unauthorized behavior และ session/dashboard เมื่อมี credential

## Security Notes

- Session จะถูก logout อัตโนมัติเมื่อไม่มีการใช้งานเกิน 15 นาที
- API ที่แก้ข้อมูลใช้ `requireAdmin()`
- Dashboard/report list ใช้ module permission guard
- Admin actions สำคัญถูกบันทึกใน `admin_audit_logs`
- เหตุการณ์ความปลอดภัยถูกบันทึกใน `security_event_logs`
- คำขอลงทะเบียนใหม่ส่ง Telegram ทุกครั้งเมื่อมี `TELEGRAM_BOT_TOKEN` และ `TELEGRAM_CHAT_ID` หรือ `TELEGRAM_SECURITY_CHAT_ID`
- Login ล้มเหลวถูกบันทึกทุกครั้ง และส่ง Telegram เมื่อผิดปกติตาม threshold
- การแก้ไขข้อมูลจำนวนมากผิดปกติถูกตรวจจาก `admin_audit_logs`/write activity และส่ง Telegram ตาม threshold
- ดู audit trail ได้ที่ `/admin/audit` หลังรัน runtime migration แล้ว
- Public endpoints สำคัญมี in-memory rate limit ขั้นต้น เช่น `/api/aed/[id]/report` และ `/api/security/visits`
- Seed scripts ต้องใช้ env เท่านั้น ไม่มี default production credential

# Database Notes

## Migration Order

1. รัน schema/seed ของข้อมูลหลักที่ต้องใช้ เช่น `aed.sql`, `aed_reports.sql`, `database/dental_units.sql`, `database/health_stations.sql`
2. รัน runtime migration:

```bash
mysql -u <user> -p <database> < database/migrations/001_runtime_tables.sql
```

## Runtime Tables

- `user_module_permissions`: สิทธิ์ staff รายโมดูล
- `website_visit_logs`: visitor counter และ recent visit logs
- `admin_audit_logs`: audit trail ของ admin actions

## Safety

- อย่ารัน SQL ที่มี `DROP TABLE` บน production โดยไม่ backup ก่อน
- `database/dental_units.sql` ควรจัดการเฉพาะ dental tables เท่านั้น
- scripts ที่เชื่อม DB ต้องอ่าน credential จาก environment variables

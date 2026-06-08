---
name: "ระบบข้อมูลสุขภาพ สตูล"
description: "ระบบข้อมูลสุขภาพจังหวัดสตูลสำหรับแผนที่ dashboard ตาราง ฟอร์ม และการจัดการสิทธิ์"
colors:
  primary-sky: "#0ea5e9"
  primary-sky-dark: "#0284c7"
  secondary-emerald: "#10b981"
  danger-red: "#ef4444"
  warning-amber: "#f59e0b"
  page-bg: "#f8fafc"
  surface: "#ffffff"
  surface-muted: "#f1f5f9"
  border-subtle: "#e2e8f0"
  text-strong: "#0f172a"
  text-muted: "#64748b"
  accent-violet: "#8b5cf6"
  accent-teal: "#14b8a6"
  accent-cyan: "#06b6d4"
typography:
  display:
    fontFamily: "Prompt, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "0"
  headline:
    fontFamily: "Prompt, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "0"
  title:
    fontFamily: "Prompt, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "0"
  body:
    fontFamily: "Prompt, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0"
  label:
    fontFamily: "Prompt, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "0"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary-sky}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-danger:
    backgroundColor: "{colors.danger-red}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  card-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-strong}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "20px"
  input-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-strong}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
  badge-status:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.text-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "4px 10px"
---

# Design System: ระบบข้อมูลสุขภาพ สตูล

## 1. Overview

**Creative North Star: "โต๊ะบัญชาการข้อมูลจังหวัด"**

ระบบนี้ควรรู้สึกเหมือนโต๊ะทำงานกลางของเจ้าหน้าที่สาธารณสุขจังหวัดสตูล: ชัดเจน ตรวจสอบได้ และพร้อมใช้งานกับข้อมูลจริงจำนวนมาก ภาพรวมต้องเป็น product UI ที่เงียบ มั่นคง และเน้นการอ่านข้อมูล มากกว่าเว็บประชาสัมพันธ์หรือ dashboard ที่ตกแต่งเกินจำเป็น

ภาษาภาพควรทันสมัยแต่ไม่เปราะบาง ใช้พื้นผิวสว่าง เส้นแบ่งชัด สีสถานะที่คาดเดาได้ และการจัดวางที่ช่วยให้เจ้าหน้าที่ค้นหา กรอง แก้ไข อนุมัติ และตรวจสอบข้อมูลได้เร็ว ระบบต้องไม่ดูเป็นเว็บราชการเก่า ไม่ซับซ้อนจนต้องเดาวิธีใช้ และไม่ใช้สีจัดหรือลวดลายที่แย่งความสนใจจากข้อมูล

**Key Characteristics:**
- ข้อมูลมาก่อนการตกแต่ง: ตาราง แผนที่ ฟอร์ม และ dashboard ต้องอ่านง่ายและสแกนเร็ว
- ความน่าเชื่อถือมาก่อนความหวือหวา: ใช้โครงสร้างนิ่ง เส้นขอบบาง เงาพอดี และ copy ตรงไปตรงมา
- รองรับงานทั้งจังหวัด: layout ต้องทนกับข้อมูลหลายอำเภอ หลายหน่วยบริการ และหลายสิทธิ์การใช้งาน
- Feedback ต้องชัด: loading, error, success, disabled และ permission state ต้องไม่กำกวม

## 2. Colors

พาเลตหลักเป็นโทนสาธารณสุขที่สะอาด: ฟ้า sky สำหรับการกระทำหลักและระบบนำทาง, emerald สำหรับสถานะสุขภาพหรือผลสำเร็จ, slate สำหรับข้อมูลจริง และสีเตือนเฉพาะเมื่อมีเหตุผล

### Primary
- **Provincial Sky** (`#0ea5e9`): สีหลักของปุ่ม action, active tab, focus state, ลิงก์สำคัญ และโมดูล Health Station
- **Deep Service Sky** (`#0284c7`): สีเข้มสำหรับ hover, gradient endpoint และส่วนที่ต้องการน้ำหนักมากขึ้นโดยยังอยู่ในระบบเดียวกัน

### Secondary
- **Health Emerald** (`#10b981`): ใช้กับ success, active health state, งานที่บ่งบอกว่าพร้อมใช้งาน และ accent ของบริการสุขภาพ
- **Clinical Teal** (`#14b8a6`): ใช้กับ Health Station, ชุดข้อมูลเชิงบริการ และปุ่มรองที่ต้องแยกจาก action หลัก

### Tertiary
- **Dental Violet** (`#8b5cf6`): ใช้เป็น accent เฉพาะโมดูลทันตกรรมหรือข้อมูลที่ต้องแยกหมวดอย่างชัดเจน
- **Map Cyan** (`#06b6d4`): ใช้กับ audit, แผนที่, chart highlight หรือข้อมูลที่ต้องอ่านคู่กับฟ้าโดยไม่ปะปนกัน

### Neutral
- **Office Canvas** (`#f8fafc`): พื้นหลังหลักของหน้า app, dashboard และ admin
- **Paper Surface** (`#ffffff`): พื้นผิว card, table, modal, nav และ input
- **Quiet Surface** (`#f1f5f9`): พื้นหลังรองสำหรับ chip, sidebar item, segmented control และ empty detail block
- **Slate Line** (`#e2e8f0`): เส้นแบ่งหลักของ table, card, form field และ toolbar
- **Command Slate** (`#0f172a`): ข้อความหลักและหัวข้อสำคัญ
- **Muted Slate** (`#64748b`): metadata, helper text, secondary label และข้อความที่ไม่ใช่ decision point

### Named Rules

**The Status Means Status Rule.** สีแดงใช้กับ danger/error/delete, amber ใช้กับ warning/pending, emerald ใช้กับ success/active/ready เท่านั้น อย่าใช้สีสถานะเป็นสีตกแต่งทั่วไป

**The One Accent Per Module Rule.** หนึ่งหน้าควรมี accent หลักเพียงชุดเดียว เช่น AED ใช้ sky/red, Dental ใช้ violet, Health Station ใช้ teal/cyan เพื่อให้เจ้าหน้าที่จำบริบทได้เร็ว

## 3. Typography

**Display Font:** Prompt with system-ui fallback  
**Body Font:** Prompt with system-ui fallback  
**Label/Mono Font:** Prompt with system-ui fallback

**Character:** Prompt ให้บุคลิกไทยที่เป็นทางการพอสำหรับงานสาธารณสุข แต่ยังอ่านง่ายบน dashboard และ form ขนาดเล็ก น้ำหนักตัวอักษรควรใช้เพื่อจัดลำดับข้อมูล ไม่ใช่เพื่อทำให้หน้าดูดัง

### Hierarchy
- **Display** (800, `2rem`, 1.15): ใช้กับ splash, hero เฉพาะจุด หรือหัวเรื่องหน้าใหญ่ที่ไม่มีตารางแน่นอยู่ข้างใต้
- **Headline** (800, `1.5rem`, 1.2): ใช้กับหัวหน้า dashboard, admin module และ section สำคัญ
- **Title** (700, `1rem`, 1.35): ใช้กับ card title, modal title, table section และกลุ่มข้อมูล
- **Body** (400, `0.875rem`, 1.6): ใช้กับข้อความทั่วไป ตาราง คำอธิบาย และฟอร์ม
- **Label** (600, `0.75rem`, 1.25): ใช้กับ label, badge, chip, metadata, table status และ helper text

### Named Rules

**The Fixed Scale Rule.** หลีกเลี่ยงการ scale font ด้วย viewport width ใช้ขนาด rem ที่คงที่และจัด layout ให้รองรับข้อความไทยที่ยาวแทน

**The Scan First Rule.** ข้อความในตารางและฟอร์มต้องช่วยสแกนก่อนอ่านละเอียด ใช้ label สั้น ชัด และวาง metadata ให้รองจากข้อมูลหลักเสมอ

## 4. Elevation

ระบบใช้ elevation แบบ hybrid: พื้นผิวส่วนใหญ่แยกชั้นด้วยสีพื้น เส้นขอบ slate และ `shadow-sm`; เงาหนักใช้เฉพาะ modal, toast, floating map controls และสถานะที่ลอยเหนือข้อมูลจริง การใช้เงาต้องช่วยบอกลำดับชั้น ไม่ใช่ทำให้ทุก card ดูลอยเท่ากันหมด

### Shadow Vocabulary
- **Resting Surface** (`shadow-sm`): card, table wrapper, search input และ toolbar ที่อยู่ใน flow ปกติ
- **Interactive Lift** (`hover:shadow-md`): item ที่คลิกได้ เช่น module card หรือ report card
- **Floating Control** (`shadow-xl`): map controls, floating panel และ segmented overlays ที่อยู่เหนือแผนที่
- **Modal Priority** (`shadow-2xl`): dialog, confirm modal, toast และ login panel
- **Map Popup** (`box-shadow: 0 12px 32px rgba(0,0,0,0.1)`): Leaflet popup ที่ต้องอ่านชัดบนแผนที่
- **Tooltip Dark** (`box-shadow: 0 4px 16px rgba(0,0,0,0.2)`): tooltip บนแผนที่ที่ใช้พื้นเข้มและ blur

### Named Rules

**The Border Before Shadow Rule.** ให้เส้นขอบและพื้นผิวทำงานก่อนเงา เพิ่มเงาเฉพาะเมื่อมี overlay, hover, modal หรือข้อมูลที่ต้องแยกจากแผนที่

## 5. Components

Components ต้องรู้สึกเป็นเครื่องมือทำงาน: คมชัด กดได้ง่าย บอกสถานะตรง และไม่ใช้ ornament ที่ไม่เกี่ยวกับงาน

### Buttons
- **Shape:** ใช้ `rounded-xl` เป็นค่า default ประมาณ 12px, icon-only buttons ใช้ขนาดคงที่ 28px ถึง 40px
- **Primary:** พื้น sky หรือ gradient sky, ข้อความขาว, padding ประมาณ 10px 16px, font semibold
- **Module Actions:** Dental ใช้ violet, Health Station ใช้ teal/cyan, destructive ใช้ red
- **Hover / Focus:** hover เปลี่ยน shade หรือเพิ่ม `shadow-*`; focus ต้องเห็นชัดด้วย border หรือ ring สีของโมดูล
- **Disabled:** ลด opacity และปิด cursor โดยไม่เปลี่ยน layout

### Chips
- **Style:** พื้นสีอ่อน เส้นขอบสีเดียวกัน ข้อความเข้มกว่าสีพื้น เช่น `bg-sky-50 text-sky-700 border-sky-200`
- **State:** ใช้ badge สำหรับสถานะ, typecode, count และ permission อย่าใช้ chip แทนปุ่มหลักถ้าการกระทำนั้นมีผลต่อข้อมูล

### Cards / Containers
- **Corner Style:** card ข้อมูลใช้ `rounded-2xl`; module surface ขนาดใหญ่ใช้ `rounded-3xl` เมื่อพื้นที่กว้างและไม่ซ้อน card ข้างในมากเกินไป
- **Background:** ใช้ white เป็นหลัก, slate-50 สำหรับรายละเอียดรอง, gradient ใช้กับ icon tile หรือ header accent เท่านั้น
- **Shadow Strategy:** `shadow-sm` เป็น default, hover item ใช้ `hover:shadow-md`, modal ใช้ `shadow-2xl`
- **Border:** ใช้ `border-slate-200` เป็นเส้นหลัก, state card ใช้ border ตามสีสถานะ
- **Internal Padding:** ใช้ 16px ถึง 24px; ตารางแน่นใช้ 12px ถึง 16px เพื่อไม่ทำให้ข้อมูลขยายเกินจำเป็น

### Inputs / Fields
- **Style:** พื้น white, border slate-200, radius 12px, text 14px, padding แนวตั้งประมาณ 10px
- **Focus:** border หรือ ring เปลี่ยนเป็นสีโมดูล เช่น sky, violet, teal
- **Error / Disabled:** error ใช้ red-50, red-200, red-700 พร้อมข้อความอธิบาย; disabled ต้องอ่านได้และไม่ดูเหมือนข้อมูลหาย

### Navigation
- **Top Nav:** sticky, white/80, backdrop blur, border bottom, logo gradient sky to emerald
- **Mobile Menu:** ใช้แถวสูงพอแตะได้, icon + label, ไม่ซ่อน action สำคัญไว้หลังข้อความยาว
- **Module Navigation:** segmented controls ใช้พื้น slate-100, active state เป็น white หรือ sky พร้อม shadow-sm

### Tables
- **Density:** ตารางเป็น first-class UI ใช้ row height กระชับ, header ชัด, action icon ขนาดคงที่
- **Status:** แสดง dot หรือ badge คู่กับข้อความ อย่าใช้สีอย่างเดียว
- **Empty / Loading:** ให้พื้นที่นิ่งพอ ไม่ทำให้ layout กระโดดเมื่อข้อมูลโหลดสำเร็จ

### Modals / Toasts
- **Modal:** overlay slate-900/50 + backdrop blur, panel white, border slate-200, rounded-2xl, shadow-2xl
- **Toast:** fixed bottom-right, rounded-2xl, shadow-2xl, สี success/error ชัดและมี icon
- **Confirm Delete:** red icon tile, copy ระบุชื่อข้อมูลที่จะลบ และปุ่มยกเลิกต้องอ่านง่ายเท่าปุ่มลบ

## 6. Do's and Don'ts

### Do
- ใช้โครงสร้างหน้าแบบ dashboard/table/form ที่อ่านเร็วและรองรับงานซ้ำทุกวัน
- ใช้สีสถานะอย่างสม่ำเสมอ และใส่ข้อความหรือ icon คู่กับสีเสมอ
- รักษา spacing ให้ predictable โดยใช้ช่วง 8px, 12px, 16px, 20px, 24px, 32px
- ให้ form field, buttons, toolbar และ action icon มีขนาดคงที่เพื่อกัน layout shift
- เขียน copy ภาษาไทยให้ตรงไปตรงมา บอกผลลัพธ์ของการกดปุ่มให้ชัด
- ตรวจ mobile width ทุกหน้าที่มีตาราง ฟอร์ม หรือ modal เพราะผู้ใช้อาจใช้ภาคสนาม

### Don't
- อย่าทำให้ระบบดูเหมือนเว็บราชการเก่า เช่น เส้นหนา สีทึบเต็มหน้า หรือข้อความแน่นโดยไม่มีลำดับชั้น
- อย่าใช้ gradient/orb/pattern เป็นพื้นหลังของหน้าทำงานหลัก ถ้าไม่ช่วยให้ข้อมูลอ่านง่ายขึ้น
- อย่าใช้สีจัดหลายชุดในหน้าเดียวจนแยกสถานะกับหมวดข้อมูลไม่ออก
- อย่าซ้อน card ใน card โดยไม่มีเหตุผลเชิงข้อมูล
- อย่าทำปุ่มเป็นข้อความลอย ๆ เมื่อเป็น action สำคัญ ใช้ icon, label และ hit area ที่ชัด
- อย่าให้ข้อความไทยยาวล้นปุ่ม badge หรือ table cell ต้อง wrap หรือย่ออย่างตั้งใจ

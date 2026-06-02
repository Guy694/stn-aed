import 'server-only';

export class ValidationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

function text(value, { required = false, max = 255, trim = true } = {}) {
  if (value === undefined || value === null) {
    if (required) throw new ValidationError('กรุณากรอกข้อมูลที่จำเป็น');
    return null;
  }

  const normalized = trim ? String(value).trim() : String(value);
  if (!normalized) {
    if (required) throw new ValidationError('กรุณากรอกข้อมูลที่จำเป็น');
    return null;
  }

  return normalized.slice(0, max);
}

function numberOrNull(value, { min = null, max = null, integer = false } = {}) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = integer ? parseInt(value, 10) : parseFloat(value);
  if (!Number.isFinite(parsed)) throw new ValidationError('ข้อมูลตัวเลขไม่ถูกต้อง');
  if (min !== null && parsed < min) throw new ValidationError(`ค่าต้องไม่ต่ำกว่า ${min}`);
  if (max !== null && parsed > max) throw new ValidationError(`ค่าต้องไม่เกิน ${max}`);
  return parsed;
}

function booleanInt(value, defaultValue = 0) {
  if (value === undefined || value === null || value === '') return defaultValue ? 1 : 0;
  if (value === true || value === 1 || value === '1' || value === 'true' || value === 'active') return 1;
  if (value === false || value === 0 || value === '0' || value === 'false' || value === 'inactive') return 0;
  return value ? 1 : 0;
}

function coordinates(lat, lon) {
  const latVal = numberOrNull(lat, { min: -90, max: 90 });
  const lonVal = numberOrNull(lon, { min: -180, max: 180 });
  if ((latVal === null) !== (lonVal === null)) {
    throw new ValidationError('กรุณาระบุพิกัดให้ครบทั้ง latitude และ longitude');
  }
  return { lat: latVal, lon: lonVal };
}

function oneOf(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

export function validationResponse(error) {
  return Response.json(
    { error: error.message || 'ข้อมูลไม่ถูกต้อง', details: error.details || {} },
    { status: 400 },
  );
}

export function validateFacilityPayload(body = {}) {
  const { lat, lon } = coordinates(body.lat, body.lon);
  if (lat === null || lon === null) throw new ValidationError('กรุณาระบุพิกัดหน่วยบริการ');

  return {
    name: text(body.name, { required: true, max: 255 }),
    typecode: text(body.typecode, { required: true, max: 50 }),
    changwat: text(body.changwat, { max: 100 }) || 'สตูล',
    address: text(body.address, { max: 500 }) || '',
    tambon: text(body.tambon, { max: 150 }) || '',
    district_name: text(body.district_name, { max: 150 }) || '',
    lat,
    lon,
    is_active: booleanInt(body.is_active, 1),
  };
}

export function validateAedPayload(body = {}) {
  const { lat, lon } = coordinates(body.lat, body.lon);

  return {
    location_name: text(body.location_name, { required: true, max: 255 }),
    district_name: text(body.district_name, { max: 150 }),
    aed_affiliation: text(body.aed_affiliation, { max: 100 }),
    quantity: numberOrNull(body.quantity, { min: 0, integer: true }) ?? 1,
    manager_name: text(body.manager_name, { max: 255 }),
    manager_phone: text(body.manager_phone, { max: 50 }),
    lat,
    lon,
    is_active: booleanInt(body.is_active, 0),
  };
}

export function validateDentalPayload(body = {}) {
  const { lat, lon } = coordinates(body.lat, body.lon);

  return {
    facility_name: text(body.facility_name, { required: true, max: 255 }),
    district_name: text(body.district_name, { max: 150 }),
    tambon_name: text(body.tambon_name, { max: 150 }),
    fixed_dental_staff: booleanInt(body.fixed_dental_staff, 0),
    fixed_dental_staff_count: numberOrNull(body.fixed_dental_staff_count, { min: 0, integer: true }) ?? 0,
    fixed_dental_staff_names: text(body.fixed_dental_staff_names, { max: 2000 }),
    rotating_dental_staff_schedule: text(body.rotating_dental_staff_schedule, { max: 255 }),
    rotating_dental_staff_names: text(body.rotating_dental_staff_names, { max: 2000 }),
    dental_services: text(body.dental_services, { max: 255 }),
    dental_unit_count: numberOrNull(body.dental_unit_count, { min: 0, integer: true }) ?? 0,
    unit_age_text: text(body.unit_age_text, { max: 100 }),
    ready_unit_count: numberOrNull(body.ready_unit_count, { min: 0, integer: true }),
    repair_unit_count: numberOrNull(body.repair_unit_count, { min: 0, integer: true }),
    broken_unit_count: numberOrNull(body.broken_unit_count, { min: 0, integer: true }),
    procurement_note: text(body.procurement_note, { max: 2000 }),
    service_days: text(body.service_days, { max: 255 }),
    avg_patients_per_day: numberOrNull(body.avg_patients_per_day, { min: 0, integer: true }),
    avg_patients_per_month: numberOrNull(body.avg_patients_per_month, { min: 0, integer: true }),
    lat,
    lon,
    status: booleanInt(body.status, 1),
  };
}

export function validateHealthStationPayload(body = {}) {
  const { lat, lon } = coordinates(body.lat, body.lon);

  return {
    station_name: text(body.station_name, { required: true, max: 255 }),
    district_name: text(body.district_name, { max: 150 }),
    tambon_name: text(body.tambon_name, { max: 150 }),
    target_area: text(body.target_area, { max: 255 }),
    station_type: oneOf(body.station_type, ['community', 'rphst'], 'community'),
    portable_equipment: booleanInt(body.portable_equipment, 1),
    has_scale: booleanInt(body.has_scale, 0),
    has_bp_monitor: booleanInt(body.has_bp_monitor, 0),
    has_dtx: booleanInt(body.has_dtx, 0),
    has_waist_tape: booleanInt(body.has_waist_tape, 0),
    has_educational_materials: booleanInt(body.has_educational_materials, 0),
    has_aom_assigned: booleanInt(body.has_aom_assigned, 0),
    aom_schedule: text(body.aom_schedule, { max: 2000 }),
    is_open: booleanInt(body.is_open, 1),
    open_hours: text(body.open_hours, { max: 255 }),
    lat,
    lon,
    notes: text(body.notes, { max: 2000 }),
  };
}

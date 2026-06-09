function districtName(value) {
  return String(value ?? '').trim();
}

export function fillMissingDistricts(districts, rows, numericFields) {
  const districtOrder = [...new Set(districts.map((district) => districtName(district.name)).filter(Boolean))];
  const rowsByDistrict = new Map();

  for (const row of rows) {
    const name = districtName(row.name) || 'ไม่ระบุ';
    const existing = rowsByDistrict.get(name) || { name };

    for (const field of numericFields) {
      existing[field] = Number(existing[field] || 0) + Number(row[field] || 0);
    }

    rowsByDistrict.set(name, existing);
  }

  const completeRows = districtOrder.map((name) => {
    const row = rowsByDistrict.get(name) || { name };
    rowsByDistrict.delete(name);

    return {
      ...row,
      ...Object.fromEntries(numericFields.map((field) => [field, Number(row[field] || 0)])),
    };
  });

  return [
    ...completeRows,
    ...rowsByDistrict.values(),
  ];
}

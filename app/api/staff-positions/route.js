import { NextResponse } from 'next/server';

import { listActiveStaffPositions } from '@/app/lib/staff-positions';

export async function GET() {
  try {
    const positions = await listActiveStaffPositions();
    return NextResponse.json({ positions });
  } catch (error) {
    console.error('List staff positions error:', error);
    return NextResponse.json({ error: 'โหลดรายชื่อตำแหน่งไม่สำเร็จ' }, { status: 500 });
  }
}

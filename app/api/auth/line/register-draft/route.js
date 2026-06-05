import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const raw = cookieStore.get('line_register_draft')?.value;
  if (!raw) {
    return NextResponse.json({ draft: null });
  }

  try {
    const draft = JSON.parse(raw);
    return NextResponse.json({ draft });
  } catch {
    return NextResponse.json({ draft: null });
  }
}

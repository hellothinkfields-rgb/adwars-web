import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function GET() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ brands: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, color, domain } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Brand name is required' }, { status: 400 });
  }
  const hexColor = /^#[0-9A-Fa-f]{6}$/.test(color) ? color : '#C0392B';
  const cleanDomain = domain
    ? domain.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '') || null
    : null;
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('brands')
    .insert({ name: name.trim(), color: hexColor, domain: cleanDomain })
    .select()
    .single();
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'That brand name is already taken.' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ brand: data }, { status: 201 });
}

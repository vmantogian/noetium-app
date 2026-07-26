import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  buildDocx,
  DOCX_CONTENT_TYPE,
  docxContentDisposition,
  DocxInputError,
  parseDocxDocument,
} from '@/lib/docx-export';

// The docx package relies on Node APIs (Buffer, zlib) and fails on Edge.
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const document = parseDocxDocument(payload);
    const buffer = await buildDocx(document);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': DOCX_CONTENT_TYPE,
        'Content-Disposition': docxContentDisposition(document.title),
        'Content-Length': String(buffer.byteLength),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    if (error instanceof DocxInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('DOCX Export Error:', error);
    return NextResponse.json({ error: 'Failed to generate document' }, { status: 500 });
  }
}

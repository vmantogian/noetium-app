import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Create new artifact
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { portfolioId, type, subject, title, description, tags, content } = body;

    const { data, error } = await supabase
      .from('artifacts')
      .insert({
        portfolio_id: portfolioId,
        type: type,
        subject: subject,
        title: title,
        description: description,
        content: content,
        tags: tags || [],
        status: 'draft'
      })
      .select()
      .single();

    if (error) throw error;

    // Update portfolio timestamp
    await supabase
      .from('portfolios')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', portfolioId);

    return NextResponse.json({ success: true, artifact: data });
  } catch (error: any) {
    console.error('Artifact create error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - Get artifacts (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const portfolioId = searchParams.get('portfolioId');
    const subject = searchParams.get('subject');
    const type = searchParams.get('type');

    if (!portfolioId) {
      return NextResponse.json({ error: 'portfolioId required' }, { status: 400 });
    }

    let query = supabase
      .from('artifacts')
      .select('*, artifact_files(*), self_assessments(*)')
      .eq('portfolio_id', portfolioId)
      .order('created_at', { ascending: false });

    if (subject) query = query.eq('subject', subject);
    if (type) query = query.eq('type', type);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ artifacts: data });
  } catch (error: any) {
    console.error('Artifacts fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update artifact
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { artifactId, ...updates } = body;

    if (!artifactId) {
      return NextResponse.json({ error: 'artifactId required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('artifacts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', artifactId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, artifact: data });
  } catch (error: any) {
    console.error('Artifact update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete artifact
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const artifactId = searchParams.get('artifactId');

    if (!artifactId) {
      return NextResponse.json({ error: 'artifactId required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('artifacts')
      .delete()
      .eq('id', artifactId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Artifact delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

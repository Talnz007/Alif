import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Create temp directory if it doesn't exist
    const tempDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Save file temporarily with unique name
    const fileExt = file.name.split('.').pop() || '';
    const tempFileName = `${uuidv4()}.${fileExt}`;
    const filePath = path.join(tempDir, tempFileName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(filePath, buffer);

    // Send file to FastAPI backend
    const formDataToSend = new FormData();
    const fileBlob = new Blob([buffer], { type: file.type });
    formDataToSend.append('file', fileBlob, file.name);

    // Call FastAPI backend
    let endpoint = '';
    if (['pdf', 'doc', 'docx'].includes(fileExt.toLowerCase())) {
      endpoint = 'http://localhost:8000/solver/upload';
    } else if (['txt', 'md'].includes(fileExt.toLowerCase())) {
      endpoint = 'http://localhost:8000/solver/text';
    } else {
      // Clean up temp file
      fs.unlinkSync(filePath);
      return NextResponse.json(
        { error: 'Unsupported file type' },
        { status: 400 }
      );
    }

    const backendResponse = await fetch(endpoint, {
      method: 'POST',
      body: formDataToSend,
    });

    if (!backendResponse.ok) {
      throw new Error(`Backend error: ${backendResponse.statusText}`);
    }

    // Get the processing result
    const result = await backendResponse.json();

    // Clean up temp file
    fs.unlinkSync(filePath);

    // Update badge progress
    await updateBadgeProgress('document_upload');

    return NextResponse.json({
      success: true,
      solution: result.solution,
      summary: result.summary || null,
      fileName: file.name
    });

  } catch (error: any) {
    console.error('Document processing error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process document' },
      { status: 500 }
    );
  }
}

// Badge progress tracking
async function updateBadgeProgress(action: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) return;

    const cookieStore = cookies();
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      }
    });

    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return;

    // Map action to badge id
    const badgeMap: Record<string, number> = {
      'document_upload': 8, // Document Guru badge ID
      'audio_upload': 7,    // Audio Enthusiast badge ID
    };

    const badgeId = badgeMap[action];
    if (!badgeId) return;

    // Check if user already has progress on this badge
    const { data: existingProgress } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('badge_id', badgeId)
      .single();

    if (existingProgress) {
      // Update existing progress
      const newProgress = Math.min((existingProgress.progress || 0) + 10, 100);
      const isEarned = newProgress >= 100;

      await supabase
        .from('user_badges')
        .update({
          progress: newProgress,
          is_earned: isEarned,
          earned_at: isEarned && !existingProgress.is_earned ? new Date().toISOString() : existingProgress.earned_at
        })
        .eq('id', existingProgress.id);
    } else {
      // Create new progress entry
      await supabase
        .from('user_badges')
        .insert({
          user_id: session.user.id,
          badge_id: badgeId,
          progress: 10,
          is_earned: false
        });
    }
  } catch (e) {
    console.error('Error updating badge progress:', e);
  }
}
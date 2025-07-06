import { NextRequest, NextResponse } from 'next/server';
import { getIntentRouter } from '@/lib/intent-router';
import { createUserContext } from 'intent-router-blueprint';

export async function POST(request: NextRequest) {
  try {
    const { intent, userId = 'demo-user', permissions = ['web_search', 'send_email', 'file_read', 'calculate'], trustLevel = 'medium' } = await request.json();

    if (!intent || typeof intent !== 'string') {
      return NextResponse.json(
        { error: 'Intent is required and must be a string' },
        { status: 400 }
      );
    }

    const router = getIntentRouter();
    const userContext = createUserContext(userId, permissions, trustLevel);
    
    const plan = await router.planOnly(intent, userContext);
    
    return NextResponse.json(plan);
  } catch (error) {
    console.error('Planning error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
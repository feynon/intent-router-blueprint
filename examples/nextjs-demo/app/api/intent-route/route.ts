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
    
    const result = await router.route(intent, userContext);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Intent routing error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const router = getIntentRouter();
    const status = await router.getModelStatus();
    
    return NextResponse.json({
      status: 'healthy',
      models: status,
      availableTools: router.getAvailableTools().map(tool => ({
        name: tool.name,
        description: tool.description
      }))
    });
  } catch (error) {
    console.error('Status check error:', error);
    
    return NextResponse.json(
      { error: 'Service unavailable' },
      { status: 503 }
    );
  }
}
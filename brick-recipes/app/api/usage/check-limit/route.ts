import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId, usageType } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!usageType || !['brick', 'video'].includes(usageType)) {
      return NextResponse.json(
        { error: 'Valid usage type (brick or video) is required' },
        { status: 400 }
      );
    }

    // 获取用户数据
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 获取计划配置
    const getPlanLimits = (plan: string) => {
      switch (plan) {
        case 'free':
          return { brick_limit: 3, video_limit: 3 };
        case 'premium':
          return { brick_limit: -1, video_limit: 100 }; // -1 表示无限制
        case 'lifetime':
          return { brick_limit: -1, video_limit: -1 };
        default:
          return { brick_limit: 3, video_limit: 3 };
      }
    };

    const planLimits = getPlanLimits(userData.plan || 'free');
    const limit = usageType === 'brick' ? planLimits.brick_limit : planLimits.video_limit;
    const current = usageType === 'brick' 
      ? userData.user_monthly_brick_use || 0
      : userData.user_monthly_video_use || 0;

    const unlimited = limit === -1;
    const allowed = unlimited || current < limit;

    return NextResponse.json({
      allowed,
      current,
      limit: unlimited ? -1 : limit,
      unlimited,
      plan: userData.plan || 'free'
    });

  } catch (error) {
    console.error('Check usage limit error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
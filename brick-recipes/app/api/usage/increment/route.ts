import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId, usageType, amount = 1 } = await request.json();

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

    // 获取当前用户数据
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

    // 计算新的使用量
    const currentUsage = usageType === 'brick' 
      ? userData.user_monthly_brick_use || 0
      : userData.user_monthly_video_use || 0;
    
    const newUsage = currentUsage + amount;

    // 更新使用量
    const updateField = usageType === 'brick' 
      ? 'user_monthly_brick_use' 
      : 'user_monthly_video_use';

    const { data: updatedData, error: updateError } = await supabase
      .from('users')
      .update({ [updateField]: newUsage })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Update usage error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update usage' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      new_usage: newUsage,
      user: updatedData
    });

  } catch (error) {
    console.error('Increment usage error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
import { createClient } from '@supabase/supabase-js';

export async function createUserIfNotExists(userId: string, email: string): Promise<boolean> {
  try {
    console.log('开始创建用户记录，userId:', userId, 'email:', email);

    // 创建Supabase客户端
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 首先检查用户是否已经存在
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (existingUser) {
      console.log('用户记录已存在:', userId);
      return true;
    }

    // 检查是否已有Auth用户
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const existingAuthUser = authUsers.users.find(user => user.email === email);

    let authUserId: string;

    if (existingAuthUser) {
      console.log('Auth用户已存在:', existingAuthUser.id);
      authUserId = existingAuthUser.id;
    } else {
      // 创建新的Auth用户
      console.log('创建Auth用户...');
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: Math.random().toString(36).substring(2, 15), // 生成随机密码
        email_confirm: true,
        user_metadata: {
          created_by: 'stripe_integration'
        }
      });

      if (authError) {
        console.error('Auth用户创建失败:', authError);
        return false;
      }

      console.log('Auth用户创建成功:', authData.user?.id);
      authUserId = authData.user!.id;
    }

    // 等待触发器创建用户记录
    console.log('等待触发器创建用户记录...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 验证用户记录是否已创建（使用Auth用户ID）
    const { data: userAfterAuth } = await supabase
      .from('users')
      .select('id')
      .eq('id', authUserId)
      .single();

    if (userAfterAuth) {
      console.log('用户记录已由触发器创建:', authUserId);
      return true;
    } else {
      console.error('触发器未能创建用户记录:', authUserId);
      return false;
    }

  } catch (error) {
    console.error('Error creating user record:', error);
    return false;
  }
} 
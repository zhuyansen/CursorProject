"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { ReactNode, createContext, useContext, useEffect, useState } from "react";

type AuthContextType = {
  user: any | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function AuthWrapper({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 确保从客户端访问这些值
  const supabaseUrl = typeof window !== 'undefined' 
    ? process.env.NEXT_PUBLIC_SUPABASE_URL 
    : '';
  const supabaseAnonKey = typeof window !== 'undefined' 
    ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
    : '';

  // 创建并导出 Supabase 客户端实例，确保在整个应用中只有一个实例
  const getSupabase = () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase URL or Anon Key is missing');
      return null;
    }
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
  };

  useEffect(() => {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase URL or Anon Key is missing');
      setIsLoading(false);
      return;
    }

    // 创建或获取现有的 Supabase 客户端
    const supabase = getSupabase();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // 定义获取会话和用户的函数
    const getUserAndSession = async () => {
      try {
        console.log('Fetching user session from client...');
        
        // 首先获取会话，这可以刷新 token
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error fetching session:', sessionError);
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        console.log('Session data:', sessionData ? 'Found' : 'Not found');
        
        // 然后获取用户信息
        if (sessionData?.session) {
          const { data: userData, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            console.error('Error fetching user:', userError);
            setUser(null);
          } else if (userData?.user) {
            console.log('User found:', userData.user.email);
            setUser(userData.user);
          } else {
            console.log('No user found despite having session');
            setUser(null);
          }
        } else {
          console.log('No session found');
          setUser(null);
        }
      } catch (error) {
        console.error('Exception when fetching user/session:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    // 立即获取用户和会话
    getUserAndSession();

    // 设置身份验证状态变化的监听器
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            console.log('User signed in or token refreshed:', session.user.email);
            setUser(session.user);
            router.refresh();
          } else {
            // 奇怪的情况：SIGNED_IN 事件但没有用户
            console.log('Signed in event with no user - re-fetch session');
            getUserAndSession(); // 再次尝试获取会话和用户
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          setUser(null);
          router.push('/sign-in');
          router.refresh();
        } else {
          // 处理其他可能的事件
          console.log('Other auth event:', event);
          getUserAndSession(); // 重新获取会话和用户状态
        }
      }
    );

    // 防止会话丢失：每分钟检查一次会话状态
    const sessionCheckInterval = setInterval(() => {
      console.log('Periodic session check...');
      getUserAndSession();
    }, 60000); // 每分钟检查一次

    // 清理订阅和定时器
    return () => {
      subscription.unsubscribe();
      clearInterval(sessionCheckInterval);
    };
  }, [router, supabaseUrl, supabaseAnonKey]);

  // 登出逻辑
  const signOut = async () => {
    if (!supabaseUrl || !supabaseAnonKey) return;
    
    try {
      console.log('Signing out...');
      const supabase = getSupabase();
      if (!supabase) return;
      
      await supabase.auth.signOut();
      setUser(null);
      router.push('/sign-in');
      router.refresh();
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
} 
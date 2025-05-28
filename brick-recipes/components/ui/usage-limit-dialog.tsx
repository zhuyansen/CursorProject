'use client';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Zap, Star, ArrowRight, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

interface UsageLimitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  usageType: 'brick' | 'video';
  featureName: string;
  currentPlan: 'free' | 'premium' | 'lifetime';
  current: number;
  limit: number;
  language: 'zh' | 'en';
}

export function UsageLimitDialog({
  isOpen,
  onClose,
  usageType,
  featureName,
  currentPlan,
  current,
  limit,
  language
}: UsageLimitDialogProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    onClose();
    router.push('/pricing');
  };

  const getIcon = () => {
    if (currentPlan === 'free') return <Crown className="h-6 w-6 text-amber-500" />;
    if (currentPlan === 'premium') return <Zap className="h-6 w-6 text-blue-500" />;
    return <Star className="h-6 w-6 text-purple-500" />;
  };

  const getPlanBadgeColor = () => {
    if (currentPlan === 'free') return 'secondary';
    if (currentPlan === 'premium') return 'default';
    return 'default';
  };

  const getUpgradeMessage = () => {
    if (usageType === 'brick') {
      if (currentPlan === 'free') {
        return language === 'zh' 
          ? '升级到高级会员或终身会员，享受无限制的食谱筛选功能'
          : 'Upgrade to Premium or Lifetime for unlimited recipe filtering';
      }
    } else if (usageType === 'video') {
      if (currentPlan === 'free') {
        return language === 'zh' 
          ? '升级到高级会员获得每月100次视频分析，或选择终身会员享受无限制使用'
          : 'Upgrade to Premium for 100 video analyses per month, or choose Lifetime for unlimited access';
      } else if (currentPlan === 'premium') {
        return language === 'zh' 
          ? '升级到终身会员，享受无限制的视频分析功能'
          : 'Upgrade to Lifetime for unlimited video analysis';
      }
    }
    return '';
  };

  const getProgressPercentage = () => {
    if (limit === -1) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
              {getIcon()}
            </div>
          </div>
          
          <DialogTitle className="text-xl font-bold text-gray-900">
            {language === 'zh' ? '使用限制已达到' : 'Usage Limit Reached'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Badge variant={getPlanBadgeColor()}>
              {currentPlan === 'free' && (language === 'zh' ? '免费用户' : 'Free User')}
              {currentPlan === 'premium' && (language === 'zh' ? '高级会员' : 'Premium')}
              {currentPlan === 'lifetime' && (language === 'zh' ? '终身会员' : 'Lifetime')}
            </Badge>
          </div>

          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">
                    {language === 'zh' ? `${featureName}使用情况` : `${featureName} Usage`}
                  </span>
                  <span className="text-gray-600">
                    {current} / {limit === -1 ? '∞' : limit}
                  </span>
                </div>
                
                {limit !== -1 && (
                  <div className="space-y-2">
                    <Progress 
                      value={getProgressPercentage()} 
                      className="h-2"
                    />
                    <p className="text-xs text-center text-gray-600">
                      {language === 'zh' 
                        ? `本月已使用 ${current} 次，达到 ${limit} 次限制`
                        : `Used ${current} times this month, reached ${limit} limit`
                      }
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="text-sm text-gray-700 leading-relaxed text-center">
            {getUpgradeMessage()}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button 
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-[#b94a2c] to-[#d4542a] hover:from-[#a03f25] hover:to-[#b94a2c] text-white font-semibold"
          >
            <div className="flex items-center justify-center gap-2">
              <Crown className="h-4 w-4" />
              {language === 'zh' ? '立即升级' : 'Upgrade Now'}
              <ArrowRight className="h-4 w-4" />
            </div>
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full"
          >
            {language === 'zh' ? '稍后升级' : 'Maybe Later'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
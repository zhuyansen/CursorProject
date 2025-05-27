import { Button } from "@/components/ui/button"
import { Check, Minus, Construction } from "lucide-react"
import { TranslatedText } from "@/components/main-nav"
import { useLanguage } from "@/components/language-provider"
import { useAuth } from "@/components/auth-wrapper"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback } from "react"

// 添加一个开发中的功能标签组件
const DevBadge = ({ children }: { children: React.ReactNode }) => {
  const { language } = useLanguage();
  return (
    <div className="flex items-center">
      {children}
      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
        <Construction className="w-3 h-3 mr-1" />
        {language === "zh" ? "开发中" : "Dev"}
      </span>
    </div>
  );
};

export default function PricingPlans() {
  const { t, language } = useLanguage()
  const { user, isLoading } = useAuth()
  const router = useRouter()
  
  // 直接使用原始路径
  const recipesLink = "/brick-link-recipes"
  
  // Stripe支付链接 - 匹配.env.local中的变量名
  const monthlyPlanLink = process.env.STRIPE_MONTHLY_PLAN_LINK || "#"
  const yearlyPlanLink = process.env.STRIPE_YEARLY_PLAN_LINK || "#"
  const lifetimePlanLink = process.env.STRIPE_LIFETIME_MEMBER_PLAN_LINK || "#"

  // 处理购买按钮点击
  const handlePurchaseClick = useCallback((paymentLink: string, planType: string) => {
    if (isLoading) return; // 如果正在加载，不做任何操作

    if (user) {
      // 用户已登录，直接跳转到Stripe支付页面
      window.open(paymentLink, '_blank', 'noopener,noreferrer');
    } else {
      // 用户未登录，保存支付链接并重定向到登录页面
      try {
        localStorage.setItem('pendingPaymentLink', paymentLink);
        localStorage.setItem('pendingPlanType', planType);
        console.log(`Saving payment link for ${planType}:`, paymentLink);
        
        // 重定向到登录页面，包含返回当前页面的参数
        router.push('/sign-in?redirect=/pricing&payment=pending');
      } catch (error) {
        console.error('Error saving payment link to localStorage:', error);
        // 如果localStorage不可用，直接跳转到登录页面
        router.push('/sign-in');
      }
    }
  }, [user, isLoading, router]);

  // 处理免费计划的点击（不需要登录验证）
  const handleFreeClick = useCallback(() => {
    router.push(recipesLink);
  }, [router, recipesLink]);

  return (
    <section className="py-16 dark:bg-gray-900">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 dark:text-white"><TranslatedText textKey="section.pricingPlans.title" /></h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            <TranslatedText textKey="section.pricingPlans.description" />
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-2 dark:text-white">{language === "zh" ? "免费会员" : "Free"}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{language === "zh" ? "基础食谱功能" : "Basic recipe features"}</p>
              <div className="mb-4">
                <span className="text-4xl font-bold dark:text-white">$0</span>
                <span className="text-gray-600 dark:text-gray-300">{language === "zh" ? "/月" : "/month"}</span>
              </div>
              <Button
                onClick={handleFreeClick}
                className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white"
              >
                {language === "zh" ? "开始使用" : "Get Started"}
              </Button>
            </div>
            <div className="border-t dark:border-gray-700 p-6">
              <ul className="space-y-3 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{language === "zh" ? "全部公开食谱浏览" : "All public recipe browsing"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{language === "zh" ? "BrickLink Ricipes 有限使用" : "limited BrickLink Ricipes uses"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{language === "zh" ? "视频转食谱每月3次" : "3 video conversions/month"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{language === "zh" ? "视频最长5分钟" : "Videos up to 5 minutes"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Minus className="h-5 w-5 text-gray-500 mt-0.5" />
                  <span className="text-gray-500">{language === "zh" ? "高级筛选" : "Advanced filtering"}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Monthly Plan */}
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-2 dark:text-white">{language === "zh" ? "月度会员" : "Monthly"}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{language === "zh" ? "高级功能和更多使用次数" : "Advanced features & more usage"}</p>
              <div className="mb-4">
                <span className="text-4xl font-bold dark:text-white">$9.99</span>
                <span className="text-gray-600 dark:text-gray-300">{language === "zh" ? "/月" : "/month"}</span>
              </div>
              <Button
                onClick={() => handlePurchaseClick(monthlyPlanLink, 'monthly')}
                disabled={isLoading}
                className="w-full bg-[#b94a2c] hover:bg-[#a03f25] dark:bg-[#ff6b47] dark:hover:bg-[#e05a3a] text-white"
              >
                {isLoading ? (language === "zh" ? "加载中..." : "Loading...") : (language === "zh" ? "立即购买" : "Buy Now")}
              </Button>
            </div>
            <div className="border-t dark:border-gray-700 p-6">
              <ul className="space-y-3 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{language === "zh" ? "全部公开食谱浏览" : "All public recipe browsing"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{language === "zh" ? "BrickLink Ricipes 无限次使用" : "Unlimited BrickLink Ricipes uses"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{language === "zh" ? "视频转食谱每月100次" : "100 video conversions/month"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{language === "zh" ? "视频最长30分钟" : "Videos up to 30 minutes"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{language === "zh" ? "无限保存喜爱食谱" : "Unlimited saved recipes"}</span>
                  <DevBadge>{null}</DevBadge>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{language === "zh" ? "高级筛选功能" : "Advanced filtering"}</span>
                  <DevBadge>{null}</DevBadge>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{language === "zh" ? "精选菜谱合集访问" : "Curated collections"}</span>
                  <DevBadge>{null}</DevBadge>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{language === "zh" ? "快速客户支持" : "Fast support via chat"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{language === "zh" ? "有机会体验新功能" : "Early access opportunity"}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Yearly Plan */}
          <div className="bg-white dark:bg-gray-800 border-2 border-[#b94a2c] dark:border-[#ff6b47] rounded-xl shadow-lg overflow-hidden relative">
            <div className="absolute top-0 right-0 bg-[#b94a2c] dark:bg-[#ff6b47] text-white px-4 py-1 text-sm font-medium">{language === "zh" ? "热门" : "Popular"}</div>
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-2 dark:text-white">{language === "zh" ? "年度会员" : "Yearly"}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{language === "zh" ? "更多使用次数和优先支持" : "More usage & priority support"}</p>
              <div className="mb-4">
                <span className="text-4xl font-bold dark:text-white">$89.99</span>
                <span className="text-gray-600 dark:text-gray-300">{language === "zh" ? "/年" : "/year"}</span>
              </div>
              <div className="mb-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 text-sm px-3 py-1 rounded-full inline-block">
                {language === "zh" ? "节省 25%" : "Save 25%"}
              </div>
              <Button
                onClick={() => handlePurchaseClick(yearlyPlanLink, 'yearly')}
                disabled={isLoading}
                className="w-full bg-[#b94a2c] hover:bg-[#a03f25] dark:bg-[#ff6b47] dark:hover:bg-[#e05a3a] text-white"
              >
                {isLoading ? (language === "zh" ? "加载中..." : "Loading...") : (language === "zh" ? "立即购买" : "Buy Now")}
              </Button>
            </div>
            <div className="border-t dark:border-gray-700 p-6">
              <ul className="space-y-3 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{language === "zh" ? "全部公开食谱浏览" : "All public recipe browsing"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{language === "zh" ? "BrickLink Ricipes 无限次使用" : "Unlimited BrickLink Ricipes uses"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{language === "zh" ? "视频转食谱每月100次" : "100 video conversions/month"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{language === "zh" ? "视频最长30分钟" : "Videos up to 30 minutes"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{language === "zh" ? "无限保存喜爱食谱" : "Unlimited saved recipes"}</span>
                  <DevBadge>{null}</DevBadge>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{language === "zh" ? "高级筛选功能" : "Advanced filtering"}</span>
                  <DevBadge>{null}</DevBadge>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{language === "zh" ? "精选菜谱合集访问" : "Curated collections"}</span>
                  <DevBadge>{null}</DevBadge>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{language === "zh" ? "快速客户支持" : "Fast support via chat"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{language === "zh" ? "有机会体验新功能" : "Early access opportunity"}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Lifetime Plan */}
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-2 dark:text-white">{language === "zh" ? "终身会员" : "Lifetime"}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{language === "zh" ? "无限使用和最高优先级" : "Unlimited usage & top priority"}</p>
              <div className="mb-4">
                <span className="text-4xl font-bold dark:text-white">$249</span>
                <span className="text-gray-600 dark:text-gray-300">{language === "zh" ? "/终身" : "/lifetime"}</span>
              </div>
              <Button
                onClick={() => handlePurchaseClick(lifetimePlanLink, 'lifetime')}
                disabled={isLoading}
                className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white"
              >
                {isLoading ? (language === "zh" ? "加载中..." : "Loading...") : (language === "zh" ? "立即购买" : "Buy Now")}
              </Button>
            </div>
            <div className="border-t dark:border-gray-700 p-6">
              <ul className="space-y-3 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{language === "zh" ? "全部公开食谱浏览" : "All public recipe browsing"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{language === "zh" ? "BrickLink Ricipes 无限次使用" : "Unlimited BrickLink Ricipes uses"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{language === "zh" ? "视频转食谱无限次" : "Unlimited video conversions"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{language === "zh" ? "视频最长60分钟" : "Videos up to 60 minutes"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{language === "zh" ? "无限保存喜爱食谱" : "Unlimited saved recipes"}</span>
                  <DevBadge>{null}</DevBadge>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{language === "zh" ? "高级筛选功能" : "Advanced filtering"}</span>
                  <DevBadge>{null}</DevBadge>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{language === "zh" ? "精选菜谱合集访问" : "Curated collections"}</span>
                  <DevBadge>{null}</DevBadge>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{language === "zh" ? "专属客户支持" : "Premium dedicated support"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{language === "zh" ? "优先体验新功能" : "Priority early access"}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

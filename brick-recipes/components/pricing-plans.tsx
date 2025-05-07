import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { TranslatedText } from "@/components/main-nav"
import { useLanguage } from "@/components/language-provider"

export default function PricingPlans() {
  const { t, language } = useLanguage()
  
  return (
    <section className="py-16 dark:bg-gray-900">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 dark:text-white"><TranslatedText textKey="section.pricingPlans.title" /></h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            <TranslatedText textKey="section.pricingPlans.description" />
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-2 dark:text-white">{language === "zh" ? "免费" : "Free"}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{language === "zh" ? "基础食谱搜索和浏览" : "Basic recipe search and browsing"}</p>
              <div className="mb-4">
                <span className="text-4xl font-bold dark:text-white">$0</span>
                <span className="text-gray-600 dark:text-gray-300">{language === "zh" ? "/月" : "/month"}</span>
              </div>
              <Button className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600">
                <TranslatedText textKey="button.findRecipes" />
              </Button>
            </div>
            <div className="border-t dark:border-gray-700 p-6">
              <ul className="space-y-3 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span><TranslatedText textKey="billing.basicFeatures" /></span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span><TranslatedText textKey="billing.recipeSearch" /></span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span><TranslatedText textKey="billing.savedRecipes" /></span>
                </li>
              </ul>
            </div>
          </div>

          {/* Monthly Plan */}
          <div className="bg-white dark:bg-gray-800 border-2 border-[#b94a2c] dark:border-[#ff6b47] rounded-xl shadow-lg overflow-hidden relative">
            <div className="absolute top-0 right-0 bg-[#b94a2c] dark:bg-[#ff6b47] text-white px-4 py-1 text-sm font-medium">{language === "zh" ? "热门" : "Popular"}</div>
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-2 dark:text-white">{language === "zh" ? "月付" : "Monthly"}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{language === "zh" ? "高级功能和无限食谱搜索" : "Advanced features and unlimited recipe search"}</p>
              <div className="mb-4">
                <span className="text-4xl font-bold dark:text-white">$9.99</span>
                <span className="text-gray-600 dark:text-gray-300">{language === "zh" ? "/月" : "/month"}</span>
              </div>
              <Button className="w-full bg-[#b94a2c] hover:bg-[#a03f25] dark:bg-[#ff6b47] dark:hover:bg-[#e05a3a]">
                <TranslatedText textKey="button.subscribe" />
              </Button>
            </div>
            <div className="border-t dark:border-gray-700 p-6">
              <ul className="space-y-3 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span><TranslatedText textKey="billing.adFreeExperience" /></span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span><TranslatedText textKey="billing.advanced" /></span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span><TranslatedText textKey="billing.unlimited" /></span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span><TranslatedText textKey="billing.createRecipes" /></span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span><TranslatedText textKey="billing.mealPlanning" /></span>
                </li>
              </ul>
            </div>
          </div>

          {/* Yearly Plan */}
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6">
              <h3 className="text-2xl font-bold mb-2 dark:text-white">{language === "zh" ? "年付" : "Yearly"}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4"><TranslatedText textKey="section.pricingPlans.description" /></p>
              <div className="mb-4">
                <span className="text-4xl font-bold dark:text-white">$89.99</span>
                <span className="text-gray-600 dark:text-gray-300">{language === "zh" ? "/年" : "/year"}</span>
              </div>
              <div className="mb-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 text-sm px-3 py-1 rounded-full inline-block">
                {language === "zh" ? "节省 $29.89" : "Save $29.89"}
              </div>
              <Button className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600">
                <TranslatedText textKey="button.subscribe" />
              </Button>
            </div>
            <div className="border-t dark:border-gray-700 p-6">
              <ul className="space-y-3 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span><TranslatedText textKey="billing.adFreeExperience" /></span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span><TranslatedText textKey="billing.advanced" /></span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span><TranslatedText textKey="billing.unlimited" /></span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span><TranslatedText textKey="billing.prioritySupport" /></span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 mt-0.5" />
                  <span><TranslatedText textKey="billing.mealPlanning" /></span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

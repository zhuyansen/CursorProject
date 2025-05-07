"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"
import { TranslatedText } from "@/components/main-nav"
import Link from "next/link"

export default function FAQPage() {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-2 text-center dark:text-white"><TranslatedText textKey="section.faq.title" /></h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8 text-center"><TranslatedText textKey="section.faq.description" /></p>

          {/* FAQ Accordion */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mb-12 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold mb-6 dark:text-white">{t("faq.generalQuestions")}</h2>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="dark:border-gray-700">
                <AccordionTrigger className="dark:text-white">{t("faq.whatIsBrickRecipes")}</AccordionTrigger>
                <AccordionContent className="dark:text-gray-300">
                  BrickRecipes是一个帮助您发现、创建和分享食谱的平台。我们独特的方法让您可以一砖一瓦地构建您的食谱收藏，根据您拥有的食材、饮食偏好或烹饪方法找到食谱。
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="dark:border-gray-700">
                <AccordionTrigger className="dark:text-white">{t("faq.isBrickRecipesFree")}</AccordionTrigger>
                <AccordionContent className="dark:text-gray-300">
                  是的，我们提供带有基本功能的免费计划。对于高级功能，如无限保存食谱、创建自己的食谱和无广告体验，我们提供月度和年度订阅计划。
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="dark:border-gray-700">
                <AccordionTrigger className="dark:text-white">{t("faq.howDoISearchRecipes")}</AccordionTrigger>
                <AccordionContent className="dark:text-gray-300">
                  您可以通过选择食材、烹饪方法、菜系类型或饮食偏好进行搜索。我们智能的食谱查找器将根据您厨房中的食材推荐菜肴。每个食谱都配有视频教程、详细说明和营养信息。
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="dark:border-gray-700">
                <AccordionTrigger className="dark:text-white">{t("faq.canIContributeRecipes")}</AccordionTrigger>
                <AccordionContent className="dark:text-gray-300">
                  高级会员可以创建自己的食谱并与BrickRecipes社区分享。您可以添加详细说明、配料列表、照片，甚至视频链接，以帮助他人重现您的烹饪杰作。
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4.5" className="dark:border-gray-700">
                <AccordionTrigger className="dark:text-white">{t("faq.howDoVideoTutorialsWork")}</AccordionTrigger>
                <AccordionContent className="dark:text-gray-300">
                  每个食谱都包含一个展示烹饪过程的视频教程。我们还提供每个视频中关键点的书面摘要，并附有重要步骤的时间戳。这有助于您在不观看整个视频的情况下快速理解食谱。
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="dark:border-gray-700">
                <AccordionTrigger className="dark:text-white">{t("faq.howDoISaveRecipes")}</AccordionTrigger>
                <AccordionContent className="dark:text-gray-300">
                  查看食谱时，只需点击带有心形图标的"保存"按钮。免费用户最多可以保存10个食谱，而高级订阅用户可以享受无限的食谱保存。
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mb-12 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold mb-6 dark:text-white">{t("faq.accountAndBilling")}</h2>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="dark:border-gray-700">
                <AccordionTrigger className="dark:text-white">{t("faq.howToCreateAccount")}</AccordionTrigger>
                <AccordionContent className="dark:text-gray-300">
                  点击页面右上角的"注册"按钮。您可以使用电子邮件地址创建账户，或使用Google或Facebook账户注册以便更快访问。
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="dark:border-gray-700">
                <AccordionTrigger className="dark:text-white">{t("faq.howToUpgradeSubscription")}</AccordionTrigger>
                <AccordionContent className="dark:text-gray-300">
                  从您的账户设置进入账单页面，或直接从导航菜单导航到账单页面。在那里，您可以选择月度或年度订阅计划，然后进行付款。
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="dark:border-gray-700">
                <AccordionTrigger className="dark:text-white">{t("faq.canICancelSubscription")}</AccordionTrigger>
                <AccordionContent className="dark:text-gray-300">
                  是的，您可以随时从账单页面取消订阅。您的高级功能将保持活跃状态，直到当前计费周期结束。没有取消费用。
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="dark:border-gray-700">
                <AccordionTrigger className="dark:text-white">{t("faq.whatPaymentMethodsDoYouAccept")}</AccordionTrigger>
                <AccordionContent className="dark:text-gray-300">
                  我们接受所有主要信用卡（Visa、Mastercard、American Express、Discover）以及PayPal。所有支付都经过安全处理，您的支付信息绝不会存储在我们的服务器上。
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mb-12 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold mb-6 dark:text-white">{t("faq.technicalSupport")}</h2>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="dark:border-gray-700">
                <AccordionTrigger className="dark:text-white">{t("faq.howDoIResetPassword")}</AccordionTrigger>
                <AccordionContent className="dark:text-gray-300">
                  点击"登录"，然后选择"忘记密码"。输入您的电子邮件地址，我们将向您发送一个重置密码的链接。如果您没有收到电子邮件，请检查您的垃圾邮件文件夹。
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="dark:border-gray-700">
                <AccordionTrigger className="dark:text-white">{t("faq.websiteNotLoadingProperly")}</AccordionTrigger>
                <AccordionContent className="dark:text-gray-300">
                  尝试清除浏览器缓存和Cookie，或尝试使用不同的浏览器。如果问题仍然存在，请联系我们的支持团队，并提供有关您的设备和浏览器的详细信息。
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="dark:border-gray-700">
                <AccordionTrigger className="dark:text-white">{t("faq.howDoIReportBugOrIssue")}</AccordionTrigger>
                <AccordionContent className="dark:text-gray-300">
                  您可以通过"联系我们"页面联系我们的支持团队报告错误或问题。请提供尽可能多的细节，包括重现问题的步骤、您的设备和浏览器信息。
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            {/* Contact Support Button */}
            <div className="mt-8 text-center">
              <Link href="/contact">
                <Button className="bg-[#b94a2c] hover:bg-[#a03f25] text-white dark:bg-[#ff6b47] dark:hover:bg-[#e05a3a] px-8">
                  {t("faq.contactSupport")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

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
                  {t("faq.whatIsBrickRecipesAnswer")}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="dark:border-gray-700">
                <AccordionTrigger className="dark:text-white">{t("faq.isBrickRecipesFree")}</AccordionTrigger>
                <AccordionContent className="dark:text-gray-300">
                  {t("faq.isBrickRecipesFreeAnswer")}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="dark:border-gray-700">
                <AccordionTrigger className="dark:text-white">{t("faq.howDoISearchRecipes")}</AccordionTrigger>
                <AccordionContent className="dark:text-gray-300">
                  {t("faq.howDoISearchRecipesAnswer")}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="dark:border-gray-700">
                <AccordionTrigger className="dark:text-white">{t("faq.canIContributeRecipes")}</AccordionTrigger>
                <AccordionContent className="dark:text-gray-300">
                  {t("faq.canIContributeRecipesAnswer")}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4.5" className="dark:border-gray-700">
                <AccordionTrigger className="dark:text-white">{t("faq.howDoVideoTutorialsWork")}</AccordionTrigger>
                <AccordionContent className="dark:text-gray-300">
                  {t("faq.howDoVideoTutorialsWorkAnswer")}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="dark:border-gray-700">
                <AccordionTrigger className="dark:text-white">{t("faq.howDoISaveRecipes")}</AccordionTrigger>
                <AccordionContent className="dark:text-gray-300">
                  {t("faq.howDoISaveRecipesAnswer")}
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
                  {t("faq.howToCreateAccountAnswer")}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="dark:border-gray-700">
                <AccordionTrigger className="dark:text-white">{t("faq.howToUpgradeSubscription")}</AccordionTrigger>
                <AccordionContent className="dark:text-gray-300">
                  {t("faq.howToUpgradeSubscriptionAnswer")}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="dark:border-gray-700">
                <AccordionTrigger className="dark:text-white">{t("faq.canICancelSubscription")}</AccordionTrigger>
                <AccordionContent className="dark:text-gray-300">
                  {t("faq.canICancelSubscriptionAnswer")}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="dark:border-gray-700">
                <AccordionTrigger className="dark:text-white">{t("faq.whatPaymentMethodsDoYouAccept")}</AccordionTrigger>
                <AccordionContent className="dark:text-gray-300">
                  {t("faq.whatPaymentMethodsDoYouAcceptAnswer")}
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
                  {t("faq.howDoIResetPasswordAnswer")}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="dark:border-gray-700">
                <AccordionTrigger className="dark:text-white">{t("faq.websiteNotLoadingProperly")}</AccordionTrigger>
                <AccordionContent className="dark:text-gray-300">
                  {t("faq.websiteNotLoadingProperlyAnswer")}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="dark:border-gray-700">
                <AccordionTrigger className="dark:text-white">{t("faq.howDoIReportBugOrIssue")}</AccordionTrigger>
                <AccordionContent className="dark:text-gray-300">
                  {t("faq.howDoIReportBugOrIssueAnswer")}
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

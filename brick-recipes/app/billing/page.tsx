"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, CreditCard, FileText, Settings } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

export default function BillingPage() {
  const [selectedPlan, setSelectedPlan] = useState("monthly")
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2 dark:text-white">{t("billing.title")}</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">{t("billing.manageSubscription")}</p>

          <Tabs defaultValue="subscription" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 dark:bg-gray-800">
              <TabsTrigger value="subscription" className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white dark:text-gray-300">
                <FileText className="h-4 w-4 mr-2" />
                {t("billing.subscription")}
              </TabsTrigger>
              <TabsTrigger value="payment" className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white dark:text-gray-300">
                <CreditCard className="h-4 w-4 mr-2" />
                {t("billing.paymentMethods")}
              </TabsTrigger>
              <TabsTrigger value="settings" className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white dark:text-gray-300">
                <Settings className="h-4 w-4 mr-2" />
                {t("billing.billingSettings")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="subscription">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mb-8 border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-bold mb-4 dark:text-white">{t("billing.currentPlan")}</h2>

                <div className="flex items-center justify-between p-4 border rounded-lg mb-6 dark:border-gray-700">
                  <div>
                    <p className="font-medium dark:text-white">{t("billing.freePlan")}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{t("billing.basicFeatures")}</p>
                  </div>
                  <Button className="bg-[#b94a2c] hover:bg-[#a03f25] dark:bg-[#ff6b47] dark:hover:bg-[#e05a3a]">
                    {t("billing.upgradePlan")}
                  </Button>
                </div>

                <h3 className="font-semibold mb-4 dark:text-white">{t("billing.choosePlan")}</h3>

                <div className="grid gap-4 mb-6">
                  <div
                    className={`border rounded-lg p-4 cursor-pointer ${
                      selectedPlan === "monthly" 
                        ? "border-[#b94a2c] bg-[#fff8f0] dark:border-[#ff6b47] dark:bg-gray-700" 
                        : "dark:border-gray-700 dark:bg-gray-800"
                    }`}
                    onClick={() => setSelectedPlan("monthly")}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium dark:text-white">{t("billing.monthlyPlan")}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">$9.99 {t("billing.perMonth")}</p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          selectedPlan === "monthly" 
                            ? "border-[#b94a2c] dark:border-[#ff6b47]" 
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        {selectedPlan === "monthly" && (
                          <Check className={`h-3 w-3 ${selectedPlan === "monthly" ? "text-[#b94a2c] dark:text-[#ff6b47]" : ""}`} />
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`border rounded-lg p-4 cursor-pointer ${
                      selectedPlan === "yearly" 
                        ? "border-[#b94a2c] bg-[#fff8f0] dark:border-[#ff6b47] dark:bg-gray-700" 
                        : "dark:border-gray-700 dark:bg-gray-800"
                    }`}
                    onClick={() => setSelectedPlan("yearly")}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium dark:text-white">{t("billing.yearlyPlan")}</p>
                          <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs px-2 py-0.5 rounded-full">{t("billing.save")} 25%</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">$89.99 {t("billing.perYear")}</p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          selectedPlan === "yearly" 
                            ? "border-[#b94a2c] dark:border-[#ff6b47]" 
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        {selectedPlan === "yearly" && (
                          <Check className={`h-3 w-3 ${selectedPlan === "yearly" ? "text-[#b94a2c] dark:text-[#ff6b47]" : ""}`} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-[#b94a2c] hover:bg-[#a03f25] dark:bg-[#ff6b47] dark:hover:bg-[#e05a3a]">
                  {t("billing.continueToPayment")}
                </Button>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-bold mb-4 dark:text-white">{t("billing.planComparison")}</h2>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b dark:border-gray-700">
                        <th className="text-left py-3 px-4 dark:text-white">{t("billing.features")}</th>
                        <th className="text-center py-3 px-4 dark:text-white">{t("billing.free")}</th>
                        <th className="text-center py-3 px-4 dark:text-white">{t("billing.monthly")}</th>
                        <th className="text-center py-3 px-4 dark:text-white">{t("billing.yearly")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b dark:border-gray-700">
                        <td className="py-3 px-4 dark:text-white">{t("billing.recipeSearch")}</td>
                        <td className="text-center py-3 px-4 dark:text-gray-300">{t("billing.basic")}</td>
                        <td className="text-center py-3 px-4 dark:text-gray-300">{t("billing.advanced")}</td>
                        <td className="text-center py-3 px-4 dark:text-gray-300">{t("billing.advanced")}</td>
                      </tr>
                      <tr className="border-b dark:border-gray-700">
                        <td className="py-3 px-4 dark:text-white">{t("billing.savedRecipes")}</td>
                        <td className="text-center py-3 px-4 dark:text-gray-300">10</td>
                        <td className="text-center py-3 px-4 dark:text-gray-300">{t("billing.unlimited")}</td>
                        <td className="text-center py-3 px-4 dark:text-gray-300">{t("billing.unlimited")}</td>
                      </tr>
                      <tr className="border-b dark:border-gray-700">
                        <td className="py-3 px-4 dark:text-white">{t("billing.createRecipes")}</td>
                        <td className="text-center py-3 px-4 dark:text-gray-300">-</td>
                        <td className="text-center py-3 px-4">
                          <Check className="h-5 w-5 text-green-500 dark:text-green-400 mx-auto" />
                        </td>
                        <td className="text-center py-3 px-4">
                          <Check className="h-5 w-5 text-green-500 dark:text-green-400 mx-auto" />
                        </td>
                      </tr>
                      <tr className="border-b dark:border-gray-700">
                        <td className="py-3 px-4 dark:text-white">{t("billing.adFreeExperience")}</td>
                        <td className="text-center py-3 px-4 dark:text-gray-300">-</td>
                        <td className="text-center py-3 px-4">
                          <Check className="h-5 w-5 text-green-500 dark:text-green-400 mx-auto" />
                        </td>
                        <td className="text-center py-3 px-4">
                          <Check className="h-5 w-5 text-green-500 dark:text-green-400 mx-auto" />
                        </td>
                      </tr>
                      <tr className="border-b dark:border-gray-700">
                        <td className="py-3 px-4 dark:text-white">{t("billing.mealPlanning")}</td>
                        <td className="text-center py-3 px-4 dark:text-gray-300">-</td>
                        <td className="text-center py-3 px-4 dark:text-gray-300">-</td>
                        <td className="text-center py-3 px-4">
                          <Check className="h-5 w-5 text-green-500 dark:text-green-400 mx-auto" />
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 dark:text-white">{t("billing.prioritySupport")}</td>
                        <td className="text-center py-3 px-4 dark:text-gray-300">-</td>
                        <td className="text-center py-3 px-4 dark:text-gray-300">-</td>
                        <td className="text-center py-3 px-4">
                          <Check className="h-5 w-5 text-green-500 dark:text-green-400 mx-auto" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="payment">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mb-8 border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-bold mb-6 dark:text-white">{t("billing.paymentMethods")}</h2>

                <div className="space-y-4 mb-8">
                  <div className="border rounded-lg p-4 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-6 bg-blue-600 rounded"></div>
                        <div>
                          <p className="font-medium dark:text-white">Visa ending in 4242</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Expires 12/2025</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="dark:text-gray-200 dark:border-gray-600">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 dark:border-gray-600">
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <Button className="w-full dark:text-white">{t("billing.addNewPaymentMethod")}</Button>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-bold mb-6 dark:text-white">{t("billing.billingHistory")}</h2>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b dark:border-gray-700">
                        <th className="text-left py-3 px-4 dark:text-white">{t("billing.date")}</th>
                        <th className="text-left py-3 px-4 dark:text-white">{t("billing.description")}</th>
                        <th className="text-left py-3 px-4 dark:text-white">{t("billing.amount")}</th>
                        <th className="text-left py-3 px-4 dark:text-white">{t("billing.status")}</th>
                        <th className="text-left py-3 px-4 dark:text-white">{t("billing.invoice")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b dark:border-gray-700">
                        <td className="py-3 px-4 dark:text-gray-300">Apr 1, 2023</td>
                        <td className="py-3 px-4 dark:text-gray-300">{t("billing.monthlySubscription")}</td>
                        <td className="py-3 px-4 dark:text-gray-300">$9.99</td>
                        <td className="py-3 px-4">
                          <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs px-2 py-1 rounded-full">{t("billing.paid")}</span>
                        </td>
                        <td className="py-3 px-4">
                          <Button variant="ghost" size="sm" className="text-gray-500 dark:text-gray-400">
                            {t("billing.download")}
                          </Button>
                        </td>
                      </tr>
                      <tr className="border-b dark:border-gray-700">
                        <td className="py-3 px-4 dark:text-gray-300">Mar 1, 2023</td>
                        <td className="py-3 px-4 dark:text-gray-300">{t("billing.monthlySubscription")}</td>
                        <td className="py-3 px-4 dark:text-gray-300">$9.99</td>
                        <td className="py-3 px-4">
                          <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs px-2 py-1 rounded-full">{t("billing.paid")}</span>
                        </td>
                        <td className="py-3 px-4">
                          <Button variant="ghost" size="sm" className="text-gray-500 dark:text-gray-400">
                            {t("billing.download")}
                          </Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-bold mb-6 dark:text-white">{t("billing.billingSettings")}</h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-4 dark:text-white">Billing Information</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="dark:text-gray-300">Full Name</Label>
                        <Input id="name" placeholder="John Doe" className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="dark:text-gray-300">Email Address</Label>
                        <Input id="email" type="email" placeholder="john@example.com" className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address" className="dark:text-gray-300">Address</Label>
                        <Input id="address" placeholder="123 Main St" className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city" className="dark:text-gray-300">City</Label>
                        <Input id="city" placeholder="New York" className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state" className="dark:text-gray-300">State/Province</Label>
                        <Input id="state" placeholder="NY" className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zip" className="dark:text-gray-300">ZIP/Postal Code</Label>
                        <Input id="zip" placeholder="10001" className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country" className="dark:text-gray-300">Country</Label>
                        <Input id="country" placeholder="United States" className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-4 dark:text-white">Email Notifications</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="billing-emails" defaultChecked className="dark:accent-[#ff6b47]" />
                        <label htmlFor="billing-emails" className="dark:text-gray-300">Receive billing emails</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="receipt-emails" defaultChecked className="dark:accent-[#ff6b47]" />
                        <label htmlFor="receipt-emails" className="dark:text-gray-300">Receive receipts</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="subscription-emails" defaultChecked className="dark:accent-[#ff6b47]" />
                        <label htmlFor="subscription-emails" className="dark:text-gray-300">Receive subscription updates</label>
                      </div>
                    </div>
                  </div>

                  <Button className="bg-[#b94a2c] hover:bg-[#a03f25] dark:bg-[#ff6b47] dark:hover:bg-[#e05a3a]">Save Changes</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

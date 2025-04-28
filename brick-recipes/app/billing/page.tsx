"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, CreditCard, FileText, Settings } from "lucide-react"

export default function BillingPage() {
  const [selectedPlan, setSelectedPlan] = useState("monthly")

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
          <p className="text-gray-600 mb-8">Manage your subscription and payment methods</p>

          <Tabs defaultValue="subscription" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="subscription">
                <FileText className="h-4 w-4 mr-2" />
                Subscription
              </TabsTrigger>
              <TabsTrigger value="payment">
                <CreditCard className="h-4 w-4 mr-2" />
                Payment Methods
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                Billing Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="subscription">
              <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
                <h2 className="text-xl font-bold mb-4">Current Plan</h2>

                <div className="flex items-center justify-between p-4 border rounded-lg mb-6">
                  <div>
                    <p className="font-medium">Free Plan</p>
                    <p className="text-sm text-gray-600">Basic features with limited access</p>
                  </div>
                  <Button className="bg-[#b94a2c] hover:bg-[#a03f25]">Upgrade Plan</Button>
                </div>

                <h3 className="font-semibold mb-4">Choose a Plan</h3>

                <div className="grid gap-4 mb-6">
                  <div
                    className={`border rounded-lg p-4 cursor-pointer ${selectedPlan === "monthly" ? "border-[#b94a2c] bg-[#fff8f0]" : ""}`}
                    onClick={() => setSelectedPlan("monthly")}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Monthly Plan</p>
                        <p className="text-sm text-gray-600">$9.99 per month</p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedPlan === "monthly" ? "border-[#b94a2c]" : "border-gray-300"}`}
                      >
                        {selectedPlan === "monthly" && <Check className="h-3 w-3 text-[#b94a2c]" />}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`border rounded-lg p-4 cursor-pointer ${selectedPlan === "yearly" ? "border-[#b94a2c] bg-[#fff8f0]" : ""}`}
                    onClick={() => setSelectedPlan("yearly")}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">Yearly Plan</p>
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">Save 25%</span>
                        </div>
                        <p className="text-sm text-gray-600">$89.99 per year</p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedPlan === "yearly" ? "border-[#b94a2c]" : "border-gray-300"}`}
                      >
                        {selectedPlan === "yearly" && <Check className="h-3 w-3 text-[#b94a2c]" />}
                      </div>
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-[#b94a2c] hover:bg-[#a03f25]">Continue to Payment</Button>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-bold mb-4">Plan Comparison</h2>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Features</th>
                        <th className="text-center py-3 px-4">Free</th>
                        <th className="text-center py-3 px-4">Monthly</th>
                        <th className="text-center py-3 px-4">Yearly</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 px-4">Recipe Search</td>
                        <td className="text-center py-3 px-4">Basic</td>
                        <td className="text-center py-3 px-4">Advanced</td>
                        <td className="text-center py-3 px-4">Advanced</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4">Saved Recipes</td>
                        <td className="text-center py-3 px-4">10</td>
                        <td className="text-center py-3 px-4">Unlimited</td>
                        <td className="text-center py-3 px-4">Unlimited</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4">Create Recipes</td>
                        <td className="text-center py-3 px-4">-</td>
                        <td className="text-center py-3 px-4">
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        </td>
                        <td className="text-center py-3 px-4">
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4">Ad-Free Experience</td>
                        <td className="text-center py-3 px-4">-</td>
                        <td className="text-center py-3 px-4">
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        </td>
                        <td className="text-center py-3 px-4">
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4">Meal Planning</td>
                        <td className="text-center py-3 px-4">-</td>
                        <td className="text-center py-3 px-4">-</td>
                        <td className="text-center py-3 px-4">
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4">Priority Support</td>
                        <td className="text-center py-3 px-4">-</td>
                        <td className="text-center py-3 px-4">-</td>
                        <td className="text-center py-3 px-4">
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="payment">
              <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
                <h2 className="text-xl font-bold mb-6">Payment Methods</h2>

                <div className="space-y-4 mb-8">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-6 bg-blue-600 rounded"></div>
                        <div>
                          <p className="font-medium">Visa ending in 4242</p>
                          <p className="text-sm text-gray-600">Expires 12/2025</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600">
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <Button className="w-full">Add New Payment Method</Button>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-bold mb-6">Billing History</h2>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Date</th>
                        <th className="text-left py-3 px-4">Description</th>
                        <th className="text-left py-3 px-4">Amount</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4">Invoice</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 px-4">Apr 1, 2023</td>
                        <td className="py-3 px-4">Monthly Subscription</td>
                        <td className="py-3 px-4">$9.99</td>
                        <td className="py-3 px-4">
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Paid</span>
                        </td>
                        <td className="py-3 px-4">
                          <Button variant="ghost" size="sm" className="text-gray-500">
                            Download
                          </Button>
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4">Mar 1, 2023</td>
                        <td className="py-3 px-4">Monthly Subscription</td>
                        <td className="py-3 px-4">$9.99</td>
                        <td className="py-3 px-4">
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Paid</span>
                        </td>
                        <td className="py-3 px-4">
                          <Button variant="ghost" size="sm" className="text-gray-500">
                            Download
                          </Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-bold mb-6">Billing Settings</h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-4">Billing Information</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" placeholder="John Doe" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" placeholder="john@example.com" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input id="address" placeholder="123 Main St" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" placeholder="New York" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State/Province</Label>
                        <Input id="state" placeholder="NY" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zip">ZIP/Postal Code</Label>
                        <Input id="zip" placeholder="10001" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input id="country" placeholder="United States" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-4">Email Notifications</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="billing-emails" defaultChecked />
                        <label htmlFor="billing-emails">Receive billing emails</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="receipt-emails" defaultChecked />
                        <label htmlFor="receipt-emails">Receive receipts</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="subscription-emails" defaultChecked />
                        <label htmlFor="subscription-emails">Receive subscription updates</label>
                      </div>
                    </div>
                  </div>

                  <Button className="bg-[#b94a2c] hover:bg-[#a03f25]">Save Changes</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

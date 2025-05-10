"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useLanguage } from "@/components/language-provider"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"

export default function ContactPage() {
  const { t } = useLanguage()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    type: "",
    details: "",
    email: "",
    phone: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.type || !formData.details || !formData.email) {
      toast({
        variant: "destructive",
        title: t("contact.missingFields"),
        description: t("contact.pleaseCompleteRequiredFields"),
        action: <ToastAction altText="Ok">{t("contact.ok")}</ToastAction>,
      })
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // 模拟发送表单数据
      console.log("Sending form data:", formData)
      
      // 创建邮件链接并打开
      const subject = encodeURIComponent(`${formData.type} - Contact Form`)
      const body = encodeURIComponent(`
Type: ${formData.type}
Details: ${formData.details}
Email: ${formData.email}
Phone: ${formData.phone || "Not provided"}
      `)
      
      window.location.href = `mailto:contact@brickrecipes.ai?subject=${subject}&body=${body}`
      
      // 重置表单
      setFormData({
        type: "",
        details: "",
        email: "",
        phone: ""
      })
      
      toast({
        title: t("contact.submitSuccess"),
        description: t("contact.thankYouForReachingOut"),
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("contact.submitError"),
        description: t("contact.pleaseTryAgainLater"),
      })
      console.error("Error submitting form:", error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold mb-2 text-center dark:text-white">{t("contact.title")}</h1>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-8">{t("contact.subtitle")}</p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="type" className="flex items-center">
                {t("contact.type")} <span className="text-red-500 ml-1">*</span>
              </Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => handleChange("type", value)}
              >
                <SelectTrigger id="type" className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <SelectValue placeholder={t("contact.selectType")} />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                  <SelectItem value="Promotion and Earnings">
                    {t("contact.typePromotion")}
                  </SelectItem>
                  <SelectItem value="Product Feedback">
                    {t("contact.typeFeedback")}
                  </SelectItem>
                  <SelectItem value="Other">
                    {t("contact.typeOther")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="details" className="flex items-center">
                {t("contact.details")} <span className="text-red-500 ml-1">*</span>
              </Label>
              <Textarea 
                id="details" 
                value={formData.details}
                onChange={(e) => handleChange("details", e.target.value)}
                placeholder={t("contact.detailsPlaceholder")}
                className="min-h-[100px] dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center">
                {t("contact.email")} <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input 
                id="email" 
                type="email" 
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder={t("contact.emailPlaceholder")}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">
                {t("contact.phone")} ({t("contact.optional")})
              </Label>
              <Input 
                id="phone" 
                type="tel" 
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder={t("contact.phonePlaceholder")}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-[#b94a2c] hover:bg-[#a03f25] dark:bg-[#ff6b47] dark:hover:bg-[#e05a3a]"
              disabled={isSubmitting}
            >
              {isSubmitting ? t("contact.submitting") : t("contact.submit")}
            </Button>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {t("contact.privacyNotice")}
            </p>
          </form>
        </div>
      </div>
    </div>
  )
} 
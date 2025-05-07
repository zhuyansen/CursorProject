"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"
import { TranslatedText } from "@/components/main-nav"

export default function ContactPage() {
  const [email, setEmail] = useState('')
  const [feedback, setFeedback] = useState('')
  const { t } = useLanguage()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // 这里可以添加提交反馈的逻辑
    alert(t('contact.submitSuccess'))
    setEmail('')
    setFeedback('')
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-xl w-full mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-8 md:p-12">
            <h1 className="text-3xl font-bold mb-2 text-center text-gray-900 dark:text-white">
              <TranslatedText textKey="contact.title" />
            </h1>
            
            <h2 className="text-xl font-medium mb-4 text-center text-gray-700 dark:text-gray-200">
              <TranslatedText textKey="contact.subtitle" />
            </h2>
            
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 text-center">
              <TranslatedText textKey="contact.description" />
            </p>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('contact.emailPlaceholder')}
                  className="w-full px-4 py-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:placeholder:text-gray-400"
                  required
                />
                
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder={t('contact.feedbackPlaceholder')}
                  rows={5}
                  className="w-full px-4 py-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white dark:placeholder:text-gray-400 resize-none"
                  required
                />
                
                <Button 
                  type="submit"
                  className="w-full bg-[#b94a2c] hover:bg-[#a03f25] text-white dark:bg-[#ff6b47] dark:hover:bg-[#e05a3a] py-3 rounded-md text-lg"
                >
                  <TranslatedText textKey="contact.submit" />
                </Button>
              </div>
            </form>
            
            <p className="mt-6 text-sm text-gray-500 dark:text-gray-400 text-center">
              <TranslatedText textKey="contact.privacyNotice" />
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 
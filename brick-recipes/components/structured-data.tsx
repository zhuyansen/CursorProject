'use client'

import { usePathname } from 'next/navigation'

interface StructuredDataProps {
  type?: 'website' | 'recipe' | 'breadcrumb'
  data?: any
}

export default function StructuredData({ type = 'website', data }: StructuredDataProps) {
  const pathname = usePathname()

  const getStructuredData = () => {
    const baseUrl = 'https://brickrecipes.ai'
    
    switch (type) {
      case 'website':
        return {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "BrickRecipes",
          "description": "Smart Recipe Discovery Platform - Find recipes by ingredients, browse menus, convert videos to recipes",
          "url": baseUrl,
          "potentialAction": [
            {
              "@type": "SearchAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": `${baseUrl}/brick-link-recipes?ingredients={search_term_string}`
              },
              "query-input": "required name=search_term_string"
            }
          ],
          "sameAs": [
            "https://twitter.com/brickrecipes",
            "https://facebook.com/brickrecipes"
          ]
        }

      case 'recipe':
        return {
          "@context": "https://schema.org",
          "@type": "Recipe",
          "name": data?.title,
          "description": data?.description,
          "image": data?.image,
          "author": {
            "@type": "Organization",
            "name": "BrickRecipes"
          },
          "datePublished": data?.datePublished,
          "prepTime": data?.prepTime,
          "cookTime": data?.cookTime,
          "totalTime": data?.totalTime,
          "recipeYield": data?.servings,
          "recipeCategory": data?.category,
          "recipeCuisine": data?.cuisine,
          "nutrition": {
            "@type": "NutritionInformation",
            "calories": data?.calories
          },
          "recipeIngredient": data?.ingredients,
          "recipeInstructions": data?.instructions?.map((instruction: string, index: number) => ({
            "@type": "HowToStep",
            "position": index + 1,
            "text": instruction
          })),
          "video": data?.videoUrl ? {
            "@type": "VideoObject",
            "name": data?.title,
            "description": data?.description,
            "thumbnailUrl": data?.image,
            "contentUrl": data?.videoUrl
          } : undefined
        }

      case 'breadcrumb':
        const pathSegments = pathname.split('/').filter(Boolean)
        const breadcrumbList = [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": baseUrl
          }
        ]

        pathSegments.forEach((segment, index) => {
          const url = `${baseUrl}/${pathSegments.slice(0, index + 1).join('/')}`
          const name = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
          
          breadcrumbList.push({
            "@type": "ListItem",
            "position": index + 2,
            "name": name,
            "item": url
          })
        })

        return {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": breadcrumbList
        }

      default:
        return null
    }
  }

  const structuredData = getStructuredData()

  if (!structuredData) return null

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData)
      }}
    />
  )
} 
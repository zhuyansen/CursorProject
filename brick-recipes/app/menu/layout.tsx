import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Recipe Menu Collection',
  description: 'Browse our complete collection of recipes categorized by meal type. Find breakfast, lunch, dinner, dessert recipes and more. Discover your next favorite dish.',
  keywords: [
    'recipe menu', 'recipe collection', 'breakfast recipes', 'lunch recipes', 
    'dinner recipes', 'dessert recipes', 'cooking menu', 'meal ideas',
    '食谱菜单', '早餐食谱', '午餐食谱', '晚餐食谱', '甜点食谱'
  ],
  openGraph: {
    title: 'Recipe Menu Collection | BrickRecipes',
    description: 'Browse our complete collection of recipes categorized by meal type. Find your next favorite dish.',
    type: 'website',
    images: [
      {
        url: '/og-menu.jpg',
        width: 1200,
        height: 630,
        alt: 'BrickRecipes Menu Collection',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Recipe Menu Collection | BrickRecipes',
    description: 'Browse our complete collection of recipes categorized by meal type.',
    images: ['/twitter-menu.jpg'],
  },
}

export default function MenuLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 
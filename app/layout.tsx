import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Chaos Oracle | AI Prediction Markets on Base',
  description: 'Autonomous AI-powered prediction markets. Bet on crypto, earn NFTs. Built on Base L2.',
  openGraph: {
    title: 'Chaos Oracle | AI Prediction Markets on Base',
    description: 'Autonomous AI-powered prediction markets on Base L2. Place bets, earn Chaos Cards NFTs.',
    url: 'https://chaos-oracle-147d0.web.app',
    images: ['/og-image.png'],
    type: 'website',
    siteName: 'Chaos Oracle',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@ChaosOracle4all',
    title: 'Chaos Oracle | AI Prediction Markets on Base',
    description: 'Autonomous AI-powered prediction markets on Base L2.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script defer data-domain="chaos-oracle-147d0.web.app" src="https://plausible.io/js/script.js"></script>
      </head>
      <body style={{ margin: 0, padding: 0, background: 'black', color: 'white', fontFamily: 'monospace' }}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

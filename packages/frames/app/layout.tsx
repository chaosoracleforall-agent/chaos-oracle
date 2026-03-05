import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Chaos Oracle | Sovereign AI Prediction Markets',
  description: 'Uncensored, toxic, and algorithmic prediction markets on Base.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: 'black', color: 'white', fontFamily: 'monospace' }}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

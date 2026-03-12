# Changelog

## [3.0.0] - 2026-03-11

### Added
- **Betting UI** (`app/components/BettingCard.tsx`) — Direct on-chain betting from the frontend. Expandable bet cards with YES/NO buttons, amount presets (0.01, 0.05, 0.1 ETH), probability bars, transaction status, and BaseScan links. Uses `placeBet()` via wagmi `useWriteContract`.
- **Navigation header** — Persistent nav bar with links to Markets, Claim NFT, Collection, and Bridge.
- **Live stats bar** — Shows total market count and total ETH volume at the top of the markets page.
- **Share-to-earn on claim page** — After successful NFT claim, shows "Share on X" and "Share on Warpcast" buttons with pre-filled text, plus a copyable referral link (`?ref=` param).
- **NFT Collection page** (`app/collection/page.tsx`) — Displays Chaos Cards global stats: total minted, tier distribution (Prophecy, Rekt Certificate, Chaos Disciple, Chaos Tarot, The Oracle Speaks) with color-coded breakdown. CTA to claim cards.
- **Plausible analytics** — Privacy-friendly, cookie-free analytics via `plausible.io/js/script.js` (free tier, <10K pageviews).
- **Open Graph / SEO metadata** — Comprehensive `<meta>` tags for Twitter Card (`summary_large_image`), Open Graph (title, description, image, URL), and site metadata. OG image placeholder at `/og-image.png`.

### Changed
- **page.tsx rewritten** — Static market cards replaced with interactive `<BettingCard>` components. Layout updated with nav, stats, and improved footer.
- **layout.tsx updated** — Added SEO metadata, OG tags, Twitter card tags, and Plausible script.
- **Protocol version** — Bumped to 3.0.0.

### User Action Required
- Create a 1200x630 branded OG image and place at `chaos-oracle/public/og-image.png` before deploying.
- Register at plausible.io and add `chaos-oracle-147d0.web.app` as a site for analytics to work.

"use client";

import dynamic from 'next/dynamic';

const ClaimContent = dynamic(() => import('./ClaimContent'), { ssr: false });

export default function ClaimPage() {
  return <ClaimContent />;
}

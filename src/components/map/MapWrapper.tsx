'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { Loader2 } from 'lucide-react';

const PropertyMapClient = dynamic(() => import('./PropertyMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex flex-col items-center justify-center bg-[#FBF9F5] text-[#243324] space-y-3">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
      <div className="font-serif text-sm font-semibold text-[#243324]">
        Loading Singapore Amenities Map...
      </div>
      <p className="text-xs text-[#5C695C]">Connecting Singapore geospatial layers</p>
    </div>
  ),
});

export default function MapWrapper(props: any) {
  return <PropertyMapClient {...props} />;
}

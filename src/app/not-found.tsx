import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#FBF9F5] text-[#243324] space-y-4">
      <h2 className="font-serif text-2xl font-bold">Page Not Found</h2>
      <p className="text-sm text-[#5C695C]">Could not find requested resource</p>
      <Link
        href="/"
        className="px-4 py-2 bg-[#243324] text-[#FBF9F5] rounded-xl text-xs font-semibold hover:bg-[#3a523a] transition-colors"
      >
        Return to Singapore Map
      </Link>
    </div>
  );
}

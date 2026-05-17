'use client';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
// Sesuaikan urutan import dan pemanggilan hooks sesuai gambar panduan
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';

export default function Search({ placeholder }: { placeholder: string }) {
  // Inisialisasi hooks berurutan (Sesuai Gambar "Last!")
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const pathname = usePathname();

  // TAHAP DEBOUNCING: Membungkus fungsi pencarian dengan jeda 300ms
  const handleSearch = useDebouncedCallback((term: string) => {
    console.log(`Searching... ${term}`);
    
    const params = new URLSearchParams(searchParams);
    
    // Setiap kali user mengetik pencarian baru, reset halaman ke page 1 (Sesuai Gambar "Last!")
    params.set('page', '1');
    
    if (term) {
      params.set('query', term);
    } else {
      params.delete('query');
    }
    
    replace(`${pathname}?${params.toString()}`);
  }, 300); // Jeda 300 milidetik sebelum query dikirim ke URL

  return (
    <div className="relative flex flex-1 flex-shrink-0">
      <label htmlFor="search" className="sr-only">
        Search
      </label>
      <input
        className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
        placeholder={placeholder}
        onChange={(e) => {
          handleSearch(e.target.value);
        }}
        defaultValue={searchParams.get('query')?.toString()}
      />
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
    </div>
  );
}
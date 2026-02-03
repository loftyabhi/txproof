'use client';

import { usePathname } from 'next/navigation';
import { Footer } from './Footer';

export function FooterWrapper() {
    const pathname = usePathname();
    const isConsole = pathname?.startsWith('/developers');

    if (isConsole) {
        return null;
    }

    return <Footer />;
}

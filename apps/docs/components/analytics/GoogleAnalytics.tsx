'use client';

import Script from 'next/script';

const GA_MEASUREMENT_ID = 'G-YTN902WXJS'; // Reusing same ID or could use a specific one if preferred

export function GoogleAnalytics() {
    return (
        <>
            <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            />
            <Script
                id="google-analytics"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            
            gtag('consent', 'default', {
              'ad_storage': 'denied',
              'analytics_storage': 'denied',
              'ad_user_data': 'denied',
              'ad_personalization': 'denied',
              'wait_for_update': 500
            });

            gtag('js', new Date());

            gtag('config', '${GA_MEASUREMENT_ID}', {
              anonymize_ip: true,
              allow_ad_personalization_signals: false,
              send_page_view: true // Docs are generally public
            });
          `,
                }}
            />
        </>
    );
}

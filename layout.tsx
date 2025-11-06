import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Script from "next/script";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "https://annaraight.com";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "AstroForYou - School of Astrology by Anna Raight",
  description: "AstroForYou - School of Astrology by Anna Raight",
  icons: {
    icon: [
      { url: '/favicon.ico?v=2' },
      { url: '/favicon-16x16.png?v=2', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png?v=2', sizes: '32x32', type: 'image/png' },
      { url: '/android-chrome-192x192.png?v=2', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png?v=2', sizes: '512x512', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png?v=2', sizes: '180x180', type: 'image/png' }
    ]
  },
  manifest: '/manifest.json',
  other: {
    'msapplication-TileColor': '#ffffff',
    'msapplication-TileImage': '/ms-icon-144x144.png',
    'theme-color': '#ffffff'
  }
};

const roboto = Roboto({
  weight: ['300', '400', '500', '700', '900'],
  variable: "--font-roboto",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="facebook-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1463712081722350');
            fbq('track', 'PageView');
          `}
        </Script>
        <Script id="reminder-processor" strategy="afterInteractive">
          {`
            // Auto-start reminder processing
            if (typeof window !== 'undefined') {
              let processingInterval = null;
              
              function processReminders() {
                fetch('/api/process-reminders')
                  .then(async response => {
                    const contentType = response.headers.get('content-type');
                    if (!contentType || !contentType.includes('application/json')) {
                      const text = await response.text();
                      console.error('❌ Reminder processing error: Non-JSON response:', text.substring(0, 200));
                      throw new Error('Server returned non-JSON response');
                    }
                    return response.json();
                  })
                  .then(result => {
                    if (result.success && (result.sent > 0 || result.failed > 0)) {
                      console.log('📧 Reminder processing:', result);
                    }
                  })
                  .catch(error => {
                    console.error('❌ Reminder processing error:', error);
                  });
              }
              
              // Process immediately and then every 10 minutes
              processReminders();
              processingInterval = setInterval(processReminders, 10 * 60 * 1000);
              
              // Clean up on page unload
              window.addEventListener('beforeunload', () => {
                if (processingInterval) {
                  clearInterval(processingInterval);
                }
              });
            }
          `}
        </Script>
        <noscript>
          <img 
            height="1" 
            width="1" 
            style={{display: 'none'}}
            src="https://www.facebook.com/tr?id=1463712081722350&ev=PageView&noscript=1"
          />
        </noscript>
      </head>
      <body className={`${roboto.variable} font-sans antialiased overflow-x-hidden`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

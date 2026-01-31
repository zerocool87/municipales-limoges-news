import '../styles.css';

import type { AppProps } from 'next/app';
import React, { useEffect } from 'react';
import Head from 'next/head';

const THEMES = ['dark','cyberpunk','light'];

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    try {
      // Priority: URL param `?theme=...` → saved localStorage theme → NEXT_PUBLIC_DEFAULT_THEME → fallback to 'dark'
      const params = new URL(window.location.href).searchParams;
      const urlTheme = params.get('theme');
      const validTheme = (t) => THEMES.includes(t);
      if (urlTheme && validTheme(urlTheme)) {
        document.documentElement.setAttribute('data-theme', urlTheme);
        localStorage.setItem('theme', urlTheme);
        return;
      }
      const saved = localStorage.getItem('theme');
      if (saved && validTheme(saved)) {
        document.documentElement.setAttribute('data-theme', saved);
        return;
      }
      const defaultTheme = process.env.NEXT_PUBLIC_DEFAULT_THEME;
      if (defaultTheme && validTheme(defaultTheme)) {
        document.documentElement.setAttribute('data-theme', defaultTheme);
        localStorage.setItem('theme', defaultTheme);
        return;
      }
      document.documentElement.setAttribute('data-theme', 'dark');
    } catch (e) { /* noop */ }
  }, []);

  return (
    <>
      <Head>
        <meta name="default-theme" content={process.env.NEXT_PUBLIC_DEFAULT_THEME || ''} />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

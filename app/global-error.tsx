'use client';

import ErrorPage from './error';
import './globals.css';

export default function GlobalError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <ErrorPage {...props} />
      </body>
    </html>
  );
}

import * as React from "react";

/* lucide v1 removed brand icons due to trademark constraints — these are
   minimal monochrome glyphs scaled to the same 24px box. */

type IconProps = React.SVGAttributes<SVGSVGElement>;

export function FacebookIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      width="20"
      height="20"
      aria-hidden="true"
      {...props}
    >
      <path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.87.27-1.46 1.52-1.46H16.6V4.46a21 21 0 0 0-2.27-.12c-2.25 0-3.79 1.37-3.79 3.9V10.5H8v3h2.54V21h2.96Z" />
    </svg>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="20"
      height="20"
      aria-hidden="true"
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.9" fill="currentColor" />
    </svg>
  );
}

export function TikTokIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      width="20"
      height="20"
      aria-hidden="true"
      {...props}
    >
      <path d="M15.5 3v3.4a4.6 4.6 0 0 0 4.5 4.5v3a7.6 7.6 0 0 1-4.5-1.4v6a5.5 5.5 0 1 1-5.5-5.5c.34 0 .67.03 1 .1v3.2a2.5 2.5 0 1 0 1.5 2.3V3h3z" />
    </svg>
  );
}

export function YouTubeIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      width="20"
      height="20"
      aria-hidden="true"
      {...props}
    >
      <path d="M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.27 5 12 5 12 5s-6.27 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2 26.1 26.1 0 0 0 2 12c0 1.6.13 3.2.4 4.8a2.5 2.5 0 0 0 1.76 1.77C5.73 19 12 19 12 19s6.27 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77c.27-1.6.4-3.2.4-4.8 0-1.6-.13-3.2-.4-4.8ZM10 15V9l5.2 3L10 15Z" />
    </svg>
  );
}

export function WhatsAppIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      width="20"
      height="20"
      aria-hidden="true"
      {...props}
    >
      <path d="M12.04 2.5c-5.27 0-9.54 4.26-9.54 9.5 0 1.67.44 3.3 1.27 4.74L2.5 21.5l4.9-1.26a9.55 9.55 0 0 0 4.64 1.18h.01c5.26 0 9.53-4.26 9.53-9.5 0-2.53-.99-4.92-2.79-6.71A9.5 9.5 0 0 0 12.04 2.5Zm0 17.27h-.01a7.95 7.95 0 0 1-4.04-1.1l-.29-.17-2.89.74.78-2.79-.19-.3a7.81 7.81 0 0 1-1.22-4.16c0-4.34 3.55-7.87 7.91-7.87 2.11 0 4.1.82 5.6 2.3a7.78 7.78 0 0 1 2.32 5.58c0 4.34-3.55 7.77-7.97 7.77Zm4.36-5.85c-.24-.12-1.41-.69-1.63-.77-.22-.08-.38-.12-.54.12-.16.24-.62.77-.76.93-.14.16-.28.18-.52.06a6.5 6.5 0 0 1-1.92-1.18 7.13 7.13 0 0 1-1.33-1.65c-.14-.24-.01-.37.1-.49.1-.1.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.19-.46-.39-.4-.54-.4l-.46-.01a.88.88 0 0 0-.64.3c-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.7 2.6 4.13 3.65.58.25 1.03.4 1.38.51.58.18 1.1.16 1.52.1.46-.07 1.41-.58 1.61-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  );
}

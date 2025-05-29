"use client";
import { Turnstile } from '@marsidev/react-turnstile';

export default function TurnstileWidget({ onSuccess, onError, onExpire }) {
  return (
    <Turnstile
      siteKey={process.env.NEXT_PUBLIC_CLOUDFARE_TURNSTILE_SITE_KEY}
      onSuccess={onSuccess}
      onError={onError}
      onExpire={onExpire}
      options={{
        theme: "light",
        size: "normal"
      }}
    />
  );
} 
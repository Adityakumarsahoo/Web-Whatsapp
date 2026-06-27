import React, { useState } from "react";

interface UserAvatarProps {
  src?: string;
  name: string;
  className?: string;
}

export default function UserAvatar({ src, name, className = "w-10 h-10" }: UserAvatarProps) {
  const [error, setError] = useState(false);

  // Generate initials
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "?";

  // Generate stable bg color based on name
  const colors = [
    "bg-emerald-600",
    "bg-blue-600",
    "bg-orange-600",
    "bg-violet-600",
    "bg-pink-600",
    "bg-sky-600",
    "bg-teal-600"
  ];
  
  let charCodeSum = 0;
  for (let i = 0; i < (name || "").length; i++) {
    charCodeSum += name.charCodeAt(i);
  }
  const colorClass = colors[charCodeSum % colors.length];

  // Safeguard: Check if src needs base64 encoding
  let processedSrc = src;
  if (src && src.startsWith("data:image/svg+xml;utf8,")) {
    try {
      const rawSvg = src.replace("data:image/svg+xml;utf8,", "");
      // Convert to base64 safely
      processedSrc = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(rawSvg)));
    } catch (e) {
      console.error("Failed to encode SVG", e);
    }
  }

  if (error || !src) {
    return (
      <div
        className={`${className} rounded-full flex items-center justify-center text-white font-extrabold text-[11px] select-none tracking-wider ${colorClass} border border-white/10 shrink-0`}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={processedSrc}
      alt={name}
      onError={() => setError(true)}
      className={`${className} rounded-full object-cover shrink-0`}
      referrerPolicy="no-referrer"
    />
  );
}

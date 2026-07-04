/**
 * Raw SVG markup for icons that come from the design handoff bundle and
 * aren't part of Ionicons. Rendered at runtime via react-native-svg's SvgXml
 * (no metro SVG-transformer needed for these two).
 */

export const AI_COACH_SVG = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="botFace" x1="5" y1="5" x2="19" y2="20" gradientUnits="userSpaceOnUse">
    <stop stop-color="#77F7FF"/>
    <stop offset=".45" stop-color="#7C5CFF"/>
    <stop offset="1" stop-color="#FF4FD8"/>
  </linearGradient>
  <linearGradient id="botGlow" x1="4" y1="4" x2="20" y2="21" gradientUnits="userSpaceOnUse">
    <stop stop-color="#00F5A0"/>
    <stop offset="1" stop-color="#8B5CFF"/>
  </linearGradient>
</defs>
<path d="M8.25 8.2h7.5c1.78 0 3.2 1.42 3.2 3.2v3.75c0 1.78-1.42 3.2-3.2 3.2h-7.5c-1.78 0-3.2-1.42-3.2-3.2V11.4c0-1.78 1.42-3.2 3.2-3.2Z" fill="#0C1020" stroke="url(#botFace)" stroke-width="1.35"/>
<path d="M12 8.2V5.55" stroke="url(#botGlow)" stroke-width="1.35"/>
<circle cx="12" cy="4.5" r="1.15" fill="#00F5A0"/>
<circle cx="9.25" cy="13.05" r="1.15" fill="#77F7FF"/>
<circle cx="14.75" cy="13.05" r="1.15" fill="#FF4FD8"/>
<path d="M9.25 15.65c1.55.9 3.95.9 5.5 0" stroke="#FFD36A" stroke-width="1.1"/>
<path d="M4.8 12H3.2M20.8 12h-1.6" stroke="url(#botFace)" stroke-width="1.25"/>
<path d="M6.7 20.2h10.6" stroke="url(#botGlow)" stroke-width="1.25" opacity=".7"/>
</svg>
`;

export const STREAK_SVG = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<defs>
  <radialGradient id="flame" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(11.7 14.2) rotate(72) scale(9.5 6.8)">
    <stop stop-color="#FFF7B0"/>
    <stop offset=".42" stop-color="#FFD36A"/>
    <stop offset=".72" stop-color="#FF7A2F"/>
    <stop offset="1" stop-color="#E31B54"/>
  </radialGradient>
</defs>
<path d="M12.35 2.75c.7 2.9-.65 4.15-1.78 5.55-.83 1.04-1.23 2.05-.58 3.18.53-.95 1.42-1.72 2.42-2.12 3.35 2.75 4.3 5.65 2.88 8.13-1.4 2.45-5.12 3.15-7.62 1.25-2.45-1.86-2.95-5.5-.88-8.65 1.35-2.03 4.1-3.62 5.56-7.34Z" fill="url(#flame)"/>
<path d="M11.9 19.1c-1.85 0-3.28-1.25-3.28-2.92 0-1.35.82-2.4 2.42-3.68-.12 1.23.42 2.08 1.17 2.63.45-.72.72-1.42.72-2.25 1.4 1.15 2.15 2.12 2.15 3.4 0 1.6-1.35 2.82-3.18 2.82Z" fill="#FFF3B0" opacity=".9"/>
<path d="M8.1 9.9c.82-.98 1.85-1.82 2.55-2.82" stroke="white" stroke-opacity=".5" stroke-width=".9" stroke-linecap="round"/>
</svg>
`;

export const AWARD_SVG = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="crown" x1="4" y1="5" x2="20" y2="20" gradientUnits="userSpaceOnUse">
    <stop stop-color="#FFF7C2"/>
    <stop offset=".36" stop-color="#FFD36A"/>
    <stop offset=".72" stop-color="#FF9A3D"/>
    <stop offset="1" stop-color="#8B5CFF"/>
  </linearGradient>
  <linearGradient id="gem" x1="9" y1="9" x2="15" y2="16" gradientUnits="userSpaceOnUse">
    <stop stop-color="#C9FFFF"/>
    <stop offset="1" stop-color="#00F5A0"/>
  </linearGradient>
</defs>
<path d="M4.75 8.05 8.65 11.7 12 5.35l3.35 6.35 3.9-3.65-1.25 9.15H6L4.75 8.05Z" fill="url(#crown)"/>
<path d="M4.75 8.05 8.65 11.7 12 5.35l3.35 6.35 3.9-3.65-1.25 9.15H6L4.75 8.05Z" stroke="#FFF2B2" stroke-width=".85"/>
<path d="M10.25 12.2 12 10.45l1.75 1.75L12 14.05l-1.75-1.85Z" fill="url(#gem)"/>
<path d="M7.1 19.25h9.8" stroke="url(#crown)" stroke-width="1.6"/>
<path d="M7.6 9.2c.48.7.94 1.08 1.45 1.45" stroke="white" stroke-opacity=".55" stroke-width=".85" stroke-linecap="round"/>
</svg>
`;

export const PREMIUM_SVG = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="gold" x1="6" y1="3" x2="18" y2="21" gradientUnits="userSpaceOnUse">
    <stop stop-color="#FFF2A8"/>
    <stop offset=".45" stop-color="#FFD36A"/>
    <stop offset="1" stop-color="#B87918"/>
  </linearGradient>
  <linearGradient id="violet" x1="4" y1="7" x2="20" y2="21" gradientUnits="userSpaceOnUse">
    <stop stop-color="#8B5CFF"/>
    <stop offset="1" stop-color="#00D1FF"/>
  </linearGradient>
</defs>
<path d="M8.15 3.75h7.7l-.62 5.05c-.25 2.05-1.92 3.58-3.23 3.58s-2.98-1.53-3.23-3.58L8.15 3.75Z" fill="url(#gold)"/>
<path d="M8.15 3.75h7.7l-.62 5.05c-.25 2.05-1.92 3.58-3.23 3.58s-2.98-1.53-3.23-3.58L8.15 3.75Z" stroke="#FFEFA8" stroke-width=".85"/>
<path d="M8.35 5.6H5.85c0 2.6 1.32 4.08 3.43 4.28M15.65 5.6h2.5c0 2.6-1.32 4.08-3.43 4.28" stroke="url(#gold)" stroke-width="1.25"/>
<path d="M12 12.45v3.15" stroke="url(#violet)" stroke-width="1.55"/>
<path d="M8.4 20.25h7.2c.55 0 1-.45 1-1v-.4c0-.55-.45-1-1-1H8.4c-.55 0-1 .45-1 1v.4c0 .55.45 1 1 1Z" fill="url(#violet)" opacity=".9"/>
<path d="M10.3 7.6 12 6.5l1.7 1.1-.5 1.95h-2.4L10.3 7.6Z" fill="#07101B" opacity=".65"/>
</svg>
`;

export const GOOGLE_SVG = `
<svg width="24" height="24" viewBox="0 0 294 300" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M150 122.729V180.82H230.727C227.183 199.502 216.545 215.321 200.59 225.957L249.272 263.731C277.636 237.55 294 199.094 294 153.412C294 142.776 293.046 132.548 291.273 122.73L150 122.729Z" fill="#4285F4"/>
<path d="M65.9342 178.553L54.9546 186.958L16.0898 217.23C40.7719 266.185 91.3596 300.004 149.996 300.004C190.496 300.004 224.45 286.64 249.269 263.731L200.587 225.958C187.223 234.958 170.177 240.413 149.996 240.413C110.996 240.413 77.8602 214.095 65.9955 178.639L65.9342 178.553Z" fill="#34A853"/>
<path d="M16.0899 82.7734C5.86309 102.955 0 125.728 0 150.001C0 174.273 5.86309 197.047 16.0899 217.228C16.0899 217.363 66.0004 178.5 66.0004 178.5C63.0004 169.5 61.2272 159.955 61.2272 149.999C61.2272 140.043 63.0004 130.498 66.0004 121.498L16.0899 82.7734Z" fill="#FBBC05"/>
<path d="M149.999 59.7279C172.091 59.7279 191.727 67.3642 207.409 82.0918L250.364 39.1373C224.318 14.8647 190.5 0 149.999 0C91.3627 0 40.7719 33.6821 16.0898 82.7738L65.9988 121.502C77.8619 86.0462 110.999 59.7279 149.999 59.7279Z" fill="#EA4335"/>
</svg>
`;

export const FAVORITE_SVG = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="heartRim" x1="5" y1="5" x2="19" y2="20" gradientUnits="userSpaceOnUse">
    <stop stop-color="#C7C8E8"/>
    <stop offset=".6" stop-color="#9697BE"/>
    <stop offset="1" stop-color="#7D75FF"/>
  </linearGradient>
</defs>
<path d="M12 20.05s-7.35-4.45-7.35-9.72c0-2.32 1.73-4.08 3.95-4.08 1.32 0 2.5.63 3.4 1.82.9-1.19 2.08-1.82 3.4-1.82 2.22 0 3.95 1.76 3.95 4.08 0 5.27-7.35 9.72-7.35 9.72Z" stroke="url(#heartRim)" stroke-width="1.55"/>
<path d="M7.55 8.55c.46-.42 1.04-.63 1.7-.63" stroke="white" stroke-opacity=".42" stroke-width=".9" stroke-linecap="round"/>
</svg>
`;

export const EMPTY_STATE_SVG = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="doc" x1="6" y1="3" x2="19" y2="21" gradientUnits="userSpaceOnUse">
    <stop stop-color="#E8E6FF"/>
    <stop offset=".5" stop-color="#9B95C8"/>
    <stop offset="1" stop-color="#5A5F88"/>
  </linearGradient>
  <linearGradient id="spark" x1="5" y1="6" x2="19" y2="18" gradientUnits="userSpaceOnUse">
    <stop stop-color="#00F5A0"/>
    <stop offset="1" stop-color="#FFD36A"/>
  </linearGradient>
</defs>
<path d="M7.1 3.5h7.25L18 7.15V19.3c0 .66-.54 1.2-1.2 1.2H7.1c-.66 0-1.2-.54-1.2-1.2V4.7c0-.66.54-1.2 1.2-1.2Z" fill="#0B0D16" stroke="url(#doc)" stroke-width="1.25"/>
<path d="M14.25 3.7v3.1c0 .33.27.6.6.6h3" stroke="url(#doc)" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M8.8 10.15h5.95M8.8 13.15h6.4M8.8 16.15h3.8" stroke="url(#doc)" stroke-width="1.05" opacity=".78"/>
<path d="M17.25 10.1l.58 1.18 1.3.19-.94.92.22 1.3-1.16-.61-1.16.61.22-1.3-.94-.92 1.3-.19.58-1.18Z" fill="url(#spark)" stroke="url(#spark)" stroke-width=".55"/>
<path d="M4.3 18.3h3" stroke="url(#spark)" stroke-width="1.1" stroke-linecap="round" opacity=".65"/>
</svg>
`;

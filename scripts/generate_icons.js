const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');

// 1. Full Icon SVG (1024 x 1024)
const fullIconSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F766E"/>
      <stop offset="50%" stop-color="#094B46"/>
      <stop offset="100%" stop-color="#042F2E"/>
    </linearGradient>

    <!-- Gold Gradient -->
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE68A"/>
      <stop offset="40%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>

    <!-- Subtle Book Glow -->
    <linearGradient id="bookGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="70%" stop-color="#F1F5F9"/>
      <stop offset="100%" stop-color="#CBD5E1"/>
    </linearGradient>

    <!-- Emerald Ring Accent -->
    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2DD4BF" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#0D9488" stop-opacity="0.05"/>
    </linearGradient>

    <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.45"/>
    </filter>

    <filter id="goldGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Background Base with Rounded Corners -->
  <rect width="1024" height="1024" fill="url(#bgGrad)" rx="220"/>

  <!-- Decorative Subtle Radial Rings -->
  <circle cx="512" cy="512" r="380" fill="none" stroke="url(#ringGrad)" stroke-width="3" stroke-dasharray="12 8"/>
  <circle cx="512" cy="512" r="420" fill="none" stroke="url(#ringGrad)" stroke-width="1.5"/>

  <!-- Main Group with Shadow -->
  <g filter="url(#dropShadow)">
    <!-- Crescent Moon (Top) -->
    <path d="M512,185 C575,185 628,232 638,293 C596,252 530,246 480,282 C430,318 412,382 436,438 C375,422 335,364 340,300 C345,236 420,185 512,185 Z"
          fill="url(#goldGrad)" filter="url(#goldGlow)"/>

    <!-- Star beside Crescent -->
    <path d="M570,225 L576,242 L594,242 L580,253 L585,270 L570,260 L555,270 L560,253 L546,242 L564,242 Z"
          fill="#FEF08A" filter="url(#goldGlow)"/>

    <!-- Open Quran Stand / Rehal Silhouette -->
    <path d="M300,720 L512,610 L724,720 L684,770 L512,680 L340,770 Z"
          fill="#063E3B" stroke="#0D9488" stroke-width="4"/>

    <!-- Left Book Page -->
    <path d="M504,400 C400,385 300,430 260,470 C245,485 240,510 240,535 L240,680 C240,700 255,715 275,705 C330,675 420,645 504,660 Z"
          fill="url(#bookGrad)" stroke="#E2E8F0" stroke-width="4"/>

    <!-- Left Page Inner Lines (Arabic script lines abstract) -->
    <path d="M290,520 Q390,495 475,510" stroke="#94A3B8" stroke-width="6" stroke-linecap="round"/>
    <path d="M290,555 Q390,530 475,545" stroke="#94A3B8" stroke-width="6" stroke-linecap="round"/>
    <path d="M290,590 Q390,565 475,580" stroke="#94A3B8" stroke-width="6" stroke-linecap="round"/>
    <path d="M320,625 Q395,605 475,615" stroke="url(#goldGrad)" stroke-width="7" stroke-linecap="round"/>

    <!-- Right Book Page -->
    <path d="M520,400 C624,385 724,430 764,470 C779,485 784,510 784,535 L784,680 C784,700 769,715 749,705 C694,675 604,645 520,660 Z"
          fill="url(#bookGrad)" stroke="#E2E8F0" stroke-width="4"/>

    <!-- Right Page Inner Lines -->
    <path d="M549,510 Q634,495 734,520" stroke="#94A3B8" stroke-width="6" stroke-linecap="round"/>
    <path d="M549,545 Q634,530 734,555" stroke="#94A3B8" stroke-width="6" stroke-linecap="round"/>
    <path d="M549,580 Q634,565 734,590" stroke="#94A3B8" stroke-width="6" stroke-linecap="round"/>
    <path d="M549,615 Q629,605 704,625" stroke="url(#goldGrad)" stroke-width="7" stroke-linecap="round"/>

    <!-- Book Spine & Golden Ribbon / Bookmark -->
    <path d="M504,395 C512,390 520,395 520,395 L520,740 L512,710 L504,740 Z"
          fill="url(#goldGrad)" filter="url(#goldGlow)"/>

    <!-- Sparkle Accents (Daily Inspiration & Finance) -->
    <g transform="translate(760, 360)">
      <path d="M0,-24 L6,-6 L24,0 L6,6 L0,24 L-6,6 L-24,0 L-6,-6 Z" fill="url(#goldGrad)"/>
    </g>
    <g transform="translate(250, 360) scale(0.7)">
      <path d="M0,-24 L6,-6 L24,0 L6,6 L0,24 L-6,6 L-24,0 L-6,-6 Z" fill="url(#goldGrad)"/>
    </g>
  </g>
</svg>
`;

// 2. Android Adaptive Icon Foreground (Centered inside 66% safe zone, transparent background)
const foregroundSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Gold Gradient -->
    <linearGradient id="fgGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE68A"/>
      <stop offset="40%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>

    <!-- Subtle Book Glow -->
    <linearGradient id="fgBookGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="70%" stop-color="#F8FAFC"/>
      <stop offset="100%" stop-color="#E2E8F0"/>
    </linearGradient>

    <filter id="fgShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Scale to 70% and center to perfectly fit Android Adaptive Icon Safe Zone -->
  <g transform="translate(512, 512) scale(0.74) translate(-512, -490)" filter="url(#fgShadow)">
    <!-- Crescent Moon (Top) -->
    <path d="M512,185 C575,185 628,232 638,293 C596,252 530,246 480,282 C430,318 412,382 436,438 C375,422 335,364 340,300 C345,236 420,185 512,185 Z"
          fill="url(#fgGoldGrad)"/>

    <!-- Star beside Crescent -->
    <path d="M570,225 L576,242 L594,242 L580,253 L585,270 L570,260 L555,270 L560,253 L546,242 L564,242 Z"
          fill="#FEF08A"/>

    <!-- Open Quran Stand / Rehal Silhouette -->
    <path d="M300,720 L512,610 L724,720 L684,770 L512,680 L340,770 Z"
          fill="#063E3B" stroke="#0D9488" stroke-width="4"/>

    <!-- Left Book Page -->
    <path d="M504,400 C400,385 300,430 260,470 C245,485 240,510 240,535 L240,680 C240,700 255,715 275,705 C330,675 420,645 504,660 Z"
          fill="url(#fgBookGrad)" stroke="#CBD5E1" stroke-width="4"/>

    <!-- Left Page Inner Lines -->
    <path d="M290,520 Q390,495 475,510" stroke="#94A3B8" stroke-width="6" stroke-linecap="round"/>
    <path d="M290,555 Q390,530 475,545" stroke="#94A3B8" stroke-width="6" stroke-linecap="round"/>
    <path d="M290,590 Q390,565 475,580" stroke="#94A3B8" stroke-width="6" stroke-linecap="round"/>
    <path d="M320,625 Q395,605 475,615" stroke="url(#fgGoldGrad)" stroke-width="7" stroke-linecap="round"/>

    <!-- Right Book Page -->
    <path d="M520,400 C624,385 724,430 764,470 C779,485 784,510 784,535 L784,680 C784,700 769,715 749,705 C694,675 604,645 520,660 Z"
          fill="url(#fgBookGrad)" stroke="#CBD5E1" stroke-width="4"/>

    <!-- Right Page Inner Lines -->
    <path d="M549,510 Q634,495 734,520" stroke="#94A3B8" stroke-width="6" stroke-linecap="round"/>
    <path d="M549,555 Q634,530 734,555" stroke="#94A3B8" stroke-width="6" stroke-linecap="round"/>
    <path d="M549,580 Q634,565 734,590" stroke="#94A3B8" stroke-width="6" stroke-linecap="round"/>
    <path d="M549,615 Q629,605 704,625" stroke="url(#fgGoldGrad)" stroke-width="7" stroke-linecap="round"/>

    <!-- Book Spine & Golden Ribbon -->
    <path d="M504,395 C512,390 520,395 520,395 L520,740 L512,710 L504,740 Z"
          fill="url(#fgGoldGrad)"/>

    <!-- Sparkle Accents -->
    <g transform="translate(760, 360)">
      <path d="M0,-24 L6,-6 L24,0 L6,6 L0,24 L-6,6 L-24,0 L-6,-6 Z" fill="url(#fgGoldGrad)"/>
    </g>
    <g transform="translate(250, 360) scale(0.7)">
      <path d="M0,-24 L6,-6 L24,0 L6,6 L0,24 L-6,6 L-24,0 L-6,-6 Z" fill="url(#fgGoldGrad)"/>
    </g>
  </g>
</svg>
`;

// 3. Android Adaptive Background SVG
const backgroundSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F766E"/>
      <stop offset="50%" stop-color="#094B46"/>
      <stop offset="100%" stop-color="#042F2E"/>
    </linearGradient>
    <radialGradient id="ambientGlow" cx="50%" cy="45%" r="50%">
      <stop offset="0%" stop-color="#2DD4BF" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#042F2E" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bgGrad2)"/>
  <rect width="1024" height="1024" fill="url(#ambientGlow)"/>
</svg>
`;

async function generateAllIcons() {
  console.log('Generating DalAy App Icons...');

  // 1. icon.png (1024x1024)
  await sharp(Buffer.from(fullIconSvg))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(ASSETS_DIR, 'icon.png'));
  console.log('Generated assets/icon.png');

  // 2. android-icon-foreground.png (1024x1024)
  await sharp(Buffer.from(foregroundSvg))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(ASSETS_DIR, 'android-icon-foreground.png'));
  console.log('Generated assets/android-icon-foreground.png');

  // 3. android-icon-background.png (1024x1024)
  await sharp(Buffer.from(backgroundSvg))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(ASSETS_DIR, 'android-icon-background.png'));
  console.log('Generated assets/android-icon-background.png');

  // 4. splash-icon.png (1024x1024)
  await sharp(Buffer.from(foregroundSvg))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(ASSETS_DIR, 'splash-icon.png'));
  console.log('Generated assets/splash-icon.png');

  // 5. favicon.png (48x48)
  await sharp(Buffer.from(fullIconSvg))
    .resize(48, 48)
    .png()
    .toFile(path.join(ASSETS_DIR, 'favicon.png'));
  console.log('Generated assets/favicon.png');

  // 6. adaptive-icon.png (1024x1024)
  await sharp(Buffer.from(fullIconSvg))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(ASSETS_DIR, 'adaptive-icon.png'));
  console.log('Generated assets/adaptive-icon.png');

  console.log('All DalAy icons generated successfully!');
}

generateAllIcons().catch(err => {
  console.error('Icon generation failed:', err);
  process.exit(1);
});

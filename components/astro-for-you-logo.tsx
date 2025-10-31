interface AstroForYouLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function AstroForYouLogo({ 
  className = "", 
  width = 200, 
  height = 50 
}: AstroForYouLogoProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 400 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Astrology Star Icon */}
      <g transform="translate(10, 8)">
        {/* Main star */}
        <path
          d="M30 10 L34 22 L46 22 L37 30 L41 42 L30 34 L19 42 L23 30 L14 22 L26 22 Z"
          fill="#753192"
          stroke="#5a2570"
          strokeWidth="0.5"
        />
        {/* Inner star glow */}
        <path
          d="M30 15 L32 24 L41 24 L35 29 L37 38 L30 33 L23 38 L25 29 L19 24 L28 24 Z"
          fill="#9a4db8"
          opacity="0.6"
        />
        {/* Center circle */}
        <circle
          cx="30"
          cy="28"
          r="4"
          fill="#753192"
        />
        {/* Small decorative stars */}
        <path
          d="M15 15 L16 18 L19 18 L17 20 L18 23 L15 21 L12 23 L13 20 L11 18 L14 18 Z"
          fill="#753192"
          opacity="0.4"
        />
        <path
          d="M45 35 L46 38 L49 38 L47 40 L48 43 L45 41 L42 43 L43 40 L41 38 L44 38 Z"
          fill="#753192"
          opacity="0.4"
        />
        {/* Celestial elements */}
        <circle cx="20" cy="45" r="2" fill="#753192" opacity="0.3" />
        <circle cx="40" cy="15" r="1.5" fill="#753192" opacity="0.5" />
      </g>
      
      {/* Text - Horizontal Layout */}
      <g transform="translate(80, 25)">
        {/* Astro */}
        <text
          x="0"
          y="25"
          fill="#1a1a1a"
          fontSize="30"
          fontWeight="700"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="1px"
        >
          Astro
        </text>
        
        {/* ForYou - positioned with proper spacing */}
        <text
          x="85"
          y="25"
          fill="#753192"
          fontSize="30"
          fontWeight="700"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="1px"
        >
          ForYou
        </text>
      </g>
      
      {/* Decorative celestial elements */}
      <circle cx="320" cy="20" r="2.5" fill="#753192" opacity="0.3" />
      <circle cx="335" cy="30" r="2" fill="#753192" opacity="0.5" />
      <circle cx="350" cy="15" r="2" fill="#753192" opacity="0.4" />
      <path d="M365 25 L366 27 L368 27 L367 28 L368 30 L366 29 L364 30 L365 28 L363 27 L365 27 Z" fill="#753192" opacity="0.4" />
    </svg>
  );
}
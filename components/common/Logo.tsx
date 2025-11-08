import React from 'react';

const Logo = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 132 153"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="ElevateManager Logo"
  >
    <defs>
      <linearGradient id="logo-grad-1" x1="80.5" y1="8" x2="101.5" y2="44">
        <stop stopColor="#00D0B0" />
        <stop offset="1" stopColor="#0F9DD9" />
      </linearGradient>
      <linearGradient id="logo-grad-2" x1="28" y1="74.5" x2="54" y2="108.5">
        <stop stopColor="#8735C0" />
        <stop offset="1" stopColor="#3069B5" />
      </linearGradient>
      <linearGradient id="logo-grad-3" x1="80" y1="89.5" x2="102" y2="133.5">
        <stop stopColor="#A346B5" />
        <stop offset="1" stopColor="#95D146" />
      </linearGradient>
    </defs>
    <g transform="translate(0, 10)">
        {/* Dark 3D side faces */}
        <path d="M66 41.5L16 66.5V101.5L66 76.5V41.5Z" fill="#3B2677" />
        <path d="M66 81.5L16 106.5V141.5L66 116.5V81.5Z" fill="#692C94" />
        <path d="M66 41.5L116 16.5V51.5L66 76.5V41.5Z" fill="#0D488E" />

        {/* Dark top face for depth */}
        <path d="M116 16.5L66 41.5L66 5L116 -20.5V16.5Z" fill="#0B2F64"/>
        
        {/* Main gradient faces */}
        <path d="M116 16.5L66 41.5L66 5L116 16.5Z" fill="url(#logo-grad-1)" />
        <path d="M16 66.5L66 41.5L66 76.5L16 101.5V66.5Z" fill="url(#logo-grad-2)" />
        <path d="M116 106.5L66 81.5L66 116.5L116 141.5V106.5Z" fill="url(#logo-grad-3)" />

        {/* Circuit Patterns */}
        <g stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5" fill="rgba(255, 255, 255, 0.6)">
            {/* Top section */}
            <circle cx="91" cy="28" r="3" />
            <circle cx="106" cy="34" r="2" />
            <circle cx="79" cy="20" r="2" />
            <path d="M91 28 L 100 31 M 79 20 L 88 26" fill="none"/>
            {/* Middle section */}
            <circle cx="41" cy="74" r="3" />
            <circle cx="26" cy="80" r="2" />
            <circle cx="53" cy="65" r="2" />
            <path d="M41 74 L 32 77 M 53 65 L 44 72" fill="none"/>
            {/* Bottom section */}
            <circle cx="91" cy="114" r="3" />
            <circle cx="106" cy="120" r="2" />
            <circle cx="79" cy="106" r="2" />
            <path d="M91 114 L 100 117 M 79 106 L 88 112" fill="none"/>
        </g>
    </g>
  </svg>
);

export default Logo;
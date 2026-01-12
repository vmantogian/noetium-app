export default function Logo({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 120 120" 
      width={size} 
      height={size}
      className={className}
    >
      <defs>
        <linearGradient id="logoGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#87F1FF', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#4EA6DC', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="logoGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#E32D91', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#C830CC', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      
      <g transform="translate(60, 60)">
        {/* Outer geometric segments */}
        <path d="M -8 -52 L 8 -52 L 12 -35 L -12 -35 Z" fill="#113285"/>
        <path d="M 25 -46 L 38 -38 L 28 -22 L 18 -30 Z" fill="#4EA6DC"/>
        <path d="M 46 -25 L 52 -8 L 35 -12 L 38 -22 Z" fill="#87F1FF"/>
        <path d="M 52 8 L 46 25 L 38 22 L 35 12 Z" fill="#113285"/>
        <path d="M 38 38 L 25 46 L 18 30 L 28 22 Z" fill="#4EA6DC"/>
        <path d="M 8 52 L -8 52 L -12 35 L 12 35 Z" fill="#87F1FF"/>
        <path d="M -25 46 L -38 38 L -28 22 L -18 30 Z" fill="#113285"/>
        <path d="M -46 25 L -52 8 L -35 12 L -38 22 Z" fill="#4EA6DC"/>
        <path d="M -52 -8 L -46 -25 L -38 -22 L -35 -12 Z" fill="#87F1FF"/>
        <path d="M -38 -38 L -25 -46 L -18 -30 L -28 -22 Z" fill="#113285"/>
        
        {/* Center play/learn triangle */}
        <path d="M -15 -22 L 28 0 L -15 22 Z" fill="url(#logoGrad2)"/>
        
        {/* Inner accent */}
        <path d="M -22 -14 L -10 -14 L -10 14 L -22 14 Z" fill="url(#logoGrad1)" opacity="0.7"/>
      </g>
    </svg>
  )
}

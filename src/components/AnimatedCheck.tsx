interface AnimatedCheckProps {
  size?: number;
  color?: string;
}

export default function AnimatedCheck({
  size = 64,
  color = 'oklch(0.61 0.22 264)',
}: AnimatedCheckProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 52 52"
      style={{ animation: 'pop-scale 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
    >
      <circle
        cx="26"
        cy="26"
        r="24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        opacity="0.25"
      />
      <path
        fill="none"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 27l8 8 16-16"
        style={{
          strokeDasharray: 100,
          strokeDashoffset: 100,
          animation: 'check-draw 0.4s ease-out 0.3s forwards',
        }}
      />
    </svg>
  );
}

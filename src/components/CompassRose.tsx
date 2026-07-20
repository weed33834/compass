// 装饰性罗盘玫瑰 SVG（背景元素）
// 32 方位罗盘玫瑰的极简版本，仅用于装饰背景，brass 描边
export function CompassRose({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* 外圈 */}
      <circle cx="100" cy="100" r="98" />
      <circle cx="100" cy="100" r="80" />
      <circle cx="100" cy="100" r="50" />
      <circle cx="100" cy="100" r="3" fill="currentColor" />

      {/* 8 方位主线（每 45°） */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x1 = 100 + Math.cos(rad) * 50;
        const y1 = 100 + Math.sin(rad) * 50;
        const x2 = 100 + Math.cos(rad) * 98;
        const y2 = 100 + Math.sin(rad) * 98;
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} />;
      })}

      {/* 主罗盘指针（N/E/S/W 四角菱形） */}
      <polygon points="100,2 110,100 100,98 90,100" fill="currentColor" opacity="0.8" />
      <polygon points="100,198 110,100 100,102 90,100" fill="currentColor" opacity="0.4" />
      <polygon points="2,100 100,90 98,100 100,110" fill="currentColor" opacity="0.4" />
      <polygon points="198,100 100,90 102,100 100,110" fill="currentColor" opacity="0.4" />

      {/* N 标识 */}
      <text
        x="100"
        y="20"
        textAnchor="middle"
        fontSize="10"
        fontFamily="Georgia, serif"
        fontWeight="bold"
        fill="currentColor"
        stroke="none"
      >
        N
      </text>
    </svg>
  );
}

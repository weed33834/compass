// 航海主题 SVG 插画集
// 用于空状态、欢迎卡、认证页、404 等位置
// 风格：brass 描边 + 半透明色块，与 CompassRose 一致
// 用法：<Illustration name="empty-fleet" className="h-40 w-40 text-brass/60" />

type IllustrationName =
  | "empty-fleet"
  | "empty-workshop"
  | "empty-wrongbook"
  | "empty-logbook"
  | "empty-analytics"
  | "empty-study"
  | "auth-login"
  | "auth-register"
  | "not-found"
  | "celebrate"
  | "welcome-captain";

const ILLUSTRATIONS: Record<IllustrationName, React.ReactNode> = {
  // 空船舰队 — 港湾里的空船
  "empty-fleet": (
    <>
      <circle cx="100" cy="100" r="85" strokeDasharray="4 4" opacity="0.3" />
      {/* 船体 */}
      <path d="M 45 115 Q 100 145 155 115 L 145 135 Q 100 155 55 135 Z" fill="currentColor" opacity="0.15" />
      {/* 桅杆 */}
      <line x1="100" y1="115" x2="100" y2="45" />
      {/* 帆（收起状态） */}
      <path d="M 100 50 L 100 100 M 92 55 Q 100 50 108 55 L 108 95 Q 100 100 92 95 Z" opacity="0.5" />
      {/* 旗 */}
      <path d="M 100 45 L 115 50 L 100 55 Z" fill="currentColor" opacity="0.6" />
      {/* 水波 */}
      <path d="M 20 150 Q 35 145 50 150 T 80 150 T 110 150 T 140 150 T 170 150" opacity="0.4" />
      <path d="M 30 162 Q 45 157 60 162 T 90 162 T 120 162 T 150 162" opacity="0.3" />
    </>
  ),

  // 空工坊 — 未完成的船骨
  "empty-workshop": (
    <>
      <circle cx="100" cy="100" r="85" strokeDasharray="4 4" opacity="0.3" />
      {/* 龙骨 */}
      <line x1="100" y1="40" x2="100" y2="160" />
      {/* 肋骨（左右对称） */}
      <path d="M 100 60 Q 70 65 55 80" opacity="0.6" />
      <path d="M 100 60 Q 130 65 145 80" opacity="0.6" />
      <path d="M 100 85 Q 65 90 50 110" opacity="0.6" />
      <path d="M 100 85 Q 135 90 150 110" opacity="0.6" />
      <path d="M 100 110 Q 62 115 48 140" opacity="0.5" />
      <path d="M 100 110 Q 138 115 152 140" opacity="0.5" />
      {/* 工具 */}
      <circle cx="35" cy="150" r="4" opacity="0.4" />
      <line x1="30" y1="150" x2="25" y2="160" opacity="0.4" />
      <line x1="40" y1="150" x2="45" y2="160" opacity="0.4" />
      {/* 脚手架 */}
      <line x1="20" y1="40" x2="20" y2="160" opacity="0.3" />
      <line x1="180" y1="40" x2="180" y2="160" opacity="0.3" />
      <line x1="20" y1="60" x2="180" y2="60" opacity="0.2" />
    </>
  ),

  // 空漂流瓶 — 海面空瓶
  "empty-wrongbook": (
    <>
      <circle cx="100" cy="100" r="85" strokeDasharray="4 4" opacity="0.3" />
      {/* 瓶身 */}
      <path d="M 75 85 L 75 130 Q 75 140 85 140 L 115 140 Q 125 140 125 130 L 125 85 L 120 80 L 120 72 L 80 72 L 80 80 Z" fill="currentColor" opacity="0.1" />
      {/* 瓶颈 */}
      <rect x="85" y="65" width="30" height="10" rx="2" opacity="0.5" />
      {/* 软木塞 */}
      <rect x="86" y="60" width="28" height="6" rx="1" fill="currentColor" opacity="0.6" />
      {/* 高光 */}
      <line x1="82" y1="90" x2="82" y2="125" opacity="0.3" strokeWidth="1.5" />
      {/* 水波 */}
      <path d="M 15 155 Q 35 150 55 155 T 95 155 T 135 155 T 175 155" opacity="0.4" />
      <path d="M 25 168 Q 45 163 65 168 T 105 168 T 145 168" opacity="0.3" />
      {/* 月光 */}
      <circle cx="155" cy="45" r="8" opacity="0.3" />
      <circle cx="155" cy="45" r="12" opacity="0.15" strokeWidth="0.3" />
    </>
  ),

  // 空日志 — 摊开的空白本子
  "empty-logbook": (
    <>
      <circle cx="100" cy="100" r="85" strokeDasharray="4 4" opacity="0.3" />
      {/* 本子 */}
      <path d="M 35 70 L 100 60 L 165 70 L 165 150 L 100 160 L 35 150 Z" fill="currentColor" opacity="0.08" />
      {/* 中线 */}
      <line x1="100" y1="60" x2="100" y2="160" opacity="0.4" />
      {/* 横线 */}
      <line x1="45" y1="85" x2="92" y2="80" opacity="0.2" />
      <line x1="108" y1="80" x2="155" y2="85" opacity="0.2" />
      <line x1="45" y1="100" x2="92" y2="95" opacity="0.2" />
      <line x1="108" y1="95" x2="155" y2="100" opacity="0.2" />
      <line x1="45" y1="115" x2="92" y2="110" opacity="0.2" />
      <line x1="108" y1="110" x2="155" y2="115" opacity="0.2" />
      <line x1="45" y1="130" x2="92" y2="125" opacity="0.2" />
      <line x1="108" y1="125" x2="155" y2="130" opacity="0.2" />
      {/* 羽毛笔 */}
      <line x1="130" y1="45" x2="155" y2="25" opacity="0.5" strokeWidth="1.5" />
      <path d="M 130 45 L 145 35 L 155 25 L 150 40 L 138 50 Z" fill="currentColor" opacity="0.3" />
      {/* 墨水瓶 */}
      <rect x="35" y="40" width="18" height="14" rx="2" opacity="0.4" />
      <circle cx="44" cy="40" r="4" opacity="0.5" />
    </>
  ),

  // 空分析 — 空白星图
  "empty-analytics": (
    <>
      <circle cx="100" cy="100" r="85" strokeDasharray="4 4" opacity="0.3" />
      {/* 网格 */}
      <line x1="100" y1="25" x2="100" y2="175" opacity="0.15" />
      <line x1="25" y1="100" x2="175" y2="100" opacity="0.15" />
      <line x1="47" y1="47" x2="153" y2="153" opacity="0.1" />
      <line x1="153" y1="47" x2="47" y2="153" opacity="0.1" />
      {/* 散落的星点 */}
      <circle cx="60" cy="55" r="1.5" fill="currentColor" opacity="0.6" />
      <circle cx="140" cy="60" r="1" fill="currentColor" opacity="0.4" />
      <circle cx="155" cy="120" r="1.5" fill="currentColor" opacity="0.5" />
      <circle cx="50" cy="140" r="1" fill="currentColor" opacity="0.4" />
      <circle cx="90" cy="45" r="1" fill="currentColor" opacity="0.5" />
      <circle cx="120" cy="155" r="1.5" fill="currentColor" opacity="0.4" />
      {/* 虚线连线（星座暗示） */}
      <path d="M 60 55 L 90 45 L 140 60" strokeDasharray="2 3" opacity="0.25" />
      <path d="M 50 140 L 120 155 L 155 120" strokeDasharray="2 3" opacity="0.25" />
      {/* 中心罗盘 */}
      <circle cx="100" cy="100" r="12" opacity="0.3" />
      <circle cx="100" cy="100" r="6" opacity="0.4" />
      <line x1="100" y1="88" x2="100" y2="112" opacity="0.4" />
      <line x1="88" y1="100" x2="112" y2="100" opacity="0.4" />
    </>
  ),

  // 空答题 — 抛锚的船
  "empty-study": (
    <>
      <circle cx="100" cy="100" r="85" strokeDasharray="4 4" opacity="0.3" />
      {/* 锚 */}
      <line x1="100" y1="45" x2="100" y2="120" strokeWidth="2" />
      <line x1="85" y1="60" x2="115" y2="60" strokeWidth="2" />
      <circle cx="100" cy="48" r="6" strokeWidth="1.5" fill="none" />
      {/* 锚钩 */}
      <path d="M 80 110 Q 75 130 100 135 Q 125 130 120 110" strokeWidth="2" fill="none" />
      <path d="M 80 110 L 72 105 M 120 110 L 128 105" strokeWidth="2" />
      {/* 水面 */}
      <path d="M 15 145 Q 35 140 55 145 T 95 145 T 135 145 T 175 145" opacity="0.4" />
      <path d="M 25 158 Q 45 153 65 158 T 105 158 T 145 158" opacity="0.3" />
      {/* 太阳/落日 */}
      <circle cx="155" cy="50" r="10" opacity="0.3" fill="currentColor" />
      <line x1="140" y1="50" x2="170" y2="50" opacity="0.2" />
    </>
  ),

  // 登录页 — 船长远眺
  "auth-login": (
    <>
      {/* 船首 */}
      <path d="M 30 180 Q 100 200 170 180 L 160 150 L 40 150 Z" fill="currentColor" opacity="0.12" />
      <line x1="40" y1="150" x2="160" y2="150" opacity="0.5" />
      {/* 桅杆 */}
      <line x1="100" y1="150" x2="100" y2="20" strokeWidth="1.5" />
      {/* 人影（船长） */}
      <circle cx="100" cy="95" r="8" opacity="0.7" fill="currentColor" />
      <path d="M 100 103 L 100 140 M 92 115 L 108 115 M 95 140 L 100 148 L 105 140" strokeWidth="2" />
      {/* 望远镜 */}
      <line x1="108" y1="110" x2="135" y2="100" strokeWidth="2.5" />
      <line x1="133" y1="99" x2="140" y2="97" strokeWidth="3" />
      {/* 海平线 */}
      <line x1="10" y1="175" x2="190" y2="175" opacity="0.3" />
      {/* 远处帆影 */}
      <path d="M 165 165 L 165 175 L 178 175 Z" opacity="0.3" />
      {/* 星/月 */}
      <circle cx="40" cy="40" r="1.5" fill="currentColor" opacity="0.6" />
      <circle cx="60" cy="55" r="1" fill="currentColor" opacity="0.4" />
      <circle cx="155" cy="35" r="2" fill="currentColor" opacity="0.5" />
    </>
  ),

  // 注册页 — 扬帆起航
  "auth-register": (
    <>
      {/* 船体 */}
      <path d="M 35 160 Q 100 180 165 160 L 155 140 L 45 140 Z" fill="currentColor" opacity="0.12" />
      {/* 桅杆 */}
      <line x1="100" y1="140" x2="100" y2="25" strokeWidth="1.5" />
      {/* 主帆（鼓起） */}
      <path d="M 100 30 Q 145 40 150 100 Q 130 110 100 105 Z" fill="currentColor" opacity="0.2" />
      <path d="M 100 30 Q 145 40 150 100 Q 130 110 100 105 Z" opacity="0.5" />
      {/* 前帆 */}
      <path d="M 100 35 Q 65 50 55 95 Q 75 105 100 100 Z" fill="currentColor" opacity="0.15" />
      <path d="M 100 35 Q 65 50 55 95 Q 75 105 100 100 Z" opacity="0.4" />
      {/* 旗 */}
      <path d="M 100 25 L 115 30 L 100 35 Z" fill="currentColor" opacity="0.7" />
      {/* 海浪 */}
      <path d="M 10 170 Q 30 165 50 170 T 90 170 T 130 170 T 170 170" opacity="0.4" />
      <path d="M 20 182 Q 40 177 60 182 T 100 182 T 140 182" opacity="0.3" />
      {/* 朝阳 */}
      <circle cx="160" cy="50" r="12" opacity="0.3" fill="currentColor" />
      <circle cx="160" cy="50" r="8" opacity="0.5" fill="currentColor" />
    </>
  ),

  // 404 — 迷航
  "not-found": (
    <>
      {/* 浓雾圆圈 */}
      <circle cx="100" cy="100" r="88" strokeDasharray="2 6" opacity="0.2" />
      {/* 破损罗盘 */}
      <circle cx="100" cy="100" r="55" opacity="0.4" />
      <circle cx="100" cy="100" r="40" opacity="0.3" strokeDasharray="3 3" />
      {/* 断裂的指针 */}
      <path d="M 100 50 L 108 100 L 100 95" fill="currentColor" opacity="0.6" />
      <path d="M 100 150 L 92 105" fill="currentColor" opacity="0.4" />
      {/* N 标识（倾斜） */}
      <text x="100" y="45" textAnchor="middle" fontSize="14" fontFamily="Georgia, serif" fontWeight="bold" fill="currentColor" stroke="none" transform="rotate(15 100 45)">N</text>
      {/* 迷雾波浪 */}
      <path d="M 20 170 Q 40 160 60 170 T 100 170 T 140 170 T 180 170" opacity="0.2" strokeDasharray="5 3" />
      <path d="M 10 30 Q 30 25 50 30 T 90 30 T 130 30 T 170 30" opacity="0.15" strokeDasharray="5 3" />
      {/* 问号 */}
      <text x="150" y="90" textAnchor="middle" fontSize="20" fontFamily="Georgia, serif" fill="currentColor" stroke="none" opacity="0.5">?</text>
      <text x="50" y="130" textAnchor="middle" fontSize="16" fontFamily="Georgia, serif" fill="currentColor" stroke="none" opacity="0.4">?</text>
    </>
  ),

  // 完成庆祝 — 抵港
  celebrate: (
    <>
      {/* 港口灯塔 */}
      <rect x="30" y="80" width="14" height="80" opacity="0.5" fill="currentColor" />
      <polygon points="28,80 46,80 37,65" fill="currentColor" opacity="0.6" />
      <circle cx="37" cy="73" r="3" fill="currentColor" opacity="0.8" />
      {/* 光束 */}
      <line x1="37" y1="73" x2="80" y2="55" opacity="0.3" strokeWidth="2" />
      <line x1="37" y1="73" x2="80" y2="90" opacity="0.2" strokeWidth="2" />
      {/* 船（抵港） */}
      <path d="M 80 150 Q 130 165 180 150 L 172 135 L 88 135 Z" fill="currentColor" opacity="0.15" />
      <line x1="130" y1="135" x2="130" y2="70" strokeWidth="1.5" />
      {/* 满帆 */}
      <path d="M 130 75 Q 160 85 165 120 Q 145 125 130 120 Z" fill="currentColor" opacity="0.2" />
      <path d="M 130 75 Q 160 85 165 120 Q 145 125 130 120 Z" opacity="0.5" />
      <path d="M 130 80 Q 105 90 100 120 Q 120 125 130 120 Z" fill="currentColor" opacity="0.15" />
      <path d="M 130 80 Q 105 90 100 120 Q 120 125 130 120 Z" opacity="0.4" />
      {/* 旗 */}
      <path d="M 130 70 L 145 75 L 130 80 Z" fill="currentColor" opacity="0.8" />
      {/* 水波 */}
      <path d="M 10 168 Q 30 163 50 168 T 90 168 T 130 168 T 170 168" opacity="0.4" />
      <path d="M 20 178 Q 40 173 60 178 T 100 178 T 140 178" opacity="0.3" />
      {/* 星花庆祝 */}
      <g opacity="0.6">
        <path d="M 60 40 L 62 46 L 68 48 L 62 50 L 60 56 L 58 50 L 52 48 L 58 46 Z" fill="currentColor" />
        <path d="M 175 45 L 176 49 L 180 50 L 176 51 L 175 55 L 174 51 L 170 50 L 174 49 Z" fill="currentColor" />
        <circle cx="100" cy="35" r="1.5" fill="currentColor" />
        <circle cx="155" cy="30" r="1" fill="currentColor" />
      </g>
    </>
  ),

  // 欢迎卡 — 老船长挥手
  "welcome-captain": (
    <>
      {/* 帽子 */}
      <path d="M 35 38 Q 50 28 65 38 L 68 42 L 32 42 Z" fill="currentColor" opacity="0.6" />
      <line x1="30" y1="42" x2="70" y2="42" strokeWidth="2" />
      <circle cx="50" cy="33" r="2" fill="currentColor" opacity="0.8" />
      {/* 脸 */}
      <circle cx="50" cy="55" r="10" fill="currentColor" opacity="0.2" />
      {/* 眼睛 */}
      <circle cx="46" cy="53" r="1" fill="currentColor" />
      <circle cx="54" cy="53" r="1" fill="currentColor" />
      {/* 笑 */}
      <path d="M 45 58 Q 50 62 55 58" fill="none" strokeWidth="1" />
      {/* 胡子 */}
      <path d="M 42 60 Q 50 66 58 60" opacity="0.4" fill="none" strokeWidth="1.5" />
      {/* 身体 */}
      <path d="M 38 65 L 62 65 L 65 95 L 35 95 Z" fill="currentColor" opacity="0.15" />
      {/* 挥手 */}
      <line x1="62" y1="70" x2="80" y2="55" strokeWidth="2.5" />
      <circle cx="82" cy="53" r="4" fill="currentColor" opacity="0.3" />
      <line x1="38" y1="70" x2="28" y2="82" strokeWidth="2.5" />
      <circle cx="26" cy="84" r="4" fill="currentColor" opacity="0.3" />
      {/* 烟斗 */}
      <line x1="55" y1="60" x2="62" y2="58" strokeWidth="1.5" />
      <circle cx="64" cy="58" r="2" fill="currentColor" opacity="0.4" />
      {/* 烟 */}
      <path d="M 64 56 Q 66 50 64 46 Q 62 42 65 38" opacity="0.3" fill="none" strokeWidth="1" />
    </>
  ),
};

export function Illustration({
  name,
  className,
}: {
  name: IllustrationName;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {ILLUSTRATIONS[name]}
    </svg>
  );
}

export type { IllustrationName };

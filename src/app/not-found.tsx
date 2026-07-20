import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { CompassRose } from "@/components/CompassRose";

// 根级 404 页面：航海主题文案 + 罗盘玫瑰装饰
// not-found.tsx 不接收 props，由 Next.js 在路由未匹配时自动渲染
export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-8 px-4 text-center">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10">
        <CompassRose className="h-[60vmin] w-[60vmin]" />
      </div>
      <div className="relative space-y-3">
        <p className="font-mono text-5xl text-brass">404</p>
        <h1 className="font-serif text-3xl text-ivory">航向偏离</h1>
        <p className="max-w-md text-sm text-ivory/60">
          这里没有你要找的航点。也许是罗盘偏了一度，也许是海图需要更新。
        </p>
      </div>
      <Link href="/compass" className={`relative ${buttonVariants({ variant: "primary", size: "md" })}`}>
        返回罗盘
      </Link>
    </div>
  );
}

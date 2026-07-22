import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { Illustration } from "@/components/Illustration";

// 根级 404 页面：航海主题文案 + 迷航插画
export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-8 px-4 text-center">
      <Illustration name="not-found" className="h-56 w-56 text-brass/40" />
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

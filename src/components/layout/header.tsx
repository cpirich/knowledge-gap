"use client";

import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { isStaticDemo } from "@/lib/demo/data";

const pageTitles: Record<string, string> = {
	"/": "Dashboard",
	"/upload": "Upload Papers",
	"/map": "Knowledge Map",
	"/contradictions": "Contradictions",
	"/gaps": "Gaps & Questions",
};

export function Header() {
	const pathname = usePathname();
	const title = pageTitles[pathname] ?? "Knowledge Gap Finder";

	return (
		<>
			{isStaticDemo && (
				<div className="flex h-8 items-center justify-center bg-amber-100 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200">
					Demo Mode — Viewing sample sleep research data
				</div>
			)}
			<header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator orientation="vertical" className="mr-2 h-4" />
				<h1 className="text-sm font-medium">{title}</h1>
			</header>
		</>
	);
}

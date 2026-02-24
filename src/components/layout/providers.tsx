"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider>
			{children}
			<Toaster />
		</SidebarProvider>
	);
}

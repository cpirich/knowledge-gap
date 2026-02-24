"use client";

import { useCallback, useState } from "react";
import type { ApiResponse, Paper } from "@/lib/types";

export function useUpload() {
	const [uploading, setUploading] = useState(false);
	const [progress, setProgress] = useState(0);

	const upload = useCallback(async (file: File): Promise<Paper | null> => {
		setUploading(true);
		setProgress(10);
		try {
			const formData = new FormData();
			formData.append("file", file);

			setProgress(30);
			const res = await fetch("/api/ingest", {
				method: "POST",
				body: formData,
			});

			setProgress(70);
			const json: ApiResponse<Paper> = await res.json();
			setProgress(100);

			if (json.success && json.data) {
				return json.data;
			}
			throw new Error(json.error?.message ?? "Upload failed");
		} finally {
			setTimeout(() => {
				setUploading(false);
				setProgress(0);
			}, 500);
		}
	}, []);

	return { upload, uploading, progress };
}

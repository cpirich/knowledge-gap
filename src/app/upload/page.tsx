"use client";

import { toast } from "sonner";
import { FileDropzone } from "@/components/upload/file-dropzone";
import { PaperList } from "@/components/upload/paper-list";
import { UploadProgress } from "@/components/upload/upload-progress";
import { usePapers } from "@/hooks/use-papers";
import { useUpload } from "@/hooks/use-upload";

export default function UploadPage() {
	const { papers, loading, refresh } = usePapers();
	const { upload, uploading, progress } = useUpload();

	const handleFilesSelected = async (files: File[]) => {
		for (const file of files) {
			try {
				await upload(file);
				toast.success(`Uploaded ${file.name}`);
				refresh();
			} catch (err) {
				toast.error(
					`Failed to upload ${file.name}: ${err instanceof Error ? err.message : "Unknown error"}`,
				);
			}
		}
	};

	const handleDelete = async (id: string) => {
		try {
			await fetch(`/api/papers/${id}`, { method: "DELETE" });
			toast.success("Paper deleted");
			refresh();
		} catch {
			toast.error("Failed to delete paper");
		}
	};

	return (
		<div className="mx-auto max-w-3xl space-y-6">
			<div>
				<h2 className="text-lg font-semibold">Upload Papers</h2>
				<p className="text-sm text-muted-foreground">
					Add academic papers to build your knowledge map
				</p>
			</div>
			<FileDropzone onFilesSelected={handleFilesSelected} disabled={uploading} />
			<UploadProgress progress={progress} visible={uploading} />
			<div>
				<h3 className="mb-3 text-sm font-medium">Uploaded Papers</h3>
				{loading ? (
					<p className="text-sm text-muted-foreground">Loading...</p>
				) : (
					<PaperList papers={papers} onDelete={handleDelete} />
				)}
			</div>
		</div>
	);
}

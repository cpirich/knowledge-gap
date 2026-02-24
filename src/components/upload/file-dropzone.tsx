"use client";

import { File, FileUp } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
	onFilesSelected: (files: File[]) => void;
	disabled?: boolean;
}

export function FileDropzone({ onFilesSelected, disabled }: FileDropzoneProps) {
	const [isDragging, setIsDragging] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleDragOver = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			if (!disabled) setIsDragging(true);
		},
		[disabled],
	);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragging(false);
			if (disabled) return;
			const files = Array.from(e.dataTransfer.files).filter(
				(f) => f.type === "application/pdf" || f.type === "text/plain",
			);
			if (files.length > 0) onFilesSelected(files);
		},
		[disabled, onFilesSelected],
	);

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const files = e.target.files ? Array.from(e.target.files) : [];
			if (files.length > 0) onFilesSelected(files);
			if (inputRef.current) inputRef.current.value = "";
		},
		[onFilesSelected],
	);

	return (
		<button
			type="button"
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
			onClick={() => !disabled && inputRef.current?.click()}
			disabled={disabled}
			className={cn(
				"flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed bg-transparent p-10 transition-colors",
				isDragging
					? "border-primary bg-primary/5"
					: "border-muted-foreground/25 hover:border-primary/50",
				disabled && "cursor-not-allowed opacity-50",
			)}
		>
			<div className="rounded-full bg-muted p-3">
				{isDragging ? (
					<File className="size-6 text-primary" />
				) : (
					<FileUp className="size-6 text-muted-foreground" />
				)}
			</div>
			<div className="text-center">
				<p className="text-sm font-medium">
					{isDragging ? "Drop files here" : "Drop PDF or text files"}
				</p>
				<p className="text-xs text-muted-foreground">or click to browse your files</p>
			</div>
			<input
				ref={inputRef}
				type="file"
				accept=".pdf,.txt,application/pdf,text/plain"
				multiple
				onChange={handleChange}
				className="hidden"
				disabled={disabled}
			/>
		</button>
	);
}

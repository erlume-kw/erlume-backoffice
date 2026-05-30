import { useRef, useState } from "react";
import { Upload, X, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadFile, type UploadFolder } from "@/lib/rest-client";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
	folder: UploadFolder;
	defaultUrls?: string[];
	onChange: (urls: string[]) => void;
	multiple?: boolean;
	accept?: string;
	label?: string;
}

function isImage(url: string) {
	return /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(url) ||
		url.includes("res.cloudinary.com");
}

export default function ImageUploader({
	folder,
	defaultUrls = [],
	onChange,
	multiple = true,
	accept = "image/jpeg,image/png,image/webp,image/gif,application/pdf",
	label = "Upload files",
}: ImageUploaderProps) {
	const [urls, setUrls] = useState<string[]>(defaultUrls);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	const handleFiles = async (files: FileList | null) => {
		if (!files || files.length === 0) return;
		setUploading(true);
		setError("");
		const newUrls: string[] = [];
		try {
			for (const file of Array.from(files)) {
				const { url } = await uploadFile(file, folder);
				newUrls.push(url);
			}
			const updated = [...urls, ...newUrls];
			setUrls(updated);
			onChange(updated);
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : "Upload failed");
		} finally {
			setUploading(false);
			if (inputRef.current) inputRef.current.value = "";
		}
	};

	const remove = (index: number) => {
		const updated = urls.filter((_, i) => i !== index);
		setUrls(updated);
		onChange(updated);
	};

	return (
		<div className="space-y-2">
			{/* Thumbnails */}
			{urls.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{urls.map((url, i) => (
						<div key={url + i} className="relative group">
							{isImage(url) ? (
								<img
									src={url}
									alt={`upload-${i}`}
									className="h-20 w-20 rounded-md object-cover border border-border"
								/>
							) : (
								<div className="h-20 w-20 rounded-md border border-border bg-muted flex flex-col items-center justify-center gap-1">
									<FileText className="h-6 w-6 text-muted-foreground" />
									<span className="text-[10px] text-muted-foreground">PDF</span>
								</div>
							)}
							<button
								type="button"
								onClick={() => remove(i)}
								className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
								<X className="h-3 w-3" />
							</button>
						</div>
					))}
				</div>
			)}

			{/* Upload button */}
			<div className="flex items-center gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={uploading}
					onClick={() => inputRef.current?.click()}
					className="gap-2">
					{uploading ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<Upload className="h-4 w-4" />
					)}
					{uploading ? "Uploading…" : label}
				</Button>
				{urls.length > 0 && (
					<span className="text-xs text-muted-foreground">
						{urls.length} file{urls.length !== 1 ? "s" : ""}
					</span>
				)}
			</div>

			{error && <p className="text-xs text-destructive">{error}</p>}

			<input
				ref={inputRef}
				type="file"
				accept={accept}
				multiple={multiple}
				className="hidden"
				onChange={(e) => handleFiles(e.target.files)}
			/>
		</div>
	);
}

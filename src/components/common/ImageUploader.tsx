import { useRef, useState } from "react";
import { Upload, X, Loader2, FileText, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
	return /\.(jpe?g|png|webp|gif|avif|heic|heif)(\?|$)/i.test(url) ||
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
	const [urlInput, setUrlInput] = useState("");
	const [showUrlInput, setShowUrlInput] = useState(false);
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
			const updated = multiple ? [...urls, ...newUrls] : newUrls;
			setUrls(updated);
			onChange(updated);
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : "Upload failed");
		} finally {
			setUploading(false);
			if (inputRef.current) inputRef.current.value = "";
		}
	};

	const addUrl = () => {
		const trimmed = urlInput.trim();
		if (!trimmed) return;
		const updated = multiple ? [...urls, trimmed] : [trimmed];
		setUrls(updated);
		onChange(updated);
		setUrlInput("");
		setShowUrlInput(false);
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
							<img
								src={url}
								alt={`upload-${i}`}
								className="h-20 w-20 rounded-md object-cover border border-border bg-muted"
								onError={(e) => {
									const target = e.currentTarget;
									target.style.display = "none";
									const fallback = target.nextElementSibling as HTMLElement;
									if (fallback) fallback.style.display = "flex";
								}}
							/>
							<div className="h-20 w-20 rounded-md border border-border bg-muted flex-col items-center justify-center gap-1 hidden">
								<FileText className="h-6 w-6 text-muted-foreground" />
								<span className="text-[10px] text-muted-foreground truncate w-16 text-center px-1">
									{url.split("/").pop()?.slice(0, 12) ?? "file"}
								</span>
							</div>
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

			{/* URL input (shown when toggled) */}
			{showUrlInput && (
				<div className="flex gap-2">
					<Input
						value={urlInput}
						onChange={(e) => setUrlInput(e.target.value)}
						placeholder="Paste image URL..."
						className="h-8 text-xs"
						onKeyDown={(e) => {
							if (e.key === "Enter") { e.preventDefault(); addUrl(); }
							if (e.key === "Escape") { setShowUrlInput(false); setUrlInput(""); }
						}}
						autoFocus
					/>
					<Button type="button" size="sm" className="h-8 text-xs shrink-0" onClick={addUrl}>
						Add
					</Button>
					<Button type="button" size="sm" variant="ghost" className="h-8 text-xs shrink-0"
						onClick={() => { setShowUrlInput(false); setUrlInput(""); }}>
						Cancel
					</Button>
				</div>
			)}

			{/* Buttons */}
			<div className="flex items-center gap-2 flex-wrap">
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

				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="gap-2 text-muted-foreground"
					onClick={() => setShowUrlInput((v) => !v)}>
					<Link className="h-4 w-4" />
					Paste URL
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

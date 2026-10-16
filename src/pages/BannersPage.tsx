import { useCallback, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, Column } from "@/components/common/DataTable";
import { DetailPanel } from "@/components/common/DetailPanel";
import { useNotice } from "@/components/common/NoticeDialog";
import ImageUploader from "@/components/common/ImageUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Banner } from "@/types/models";
import { ArrowDown, ArrowUp, Eye, EyeOff } from "lucide-react";
import { restApi } from "@/lib/rest-client";
import { useResourceList } from "@/hooks/use-resource-list";

// Homepage carousel banners. The site shows the image full-width with a dark layer
// on top and the description + button from here (English, or Arabic on the Arabic
// site) — so keep text out of the image itself.

type FormState = {
	imageUrl: string[];
	description: string;
	descriptionAr: string;
	ctaLabel: string;
	ctaLabelAr: string;
	ctaUrl: string;
	showCta: boolean;
	isVisible: boolean;
};

const emptyForm: FormState = {
	imageUrl: [],
	description: "",
	descriptionAr: "",
	ctaLabel: "",
	ctaLabelAr: "",
	ctaUrl: "",
	showCta: true,
	isVisible: true,
};

export default function BannersPage() {
	const { confirm, notify } = useNotice();
	const [search, setSearch] = useState("");
	const [showForm, setShowForm] = useState(false);
	const [editing, setEditing] = useState<Banner | null>(null);
	const [form, setForm] = useState<FormState>(emptyForm);
	const [formError, setFormError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [busyId, setBusyId] = useState<string | null>(null);

	const loadBanners = useCallback(() => restApi.banners.getAll(), []);
	const { data, loading, error, reload } = useResourceList(loadBanners);

	const banners = useMemo(() => [...data].sort((a, b) => a.order - b.order), [data]);
	const filtered = banners.filter((b) => {
		if (!search) return true;
		const q = search.toLowerCase();
		return [b.description, b.descriptionAr, b.ctaLabel, b.ctaUrl].some((v) => (v ?? "").toLowerCase().includes(q));
	});

	const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

	const openCreate = () => {
		setEditing(null);
		setForm(emptyForm);
		setFormError(null);
		setShowForm(true);
	};

	const openEdit = (b: Banner) => {
		setEditing(b);
		setForm({
			imageUrl: b.imageUrl ? [b.imageUrl] : [],
			description: b.description ?? "",
			descriptionAr: b.descriptionAr ?? "",
			ctaLabel: b.ctaLabel ?? "",
			ctaLabelAr: b.ctaLabelAr ?? "",
			ctaUrl: b.ctaUrl ?? "",
			showCta: b.showCta,
			isVisible: b.isVisible,
		});
		setFormError(null);
		setShowForm(true);
	};

	const closeForm = () => {
		setShowForm(false);
		setEditing(null);
		setForm(emptyForm);
		setFormError(null);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setFormError(null);
		if (!form.imageUrl[0]) {
			setFormError("Upload a banner image first.");
			return;
		}
		if (form.showCta && (!form.ctaLabel.trim() || !form.ctaUrl.trim())) {
			setFormError("A banner with a button needs a button label and a link — or turn the button off.");
			return;
		}
		const payload = {
			imageUrl: form.imageUrl[0],
			description: form.description.trim(),
			descriptionAr: form.descriptionAr.trim(),
			ctaLabel: form.ctaLabel.trim(),
			ctaLabelAr: form.ctaLabelAr.trim(),
			ctaUrl: form.ctaUrl.trim(),
			showCta: form.showCta,
			isVisible: form.isVisible,
		};
		setSaving(true);
		try {
			if (editing) {
				await restApi.banners.update(editing._id, payload);
			} else {
				// New banners go to the end of the carousel
				const nextOrder = banners.reduce((max, b) => Math.max(max, b.order), 0) + 1;
				await restApi.banners.create({ ...payload, order: nextOrder });
			}
			await reload();
			closeForm();
		} catch (err) {
			setFormError(err instanceof Error ? err.message : "Failed to save banner");
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async (b: Banner) => {
		const ok = await confirm({
			title: "Delete banner?",
			message: `"${b.description || "Untitled banner"}" will be removed from the homepage. To take it down temporarily, hide it instead.`,
			confirmText: "Delete",
			destructive: true,
		});
		if (!ok) return;
		try {
			await restApi.banners.delete(b._id);
			await reload();
		} catch (err) {
			notify({ title: "Couldn't delete banner", message: err instanceof Error ? err.message : "Please try again." });
		}
	};

	const toggleVisible = async (b: Banner) => {
		setBusyId(b._id);
		try {
			await restApi.banners.update(b._id, { isVisible: !b.isVisible });
			await reload();
		} catch (err) {
			notify({ title: "Couldn't update banner", message: err instanceof Error ? err.message : "Please try again." });
		} finally {
			setBusyId(null);
		}
	};

	// Swap positions with the neighbour. `order` is unique, so park one banner on a
	// temporary number first.
	const move = async (b: Banner, dir: -1 | 1) => {
		const idx = banners.findIndex((x) => x._id === b._id);
		const other = banners[idx + dir];
		if (!other) return;
		setBusyId(b._id);
		try {
			const temp = banners.reduce((max, x) => Math.max(max, x.order), 0) + 1000;
			await restApi.banners.update(b._id, { order: temp });
			await restApi.banners.update(other._id, { order: b.order });
			await restApi.banners.update(b._id, { order: other.order });
		} catch (err) {
			notify({ title: "Couldn't reorder", message: err instanceof Error ? err.message : "Please try again." });
		} finally {
			await reload();
			setBusyId(null);
		}
	};

	const columns: Column<Banner>[] = [
		{
			key: "order",
			header: "#",
			render: (b) => {
				const idx = banners.findIndex((x) => x._id === b._id);
				return (
					<div className="flex items-center gap-1">
						<span className="w-5 text-center font-medium">{idx + 1}</span>
						<Button variant="ghost" size="icon" className="h-7 w-7" disabled={!!busyId || idx === 0 || !!search} onClick={() => void move(b, -1)} title="Move up">
							<ArrowUp className="h-4 w-4" />
						</Button>
						<Button variant="ghost" size="icon" className="h-7 w-7" disabled={!!busyId || idx === banners.length - 1 || !!search} onClick={() => void move(b, 1)} title="Move down">
							<ArrowDown className="h-4 w-4" />
						</Button>
					</div>
				);
			},
		},
		{
			key: "banner",
			header: "Banner",
			render: (b) => (
				<div className="flex items-center gap-3">
					<img src={b.imageUrl} alt="" className="h-14 w-28 shrink-0 rounded object-cover bg-muted" />
					<div className="min-w-0">
						<p className="font-medium text-foreground truncate max-w-[260px]">{b.description || "—"}</p>
						{b.descriptionAr && (
							<p className="text-sm text-muted-foreground truncate max-w-[260px]" dir="rtl">{b.descriptionAr}</p>
						)}
					</div>
				</div>
			),
		},
		{
			key: "cta",
			header: "Button",
			render: (b) =>
				b.showCta ? (
					<div className="text-sm">
						<p>{b.ctaLabel || "—"}</p>
						<p className="text-muted-foreground">{b.ctaUrl || "—"}</p>
					</div>
				) : (
					<span className="text-sm text-muted-foreground">No button</span>
				),
		},
		{
			key: "isVisible",
			header: "On site",
			render: (b) => (
				<Button variant="outline" size="sm" className="h-8 gap-1 text-xs" disabled={busyId === b._id} onClick={() => void toggleVisible(b)}>
					{b.isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
					{b.isVisible ? "Visible" : "Hidden"}
				</Button>
			),
		},
	];

	return (
		<AdminLayout>
			<PageHeader
				title="Banners"
				description="Homepage carousel — order, images, text and buttons"
				searchValue={search}
				onSearchChange={setSearch}
				searchPlaceholder="Search banners..."
				onRefresh={() => void reload()}
				refreshing={loading}
				onAdd={openCreate}
				addLabel="Add Banner"
			/>

			<div className="p-6">
				{(loading || error) && (
					<div className="text-sm text-muted-foreground mb-3">
						{loading ? "Loading banners..." : ""}
						{error ? ` ${error}` : ""}
					</div>
				)}
				<DataTable
					data={filtered}
					columns={columns}
					keyExtractor={(b) => b._id}
					onEdit={openEdit}
					onDelete={(b) => void handleDelete(b)}
				/>
			</div>

			<DetailPanel open={showForm} onClose={closeForm} title={editing ? "Edit Banner" : "Add Banner"} type="dialog" size="md">
				<form className="space-y-4" onSubmit={handleSubmit}>
					<div className="space-y-2">
						<Label>Image</Label>
						<ImageUploader
							key={editing?._id ?? "new"}
							folder="banners"
							defaultUrls={form.imageUrl}
							onChange={(urls) => set("imageUrl", urls)}
							multiple={false}
							accept="image/jpeg,image/png,image/webp"
							label="Upload image"
						/>
						<p className="text-xs text-muted-foreground">
							1440 × 634 frame, exported at 2x as JPG. No text in the image, and keep the subject centred — phones crop the sides.
						</p>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="description">Text</Label>
							<Textarea id="description" rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Discover curated pieces from…" />
						</div>
						<div className="space-y-2">
							<Label htmlFor="descriptionAr">Arabic text</Label>
							<Textarea id="descriptionAr" rows={2} dir="rtl" value={form.descriptionAr} onChange={(e) => set("descriptionAr", e.target.value)} placeholder="النص بالعربية" />
						</div>
					</div>

					<div className="flex items-center justify-between rounded-lg border p-3">
						<div>
							<p className="text-sm font-medium">Show a button</p>
							<p className="text-xs text-muted-foreground">e.g. "Shop the drop" → /drops</p>
						</div>
						<Switch checked={form.showCta} onCheckedChange={(v) => set("showCta", v)} />
					</div>

					{form.showCta && (
						<>
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="ctaLabel">Button label</Label>
									<Input id="ctaLabel" value={form.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} placeholder="Shop the drop" />
								</div>
								<div className="space-y-2">
									<Label htmlFor="ctaLabelAr">Arabic button label</Label>
									<Input id="ctaLabelAr" dir="rtl" value={form.ctaLabelAr} onChange={(e) => set("ctaLabelAr", e.target.value)} placeholder="تسوّق الدروب" />
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="ctaUrl">Button link</Label>
								<Input id="ctaUrl" value={form.ctaUrl} onChange={(e) => set("ctaUrl", e.target.value)} placeholder="/drops, /sell, /seller-policy or https://…" />
							</div>
						</>
					)}

					<div className="flex items-center justify-between rounded-lg border p-3">
						<div>
							<p className="text-sm font-medium">Visible on the site</p>
							<p className="text-xs text-muted-foreground">Turn off to take it down without deleting it.</p>
						</div>
						<Switch checked={form.isVisible} onCheckedChange={(v) => set("isVisible", v)} />
					</div>

					{formError && <p className="text-sm text-destructive">{formError}</p>}

					<div className="flex gap-3 pt-2">
						<Button type="button" variant="outline" className="flex-1" onClick={closeForm}>Cancel</Button>
						<Button type="submit" className="flex-1" disabled={saving}>
							{saving ? "Saving..." : editing ? "Save Changes" : "Add Banner"}
						</Button>
					</div>
				</form>
			</DetailPanel>
		</AdminLayout>
	);
}

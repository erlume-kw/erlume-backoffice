import { useCallback, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, Column } from "@/components/common/DataTable";
import { DetailPanel } from "@/components/common/DetailPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { Item, Outfit } from "@/types/models";
import { Shirt } from "lucide-react";
import { restApi } from "@/lib/rest-client";
import { useResourceList } from "@/hooks/use-resource-list";

export default function OutfitsPage() {
	const [search, setSearch] = useState("");
	const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
	const [showForm, setShowForm] = useState(false);
	const [editingOutfit, setEditingOutfit] = useState<Outfit | null>(null);
	const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
	const [itemSearch, setItemSearch] = useState("");
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [bulkLoading, setBulkLoading] = useState(false);
	const loadOutfits = useCallback(() => restApi.outfits.getAll(), []);
	const loadItems = useCallback(
		() => restApi.items.getAll({ limit: 500 }) as Promise<Item[]>,
		[],
	);
	const {
		data: outfits,
		loading,
		error,
		reload,
	} = useResourceList(loadOutfits);
	const { data: items, reload: reloadItems } = useResourceList(loadItems);
	const handleRefresh = () => { void Promise.all([reload(), reloadItems()]); };
	const itemLabelById = useMemo(
		() =>
			new Map(
				items.map((item) => [
					item._id,
					[item.itemName, item.brandName].filter(Boolean).join(" · ") ||
						item._id,
				]),
			),
		[items],
	);
	const filteredItems = useMemo(() => {
		if (!itemSearch) {
			return items;
		}
		const query = itemSearch.toLowerCase();
		return items.filter((item) => {
			const label =
				itemLabelById.get(item._id)?.toLowerCase() ?? item._id.toLowerCase();
			return (
				label.includes(query) ||
				item._id.toLowerCase().includes(query) ||
				(item.itemName ?? "").toLowerCase().includes(query) ||
				(item.brandName ?? "").toLowerCase().includes(query)
			);
		});
	}, [itemLabelById, itemSearch, items]);

	const columns: Column<Outfit>[] = [
		{
			key: "_select",
			header: (
				<Checkbox
					checked={
						filteredOutfits.length > 0 &&
						filteredOutfits.every((o) => selectedIds.includes(o._id))
					}
					onCheckedChange={(v) => {
						if (v) setSelectedIds(filteredOutfits.map((o) => o._id));
						else setSelectedIds([]);
					}}
				/>
			),
			render: (outfit) => (
				<Checkbox
					checked={selectedIds.includes(outfit._id)}
					onCheckedChange={(v) => {
						setSelectedIds((prev) =>
							v ? [...prev, outfit._id] : prev.filter((id) => id !== outfit._id),
						);
					}}
				/>
			),
		},
		{
			key: "outfit_title",
			header: "Outfit",
			render: (outfit) => (
				<div className="flex items-center gap-3">
					<div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
						<Shirt className="h-5 w-5 text-primary" />
					</div>
					<div>
						<p className="font-medium text-foreground">{outfit.outfit_title}</p>
						<p className="text-sm text-muted-foreground truncate max-w-[200px]">
							{outfit.outfit_tags?.join(" ") || "—"}
						</p>
					</div>
				</div>
			),
		},
		{
			key: "item_ids",
			header: "Items",
			render: (outfit) => (
				<span className="text-muted-foreground">
					{outfit.item_ids?.length ?? 0}
				</span>
			),
		},
	];

	const filteredOutfits = outfits.filter((outfit) => {
		return (
			search === "" ||
			(outfit.outfit_title ?? "").toLowerCase().includes(search.toLowerCase())
		);
	});

	const handleDelete = async (id: string) => {
		try {
			await restApi.outfits.delete(id);
			await reload();
		} catch (err) {
			console.error("Failed to delete outfit", err);
		}
	};

	const handleBulkDelete = async () => {
		if (!selectedIds.length) return;
		setBulkLoading(true);
		try {
			await Promise.all(selectedIds.map((id) => restApi.outfits.delete(id)));
			setSelectedIds([]);
			await reload();
		} catch (err) {
			console.error("Bulk delete failed", err);
		} finally {
			setBulkLoading(false);
		}
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		const outfit_title = String(formData.get("outfit_title") || "");
		const outfit_tags = String(formData.get("outfit_tags") || "")
			.split(/\s+/)
			.map((value) => value.trim())
			.filter(Boolean);
		const item_ids = selectedItemIds;

		const payload = {
			outfit_title,
			outfit_tags,
			item_ids,
			coverImageUrl: formCoverUrl[0] ?? undefined,
		};

		try {
			if (editingOutfit) {
				await restApi.outfits.update(editingOutfit._id, payload);
			} else {
				await restApi.outfits.create(payload);
			}
			await reload();
			setShowForm(false);
			setEditingOutfit(null);
		} catch (err) {
			console.error("Failed to save outfit", err);
		}
	};

	return (
		<AdminLayout>
			<PageHeader
				title="Outfits"
				description="Manage user-created outfit collections"
				searchValue={search}
				onSearchChange={setSearch}
				searchPlaceholder="Search outfits..."
				onRefresh={handleRefresh}
				refreshing={loading}
				onAdd={() => {
					setEditingOutfit(null);
					setSelectedItemIds([]);
					setItemSearch("");
					setShowForm(true);
				}}
				addLabel="Create Outfit"
			/>

			<div className="p-6">
				{(loading || error) && (
					<div className="text-sm text-muted-foreground mb-3">
						{loading ? "Loading outfits..." : ""}
						{error ? ` ${error}` : ""}
					</div>
				)}
				{selectedIds.length > 0 && (
					<div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 mb-2">
						<span className="text-xs font-medium text-muted-foreground">
							{selectedIds.length} selected
						</span>
						<div className="ml-auto">
							<Button
								variant="destructive"
								size="sm"
								className="h-8 text-xs"
								disabled={bulkLoading}
								onClick={() => void handleBulkDelete()}>
								Delete Selected
							</Button>
						</div>
					</div>
				)}
				<DataTable
					data={filteredOutfits}
					columns={columns}
					keyExtractor={(outfit) => outfit._id}
					onView={(outfit) => setSelectedOutfit(outfit)}
					onEdit={(outfit) => {
						setEditingOutfit(outfit);
						setSelectedItemIds(outfit.item_ids ?? []);
						setItemSearch("");
						setShowForm(true);
					}}
					onDelete={(outfit) => {
						void handleDelete(outfit._id);
					}}
				/>
			</div>

			{/* View Outfit Panel */}
			<DetailPanel
				open={!!selectedOutfit}
				onClose={() => setSelectedOutfit(null)}
				title="Outfit Details"
				description={selectedOutfit?.outfit_title}>
				{selectedOutfit && (
					<div className="space-y-6">
						<div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
							<Shirt className="h-16 w-16 text-muted-foreground" />
						</div>
						<div className="flex items-center justify-between">
							<h3 className="text-lg font-semibold">
								{selectedOutfit.outfit_title}
							</h3>
						</div>
						<p className="text-muted-foreground">
							{selectedOutfit.outfit_tags?.join(" ") || "—"}
						</p>
						<div className="grid grid-cols-2 gap-4">
							<div className="p-3 bg-muted/30 rounded-lg">
								<div className="flex items-center gap-2 mb-1">
									<Shirt className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm text-muted-foreground">Items</span>
								</div>
								<p className="text-lg font-semibold">
									{selectedOutfit.item_ids?.length ?? 0}
								</p>
							</div>
						</div>
						<Button
							variant="outline"
							className="w-full"
							onClick={() => {
								setEditingOutfit(selectedOutfit);
								setShowForm(true);
								setSelectedOutfit(null);
							}}>
							Edit Outfit
						</Button>
					</div>
				)}
			</DetailPanel>

			{/* Add/Edit Outfit Form */}
			<DetailPanel
				open={showForm}
				onClose={() => {
					setShowForm(false);
					setEditingOutfit(null);
					setSelectedItemIds([]);
					setItemSearch("");
				}}
				title={editingOutfit ? "Edit Outfit" : "Create Outfit"}
				type="dialog"
				size="md">
				<form className="space-y-4" onSubmit={handleSubmit}>
					<div className="space-y-2">
						<Label htmlFor="outfit_title">Title</Label>
						<Input
							id="outfit_title"
							name="outfit_title"
							defaultValue={editingOutfit?.outfit_title}
							placeholder="Enter outfit title"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="outfit_tags">Tags (comma separated)</Label>
						<Input
							id="outfit_tags"
							name="outfit_tags"
							defaultValue={editingOutfit?.outfit_tags?.join(" ")}
							placeholder="casual, summer"
						/>
					</div>
					<div className="space-y-2">
						<Label>Cover Image</Label>
						<ImageUploader
							folder="outfits"
							defaultUrls={formCoverUrl}
							onChange={setFormCoverUrl}
							multiple={false}
							accept="image/jpeg,image/png,image/webp"
							label="Upload cover"
						/>
					</div>
					<div className="space-y-2">
						<Label>Items</Label>
						<Input
							value={itemSearch}
							onChange={(event) => setItemSearch(event.target.value)}
							placeholder="Search items..."
						/>
						<div className="border border-input rounded-md p-3 max-h-56 overflow-y-auto space-y-2">
							{filteredItems.length === 0 && (
								<p className="text-sm text-muted-foreground">No items found.</p>
							)}
							{filteredItems.map((item) => (
								<label
									key={item._id}
									className="flex items-center gap-3 text-sm text-foreground">
									<Checkbox
										checked={selectedItemIds.includes(item._id)}
										onCheckedChange={(checked) => {
											setSelectedItemIds((prev) => {
												if (checked) {
													return prev.includes(item._id)
														? prev
														: [...prev, item._id];
												}
												return prev.filter((id) => id !== item._id);
											});
										}}
									/>
									<span className="truncate">
										{itemLabelById.get(item._id)}
									</span>
								</label>
							))}
						</div>
					</div>
					<div className="flex gap-3 pt-4">
						<Button
							type="button"
							variant="outline"
							className="flex-1"
							onClick={() => {
								setShowForm(false);
								setEditingOutfit(null);
							}}>
							Cancel
						</Button>
						<Button type="submit" className="flex-1">
							{editingOutfit ? "Save Changes" : "Create Outfit"}
						</Button>
					</div>
				</form>
			</DetailPanel>
		</AdminLayout>
	);
}

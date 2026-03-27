import { useCallback, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, Column } from "@/components/common/DataTable";
import { DetailPanel } from "@/components/common/DetailPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { Item, Outfit, OutfitItem } from "@/types/models";
import { Shirt } from "lucide-react";
import { restApi } from "@/lib/rest-client";
import { useResourceList } from "@/hooks/use-resource-list";

export default function OutfitItemsPage() {
	const [search, setSearch] = useState("");
	const [selectedOutfitItem, setSelectedOutfitItem] =
		useState<OutfitItem | null>(null);
	const [showForm, setShowForm] = useState(false);
	const [editingOutfitItem, setEditingOutfitItem] = useState<OutfitItem | null>(
		null,
	);
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [bulkLoading, setBulkLoading] = useState(false);
	const [itemSearch, setItemSearch] = useState("");
	const [outfitSearch, setOutfitSearch] = useState("");
	const [formItemId, setFormItemId] = useState("");
	const [formOutfitId, setFormOutfitId] = useState("");
	const [formFeatured, setFormFeatured] = useState(false);
	const loadOutfitItems = useCallback(() => restApi.outfititems.getAll(), []);
	const loadItems = useCallback(
		() => restApi.items.getAll() as Promise<Item[]>,
		[],
	);
	const loadOutfits = useCallback(
		() => restApi.outfits.getAll() as Promise<Outfit[]>,
		[],
	);
	const {
		data: outfitItems,
		loading,
		error,
		reload,
	} = useResourceList(loadOutfitItems);
	const { data: items } = useResourceList(loadItems);
	const { data: outfits } = useResourceList(loadOutfits);

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
	const outfitLabelById = useMemo(
		() =>
			new Map(
				outfits.map((outfit) => [
					outfit._id,
					outfit.outfit_title || outfit._id,
				]),
			),
		[outfits],
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
	const filteredOutfits = useMemo(() => {
		if (!outfitSearch) {
			return outfits;
		}
		const query = outfitSearch.toLowerCase();
		return outfits.filter((outfit) => {
			const label =
				outfitLabelById.get(outfit._id)?.toLowerCase() ??
				outfit._id.toLowerCase();
			return (
				label.includes(query) ||
				outfit._id.toLowerCase().includes(query) ||
				(outfit.outfit_title ?? "").toLowerCase().includes(query)
			);
		});
	}, [outfitLabelById, outfitSearch, outfits]);

	const safeOutfitItems = Array.isArray(outfitItems) ? outfitItems : [];
	const filteredOutfitItems = useMemo(() => {
		if (!search.trim()) return safeOutfitItems;
		const q = search.toLowerCase();
		return safeOutfitItems.filter(
			(oi) =>
				(outfitLabelById.get(oi.outfit_id) ?? oi.outfit_id)
					.toLowerCase()
					.includes(q) ||
				(itemLabelById.get(oi.item_id) ?? oi.item_id).toLowerCase().includes(q),
		);
	}, [safeOutfitItems, search, outfitLabelById, itemLabelById]);

	const allFilteredIds = filteredOutfitItems.map((oi) => oi._id);
	const allSelected =
		allFilteredIds.length > 0 &&
		allFilteredIds.every((id) => selectedIds.includes(id));

	const columns: Column<OutfitItem>[] = [
		{
			key: "_select",
			header: (
				<Checkbox
					checked={allSelected}
					onCheckedChange={(v) => {
						if (v) setSelectedIds(allFilteredIds);
						else setSelectedIds([]);
					}}
				/>
			),
			render: (oi) => (
				<Checkbox
					checked={selectedIds.includes(oi._id)}
					onCheckedChange={(v) => {
						setSelectedIds((prev) =>
							v ? [...prev, oi._id] : prev.filter((id) => id !== oi._id),
						);
					}}
				/>
			),
		},
		{
			key: "outfit_id",
			header: "Outfit",
			render: (outfitItem) => (
				<span className="text-muted-foreground">
					{outfitLabelById.get(outfitItem.outfit_id) ?? outfitItem.outfit_id}
				</span>
			),
		},
		{
			key: "item_id",
			header: "Item",
			render: (outfitItem) => (
				<span className="text-muted-foreground">
					{itemLabelById.get(outfitItem.item_id) ?? outfitItem.item_id}
				</span>
			),
		},
		{
			key: "featured_in_product",
			header: "Featured",
			render: (outfitItem) => (
				<span className="text-muted-foreground">
					{outfitItem.featured_in_product ? "Yes" : "No"}
				</span>
			),
		},
	];

	const handleBulkDelete = async () => {
		if (!selectedIds.length) return;
		setBulkLoading(true);
		try {
			await Promise.all(selectedIds.map((id) => restApi.outfititems.delete(id)));
			setSelectedIds([]);
			await reload();
		} catch (err) {
			console.error("Bulk delete failed", err);
		} finally {
			setBulkLoading(false);
		}
	};

	const handleDelete = async (id: string) => {
		try {
			await restApi.outfititems.delete(id);
			await reload();
		} catch (err) {
			console.error("Failed to delete outfit item", err);
		}
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const payload = {
			item_id: formItemId,
			outfit_id: formOutfitId,
			featured_in_product: formFeatured,
		};

		try {
			if (editingOutfitItem) {
				await restApi.outfititems.update(editingOutfitItem._id, payload);
			} else {
				await restApi.outfititems.create(payload);
			}
			await reload();
			setShowForm(false);
			setEditingOutfitItem(null);
		} catch (err) {
			console.error("Failed to save outfit item", err);
		}
	};

	return (
		<AdminLayout>
			<PageHeader
				title="Outfit Items"
				description="Manage item placements inside outfits"
				searchValue={search}
				onSearchChange={setSearch}
				searchPlaceholder="Search outfit items..."
				onAdd={() => {
					setEditingOutfitItem(null);
					setFormItemId("");
					setFormOutfitId("");
					setFormFeatured(false);
					setItemSearch("");
					setOutfitSearch("");
					setShowForm(true);
				}}
				addLabel="Create Outfit Item"
			/>

			<div className="p-6 space-y-4">
				{(loading || error) && (
					<div className="text-sm text-muted-foreground">
						{loading ? "Loading outfit items..." : ""}
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
					data={filteredOutfitItems}
					columns={columns}
					keyExtractor={(item) => item._id}
					onView={(item) => setSelectedOutfitItem(item)}
					onEdit={(item) => {
						setEditingOutfitItem(item);
						setFormItemId(item.item_id);
						setFormOutfitId(item.outfit_id);
						setFormFeatured(item.featured_in_product);
						setShowForm(true);
					}}
					onDelete={(item) => void handleDelete(item._id)}
				/>
			</div>

			<DetailPanel
				open={!!selectedOutfitItem}
				onClose={() => setSelectedOutfitItem(null)}
				title="Outfit Item Details"
				description={selectedOutfitItem?.outfit_id}>
				{selectedOutfitItem && (
					<div className="space-y-4">
						<div className="flex items-center gap-3">
							<Shirt className="h-5 w-5 text-muted-foreground" />
							<span className="text-muted-foreground">
								{outfitLabelById.get(selectedOutfitItem.outfit_id) ??
									selectedOutfitItem.outfit_id}
							</span>
						</div>
						<div className="flex items-center gap-3">
							<span className="text-muted-foreground">Item</span>
							<span className="font-mono text-sm">
								{itemLabelById.get(selectedOutfitItem.item_id) ??
									selectedOutfitItem.item_id}
							</span>
						</div>
						<Button
							variant="outline"
							className="w-full"
							onClick={() => {
								setEditingOutfitItem(selectedOutfitItem);
								setFormItemId(selectedOutfitItem.item_id);
								setFormOutfitId(selectedOutfitItem.outfit_id);
								setFormFeatured(selectedOutfitItem.featured_in_product);
								setShowForm(true);
								setSelectedOutfitItem(null);
							}}>
							Edit Outfit Item
						</Button>
					</div>
				)}
			</DetailPanel>

			<DetailPanel
				open={showForm}
				onClose={() => {
					setShowForm(false);
					setEditingOutfitItem(null);
					setFormItemId("");
					setFormOutfitId("");
					setFormFeatured(false);
				}}
				title={editingOutfitItem ? "Edit Outfit Item" : "Create Outfit Item"}
				type="dialog"
				size="md">
				<form className="space-y-4" onSubmit={handleSubmit}>
					<div className="space-y-2">
						<Label>Outfit</Label>
						<Input
							value={outfitSearch}
							onChange={(event) => setOutfitSearch(event.target.value)}
							placeholder="Search outfits..."
						/>
						<Select
							value={formOutfitId}
							onValueChange={(value) => setFormOutfitId(value)}>
							<SelectTrigger>
								<SelectValue placeholder="Select outfit" />
							</SelectTrigger>
							<SelectContent>
								{filteredOutfits.length === 0 && (
									<SelectItem value="__none__" disabled>
										No outfits found
									</SelectItem>
								)}
								{filteredOutfits.map((outfit) => (
									<SelectItem key={outfit._id} value={outfit._id}>
										{outfitLabelById.get(outfit._id)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label>Item</Label>
						<Input
							value={itemSearch}
							onChange={(event) => setItemSearch(event.target.value)}
							placeholder="Search items..."
						/>
						<Select
							value={formItemId}
							onValueChange={(value) => setFormItemId(value)}>
							<SelectTrigger>
								<SelectValue placeholder="Select item" />
							</SelectTrigger>
							<SelectContent>
								{filteredItems.length === 0 && (
									<SelectItem value="__none__" disabled>
										No items found
									</SelectItem>
								)}
								{filteredItems.map((item) => (
									<SelectItem key={item._id} value={item._id}>
										{itemLabelById.get(item._id)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="flex items-center justify-between">
						<Label htmlFor="featured">Featured in Product</Label>
						<Checkbox
							checked={formFeatured}
							onCheckedChange={(checked) => setFormFeatured(Boolean(checked))}
						/>
					</div>
					<div className="flex gap-3 pt-4">
						<Button
							type="button"
							variant="outline"
							className="flex-1"
							onClick={() => {
								setShowForm(false);
								setEditingOutfitItem(null);
							}}>
							Cancel
						</Button>
						<Button type="submit" className="flex-1">
							{editingOutfitItem ? "Save Changes" : "Create Outfit Item"}
						</Button>
					</div>
				</form>
			</DetailPanel>
		</AdminLayout>
	);
}

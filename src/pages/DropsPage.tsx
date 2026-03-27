import { useCallback, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DetailPanel } from "@/components/common/DetailPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { Drop, Item } from "@/types/models";
import { Zap, Calendar } from "lucide-react";
import { restApi } from "@/lib/rest-client";
import { getEnumOptions, getEnumValues } from "@/lib/enums";
import { useResourceList } from "@/hooks/use-resource-list";

export default function DropsPage() {
	const [search, setSearch] = useState("");
	const [selectedDrop, setSelectedDrop] = useState<Drop | null>(null);
	const [showForm, setShowForm] = useState(false);
	const [editingDrop, setEditingDrop] = useState<Drop | null>(null);
	const [formReleaseDate, setFormReleaseDate] = useState<Date | undefined>(undefined);
	const [formError, setFormError] = useState<string | null>(null);

	// Item multi-select state
	const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
	const [originalDropItemIds, setOriginalDropItemIds] = useState<string[]>([]);
	const [itemSearch, setItemSearch] = useState("");

	// Bulk ops state
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [showBulkUpdate, setShowBulkUpdate] = useState(false);
	const [bulkDropStatus, setBulkDropStatus] = useState("");
	const [bulkLoading, setBulkLoading] = useState(false);

	const loadDrops = useCallback(() => restApi.drops.getAll(), []);
	const loadDropStatus = useCallback(() => restApi.enums.getByCategory("dropStatus"), []);
	const loadItems = useCallback(() => restApi.items.getAll(), []);

	const { data: drops, loading, error, reload } = useResourceList(loadDrops);
	const { data: dropStatus } = useResourceList(loadDropStatus);
	const { data: items } = useResourceList(loadItems);

	const dropStatusValues = getEnumValues("dropStatus", dropStatus);
	const dropStatusOptions = getEnumOptions("dropStatus", dropStatusValues);

	const itemLabelById = useMemo(
		() =>
			new Map(
				items.map((item) => [
					item._id,
					[item.brandName, item.itemName].filter(Boolean).join(" · ") || item._id,
				]),
			),
		[items],
	);

	// Show approved items + items already in this drop
	const eligibleItems = useMemo(
		() =>
			items.filter(
				(item) =>
					item.itemStatus === "approved" || selectedItemIds.includes(item._id),
			),
		[items, selectedItemIds],
	);

	const filteredItems = useMemo(() => {
		if (!itemSearch) return eligibleItems;
		const q = itemSearch.toLowerCase();
		return eligibleItems.filter((item) =>
			(itemLabelById.get(item._id) || "").toLowerCase().includes(q),
		);
	}, [eligibleItems, itemSearch, itemLabelById]);

	const filteredDrops = drops.filter(
		(drop) =>
			search === "" ||
			(drop.name ?? "").toLowerCase().includes(search.toLowerCase()),
	);

	const allFilteredDropIds = filteredDrops.map((d) => d._id);
	const allDropsSelected = allFilteredDropIds.length > 0 && allFilteredDropIds.every((id) => selectedIds.includes(id));

	const columns: Column<Drop>[] = [
		{
			key: "_select",
			header: (
				<Checkbox checked={allDropsSelected} onCheckedChange={(v) => { if (v) setSelectedIds(allFilteredDropIds); else setSelectedIds([]); }} />
			),
			render: (drop) => (
				<Checkbox checked={selectedIds.includes(drop._id)} onCheckedChange={(v) => { setSelectedIds((prev) => v ? [...prev, drop._id] : prev.filter((id) => id !== drop._id)); }} />
			),
		},
		{
			key: "name",
			header: "Drop",
			render: (drop) => (
				<div className="flex items-center gap-3">
					<div
						className={`p-2 rounded-lg ${drop.status === "active" ? "bg-success/10" : drop.status === "upcoming" ? "bg-primary/10" : "bg-muted"}`}>
						<Zap
							className={`h-4 w-4 ${drop.status === "active" ? "text-success" : drop.status === "upcoming" ? "text-primary" : "text-muted-foreground"}`}
						/>
					</div>
					<div>
						<p className="font-medium text-foreground">{drop.name}</p>
						<p className="text-sm text-muted-foreground truncate max-w-[200px]">
							{drop.description}
						</p>
					</div>
				</div>
			),
		},
		{
			key: "status",
			header: "Status",
			render: (drop) => <StatusBadge status={drop.status} />,
		},
		{
			key: "releaseDate",
			header: "Release Date",
			render: (drop) => (
				<span className="text-muted-foreground">
					{new Date(drop.releaseDate).toLocaleDateString()}
				</span>
			),
		},
	];


	const openEditForm = async (drop: Drop) => {
		setEditingDrop(drop);
		setFormReleaseDate(drop.releaseDate ? new Date(drop.releaseDate) : undefined);
		setFormError(null);
		setItemSearch("");
		try {
			const dropItems = (await restApi.dropsExtra.getItems(drop._id)) as Item[];
			const ids = dropItems.map((i) => i._id);
			setSelectedItemIds(ids);
			setOriginalDropItemIds(ids);
		} catch {
			setSelectedItemIds([]);
			setOriginalDropItemIds([]);
		}
		setShowForm(true);
	};

	const openCreateForm = () => {
		setEditingDrop(null);
		setFormReleaseDate(undefined);
		setSelectedItemIds([]);
		setOriginalDropItemIds([]);
		setItemSearch("");
		setFormError(null);
		setShowForm(true);
	};

	const closeForm = () => {
		setShowForm(false);
		setEditingDrop(null);
		setFormReleaseDate(undefined);
		setSelectedItemIds([]);
		setOriginalDropItemIds([]);
		setItemSearch("");
		setFormError(null);
	};

	const handleBulkDelete = async () => {
		if (!selectedIds.length) return;
		setBulkLoading(true);
		try {
			await Promise.all(selectedIds.map((id) => restApi.drops.delete(id)));
			setSelectedIds([]); await reload();
		} catch (err) { console.error("Bulk delete failed", err); }
		finally { setBulkLoading(false); }
	};

	const handleBulkUpdate = async () => {
		if (!selectedIds.length || !bulkDropStatus) return;
		setBulkLoading(true);
		try {
			await Promise.all(selectedIds.map((id) => {
				const drop = drops.find((d) => d._id === id);
				if (!drop) return Promise.resolve();
				return restApi.drops.update(id, { ...drop, status: bulkDropStatus });
			}));
			setSelectedIds([]); setShowBulkUpdate(false); setBulkDropStatus("");
			await reload();
		} catch (err) { console.error("Bulk update failed", err); }
		finally { setBulkLoading(false); }
	};

	const handleDelete = async (id: string) => {
		try {
			await restApi.drops.delete(id);
			await reload();
		} catch (err) {
			console.error("Failed to delete drop", err);
		}
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setFormError(null);
		const formData = new FormData(event.currentTarget);
		const payload = {
			name: String(formData.get("name") || ""),
			description: String(formData.get("description") || ""),
			releaseDate: formReleaseDate ? formReleaseDate.toISOString().slice(0, 10) : "",
			status: String(formData.get("status") || "upcoming"),
		};

		try {
			let dropId: string;
			if (editingDrop) {
				await restApi.drops.update(editingDrop._id, payload);
				dropId = editingDrop._id;
			} else {
				const created = (await restApi.drops.create(payload)) as Drop;
				dropId = created._id;
			}

			// Sync items: add new, remove deselected
			const toAdd = selectedItemIds.filter((id) => !originalDropItemIds.includes(id));
			const toRemove = originalDropItemIds.filter((id) => !selectedItemIds.includes(id));

			if (toAdd.length > 0) {
				await restApi.dropsExtra.addItems(dropId, toAdd);
			}
			for (const itemId of toRemove) {
				await restApi.dropsExtra.removeItem(dropId, itemId);
			}

			await reload();
			closeForm();
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to save drop";
			setFormError(message);
			console.error("Failed to save drop", err);
		}
	};

	return (
		<AdminLayout>
			<PageHeader
				title="Drops"
				description="Manage scheduled product drops and collections"
				searchValue={search}
				onSearchChange={setSearch}
				searchPlaceholder="Search drops..."
				onAdd={openCreateForm}
				addLabel="Create Drop"
			/>

			<div className="p-6">
				{(loading || error) && (
					<div className="text-sm text-muted-foreground mb-3">
						{loading ? "Loading drops..." : ""}
						{error ? ` ${error}` : ""}
					</div>
				)}
				{selectedIds.length > 0 && (
					<div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 mb-2">
						<span className="text-xs font-medium text-muted-foreground">{selectedIds.length} selected</span>
						<div className="flex flex-wrap items-center gap-2 ml-auto">
							<Button variant="destructive" size="sm" className="h-8 text-xs" disabled={bulkLoading} onClick={() => void handleBulkDelete()}>Delete Selected</Button>
							<Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowBulkUpdate((v) => !v)}>{showBulkUpdate ? "Cancel" : "Bulk Update"}</Button>
							{showBulkUpdate && (
								<>
									<Select value={bulkDropStatus} onValueChange={setBulkDropStatus}><SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="Set status" /></SelectTrigger><SelectContent>{dropStatusOptions.map(({ value, label }) => (<SelectItem key={value} value={value} className="text-xs">{label}</SelectItem>))}</SelectContent></Select>
									<Button size="sm" className="h-8 text-xs" disabled={bulkLoading || !bulkDropStatus} onClick={() => void handleBulkUpdate()}>{bulkLoading ? "Updating..." : "Apply"}</Button>
								</>
							)}
						</div>
					</div>
				)}
				<DataTable
					data={filteredDrops}
					columns={columns}
					keyExtractor={(drop) => drop._id}
					onView={(drop) => setSelectedDrop(drop)}
					onEdit={(drop) => void openEditForm(drop)}
					onDelete={(drop) => void handleDelete(drop._id)}
				/>
			</div>

			{/* View Drop Panel */}
			<DetailPanel
				open={!!selectedDrop}
				onClose={() => setSelectedDrop(null)}
				title="Drop Details"
				description={selectedDrop?.name}>
				{selectedDrop && (
					<div className="space-y-6">
						<div className="flex items-center gap-4">
							<div
								className={`p-3 rounded-lg ${selectedDrop.status === "active" ? "bg-success/10" : "bg-primary/10"}`}>
								<Zap
									className={`h-6 w-6 ${selectedDrop.status === "active" ? "text-success" : "text-primary"}`}
								/>
							</div>
							<div>
								<h3 className="text-lg font-semibold">{selectedDrop.name}</h3>
								<StatusBadge status={selectedDrop.status} />
							</div>
						</div>
						<p className="text-muted-foreground">
							{selectedDrop.description || "—"}
						</p>
						<div className="grid grid-cols-2 gap-4">
							<div className="p-3 bg-muted/30 rounded-lg col-span-2">
								<div className="flex items-center gap-2 mb-1">
									<Calendar className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm text-muted-foreground">
										Release Date
									</span>
								</div>
								<p className="font-medium">
									{new Date(selectedDrop.releaseDate).toLocaleDateString()}
								</p>
							</div>
						</div>
						<Button
							variant="outline"
							className="w-full"
							onClick={() => {
								void openEditForm(selectedDrop);
								setSelectedDrop(null);
							}}>
							Edit Drop
						</Button>
					</div>
				)}
			</DetailPanel>

			{/* Add/Edit Drop Form */}
			<DetailPanel
				open={showForm}
				onClose={closeForm}
				title={editingDrop ? "Edit Drop" : "Create Drop"}
				type="dialog"
				size="md">
				<form className="space-y-4" onSubmit={handleSubmit}>
					<div className="space-y-2">
						<Label htmlFor="name">Name</Label>
						<Input
							id="name"
							name="name"
							defaultValue={editingDrop?.name}
							placeholder="Enter drop name"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Textarea
							id="description"
							name="description"
							defaultValue={editingDrop?.description}
							placeholder="Enter description"
							rows={3}
						/>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Release date</Label>
							<DatePicker
								value={formReleaseDate}
								onChange={setFormReleaseDate}
								placeholder="Select date"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="status">Status</Label>
							<Select
								defaultValue={editingDrop?.status || dropStatusValues[0]}
								onValueChange={(value) => {
									const field = document.querySelector<HTMLInputElement>(
										'input[name="status"]',
									);
									if (field) field.value = value;
								}}>
								<SelectTrigger>
									<SelectValue placeholder="Select status" />
								</SelectTrigger>
								<SelectContent>
									{dropStatusOptions.map(({ value, label }) => (
										<SelectItem key={value} value={value}>
											{label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<input
								type="hidden"
								name="status"
								defaultValue={editingDrop?.status || dropStatusValues[0]}
							/>
						</div>
					</div>

					{/* Items multi-select */}
					<div className="space-y-2">
						<Label>
							Bags{" "}
							{selectedItemIds.length > 0 && (
								<span className="text-muted-foreground font-normal">
									({selectedItemIds.length} selected)
								</span>
							)}
						</Label>
						<Input
							value={itemSearch}
							onChange={(e) => setItemSearch(e.target.value)}
							placeholder="Search bags..."
						/>
						<div className="border border-input rounded-md p-3 max-h-56 overflow-y-auto space-y-2">
							{filteredItems.length === 0 && (
								<p className="text-sm text-muted-foreground">
									{itemSearch
										? "No bags match your search."
										: "No approved bags available."}
								</p>
							)}
							{filteredItems.map((item) => (
								<label
									key={item._id}
									className="flex items-center gap-3 text-sm text-foreground cursor-pointer">
									<Checkbox
										checked={selectedItemIds.includes(item._id)}
										onCheckedChange={(checked) => {
											setSelectedItemIds((prev) =>
												checked
													? prev.includes(item._id)
														? prev
														: [...prev, item._id]
													: prev.filter((id) => id !== item._id),
											);
										}}
									/>
									<span className="truncate">
										{itemLabelById.get(item._id)}
									</span>
									<StatusBadge
										status={item.itemStatus}
										className="ml-auto shrink-0 text-xs"
									/>
								</label>
							))}
						</div>
					</div>

					{formError && (
						<p className="text-sm text-destructive">{formError}</p>
					)}

					<div className="flex gap-3 pt-4">
						<Button
							type="button"
							variant="outline"
							className="flex-1"
							onClick={closeForm}>
							Cancel
						</Button>
						<Button type="submit" className="flex-1">
							{editingDrop ? "Save Changes" : "Create Drop"}
						</Button>
					</div>
				</form>
			</DetailPanel>
		</AdminLayout>
	);
}

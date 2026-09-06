import { useCallback, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, Column } from "@/components/common/DataTable";
import { DetailPanel } from "@/components/common/DetailPanel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { Category, Demand, SubCategory } from "@/types/models";
import { FolderTree } from "lucide-react";
import { restApi } from "@/lib/rest-client";
import { useResourceList } from "@/hooks/use-resource-list";

export default function SubCategoriesPage() {
	const [search, setSearch] = useState("");
	const [selectedSubCategory, setSelectedSubCategory] =
		useState<SubCategory | null>(null);
	const [showForm, setShowForm] = useState(false);
	const [editingSubCategory, setEditingSubCategory] =
		useState<SubCategory | null>(null);
	const [formCategoryId, setFormCategoryId] = useState("");
	const [formDemandId, setFormDemandId] = useState("");
	const [formError, setFormError] = useState<string | null>(null);
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [bulkLoading, setBulkLoading] = useState(false);

	const loadSubCategories = useCallback(
		() => restApi.subcategories.getAll(),
		[],
	);
	const loadCategories = useCallback(
		() => restApi.categories.getAll() as Promise<Category[]>,
		[],
	);
	const loadDemands = useCallback(
		() => restApi.demands.getAll() as Promise<Demand[]>,
		[],
	);

	const {
		data: subcategories,
		loading,
		error,
		reload,
	} = useResourceList(loadSubCategories);
	const { data: categories, reload: reloadCategories } = useResourceList(loadCategories);
	const { data: demands, reload: reloadDemands } = useResourceList(loadDemands);
	const handleRefresh = () => { void Promise.all([reload(), reloadCategories(), reloadDemands()]); };

	const categoryNameById = useMemo(
		() => new Map(categories.map((cat) => [cat._id, cat.name])),
		[categories],
	);
	const demandLabelById = useMemo(
		() =>
			new Map(
				demands.map((demand) => [
					demand._id,
					`${demand._id.slice(-6)} · ${demand.demand_rate ?? ""}`,
				]),
			),
		[demands],
	);

	const filteredSubCategories = subcategories.filter((sub) => {
		const query = search.toLowerCase();
		return (
			search === "" ||
			(sub.sub_cat_name ?? "").toLowerCase().includes(query) ||
			(sub.category_id ?? "").toLowerCase().includes(query) ||
			(sub.demand_id ?? "").toLowerCase().includes(query)
		);
	});

	const allFilteredIds = filteredSubCategories.map((s) => s._id);
	const allSelected =
		allFilteredIds.length > 0 &&
		allFilteredIds.every((id) => selectedIds.includes(id));

	const columns: Column<SubCategory>[] = [
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
			render: (sub) => (
				<Checkbox
					checked={selectedIds.includes(sub._id)}
					onCheckedChange={(v) => {
						setSelectedIds((prev) =>
							v ? [...prev, sub._id] : prev.filter((id) => id !== sub._id),
						);
					}}
				/>
			),
		},
		{
			key: "sub_cat_name",
			header: "Subcategory",
			render: (sub) => (
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
						<FolderTree className="h-5 w-5 text-primary" />
					</div>
					<div>
						<p className="font-medium text-foreground">{sub.sub_cat_name}</p>
						<p className="text-sm text-muted-foreground truncate max-w-[200px]">
							{categoryNameById.get(sub.category_id) || sub.category_id}
						</p>
					</div>
				</div>
			),
		},
		{
			key: "category_id",
			header: "Category",
			render: (sub) => (
				<span className="text-muted-foreground">
					{categoryNameById.get(sub.category_id) || sub.category_id}
				</span>
			),
		},
		{
			key: "demand_id",
			header: "Demand",
			render: (sub) => (
				<span className="text-muted-foreground">
					{sub.demand_id
						? demandLabelById.get(sub.demand_id) || sub.demand_id
						: "—"}
				</span>
			),
		},
		{
			key: "sub_clean_rate",
			header: "Clean Rate",
			render: (sub) => (
				<span className="text-muted-foreground">
					{sub.sub_clean_rate?.toString() || "—"}
				</span>
			),
		},
	];

	const handleDelete = async (id: string) => {
		try {
			await restApi.subcategories.delete(id);
			await reload();
		} catch (err) {
			console.error("Failed to delete subcategory", err);
		}
	};

	const handleBulkDelete = async () => {
		if (!selectedIds.length) return;
		setBulkLoading(true);
		try {
			await Promise.all(selectedIds.map((id) => restApi.subcategories.delete(id)));
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
		setFormError(null);
		const formData = new FormData(event.currentTarget);
		const sub_cat_name = String(formData.get("sub_cat_name") || "").trim();
		const sub_clean_rate = Number(formData.get("sub_clean_rate") || 0);

		if (!sub_cat_name) {
			setFormError("Subcategory name is required.");
			return;
		}
		if (!formCategoryId) {
			setFormError("Category is required.");
			return;
		}

		const payload = {
			sub_cat_name,
			category_id: formCategoryId,
			demand_id: formDemandId || undefined,
			sub_clean_rate,
		};

		try {
			if (editingSubCategory) {
				await restApi.subcategories.update(editingSubCategory._id, payload);
			} else {
				await restApi.subcategories.create(payload);
			}
			await reload();
			setShowForm(false);
			setEditingSubCategory(null);
			setFormCategoryId("");
			setFormDemandId("");
			setFormError(null);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to save subcategory";
			setFormError(message);
			console.error("Failed to save subcategory", err);
		}
	};

	return (
		<AdminLayout>
			<PageHeader
				title="Subcategories"
				description="Manage category sub-classifications"
				searchValue={search}
				onSearchChange={setSearch}
				searchPlaceholder="Search subcategories..."
				onRefresh={handleRefresh}
				refreshing={loading}
				onAdd={() => {
					setEditingSubCategory(null);
					setFormCategoryId("");
					setFormDemandId("");
					setFormError(null);
					setShowForm(true);
				}}
				addLabel="Create Subcategory"
			/>

			<div className="p-6 space-y-4">
				{(loading || error) && (
					<div className="text-sm text-muted-foreground">
						{loading ? "Loading subcategories..." : ""}
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
					data={filteredSubCategories}
					columns={columns}
					keyExtractor={(sub) => sub._id}
					onView={(sub) => setSelectedSubCategory(sub)}
					onEdit={(sub) => {
						setEditingSubCategory(sub);
						setFormCategoryId(sub.category_id);
						setFormDemandId(sub.demand_id || "");
						setFormError(null);
						setShowForm(true);
					}}
					onDelete={(sub) => void handleDelete(sub._id)}
				/>
			</div>

			<DetailPanel
				open={!!selectedSubCategory}
				onClose={() => setSelectedSubCategory(null)}
				title="Subcategory Details"
				description={selectedSubCategory?.sub_cat_name}>
				{selectedSubCategory && (
					<div className="space-y-4">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Category</span>
							<span className="text-sm font-medium">
								{categoryNameById.get(selectedSubCategory.category_id) ||
									selectedSubCategory.category_id}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Demand</span>
							<span className="text-sm font-medium">
								{selectedSubCategory.demand_id
									? demandLabelById.get(selectedSubCategory.demand_id) ||
									  selectedSubCategory.demand_id
									: "—"}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Clean Rate</span>
							<span className="text-sm font-medium">
								{selectedSubCategory.sub_clean_rate}
							</span>
						</div>
						<Button
							variant="outline"
							className="w-full"
							onClick={() => {
								setEditingSubCategory(selectedSubCategory);
								setFormCategoryId(selectedSubCategory.category_id);
								setFormDemandId(selectedSubCategory.demand_id || "");
								setFormError(null);
								setShowForm(true);
								setSelectedSubCategory(null);
							}}>
							Edit Subcategory
						</Button>
					</div>
				)}
			</DetailPanel>

			<DetailPanel
				open={showForm}
				onClose={() => {
					setShowForm(false);
					setEditingSubCategory(null);
					setFormCategoryId("");
					setFormDemandId("");
					setFormError(null);
				}}
				title={editingSubCategory ? "Edit Subcategory" : "Create Subcategory"}
				type="dialog"
				size="md">
				<form className="space-y-4" onSubmit={handleSubmit}>
					{formError && (
						<div className="text-sm text-destructive">{formError}</div>
					)}
					<div className="space-y-2">
						<Label htmlFor="sub_cat_name">Subcategory Name *</Label>
						<Input
							id="sub_cat_name"
							name="sub_cat_name"
							defaultValue={editingSubCategory?.sub_cat_name}
							placeholder="Handbags"
							required
						/>
					</div>
					<div className="space-y-2">
						<Label>Category *</Label>
						<Select
							value={formCategoryId || "__placeholder__"}
							onValueChange={(value) =>
								setFormCategoryId(
									value === "__placeholder__" ? "" : value,
								)
							}>
							<SelectTrigger>
								<SelectValue placeholder="Select category" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__placeholder__">
									Select category
								</SelectItem>
								{categories.length === 0 && (
									<SelectItem value="__none__" disabled>
										No categories found
									</SelectItem>
								)}
								{categories.map((cat) => (
									<SelectItem key={cat._id} value={cat._id}>
										{categoryNameById.get(cat._id) ?? cat.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label>Demand (Optional)</Label>
						<Select
							value={formDemandId || "none"}
							onValueChange={(value) =>
								setFormDemandId(value === "none" ? "" : value)
							}>
							<SelectTrigger>
								<SelectValue placeholder="Select demand" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">No demand</SelectItem>
								{demands.length === 0 && (
									<SelectItem value="__none__" disabled>
										No demands found
									</SelectItem>
								)}
								{demands.map((demand) => (
									<SelectItem key={demand._id} value={demand._id}>
										{demandLabelById.get(demand._id) ?? demand._id}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label htmlFor="sub_clean_rate">Sub Clean Rate</Label>
						<Input
							id="sub_clean_rate"
							name="sub_clean_rate"
							type="number"
							defaultValue={editingSubCategory?.sub_clean_rate}
							placeholder="Rate"
						/>
					</div>
					<div className="flex gap-3 pt-4">
						<Button
							type="button"
							variant="outline"
							className="flex-1"
							onClick={() => {
								setShowForm(false);
								setEditingSubCategory(null);
								setFormCategoryId("");
								setFormDemandId("");
								setFormError(null);
							}}>
							Cancel
						</Button>
						<Button type="submit" className="flex-1">
							{editingSubCategory ? "Save Changes" : "Create Subcategory"}
						</Button>
					</div>
				</form>
			</DetailPanel>
		</AdminLayout>
	);
}

import { useCallback, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, Column } from "@/components/common/DataTable";
import { DetailPanel } from "@/components/common/DetailPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SubCategory } from "@/types/models";
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
	const loadSubCategories = useCallback(
		() => restApi.subcategories.getAll(),
		[],
	);
	const {
		data: subcategories,
		loading,
		error,
		reload,
	} = useResourceList(loadSubCategories);

	const columns: Column<SubCategory>[] = [
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
							{sub.category_id}
						</p>
					</div>
				</div>
			),
		},
		{
			key: "category_id",
			header: "Category",
			render: (sub) => (
				<span className="text-muted-foreground">{sub.category_id}</span>
			),
		},
		{
			key: "demand_id",
			header: "Demand",
			render: (sub) => (
				<span className="text-muted-foreground">{sub.demand_id || "—"}</span>
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

	const filteredSubCategories = subcategories.filter((sub) => {
		const query = search.toLowerCase();
		return (
			search === "" ||
			(sub.sub_cat_name ?? "").toLowerCase().includes(query) ||
			(sub.category_id ?? "").toLowerCase().includes(query) ||
			(sub.demand_id ?? "").toLowerCase().includes(query)
		);
	});

	const handleDelete = async (id: string) => {
		try {
			await restApi.subcategories.delete(id);
			await reload();
		} catch (err) {
			console.error("Failed to delete subcategory", err);
		}
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		const payload = {
			sub_cat_name: String(formData.get("sub_cat_name") || ""),
			category_id: String(formData.get("category_id") || ""),
			demand_id: String(formData.get("demand_id") || "") || undefined,
			sub_clean_rate: Number(formData.get("sub_clean_rate") || 0),
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
		} catch (err) {
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
				onAdd={() => {
					setEditingSubCategory(null);
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
				<DataTable
					data={filteredSubCategories}
					columns={columns}
					keyExtractor={(sub) => sub._id}
					onView={(sub) => setSelectedSubCategory(sub)}
					onEdit={(sub) => {
						setEditingSubCategory(sub);
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
							<span className="font-mono text-sm">
								{selectedSubCategory.category_id}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Demand</span>
							<span className="font-mono text-sm">
								{selectedSubCategory.demand_id || "—"}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Clean Rate</span>
							<span className="font-mono text-sm">
								{selectedSubCategory.sub_clean_rate}
							</span>
						</div>
						<Button
							variant="outline"
							className="w-full"
							onClick={() => {
								setEditingSubCategory(selectedSubCategory);
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
				}}
				title={editingSubCategory ? "Edit Subcategory" : "Create Subcategory"}
				type="dialog"
				size="md">
				<form className="space-y-4" onSubmit={handleSubmit}>
					<div className="space-y-2">
						<Label htmlFor="sub_cat_name">Subcategory Name</Label>
						<Input
							id="sub_cat_name"
							name="sub_cat_name"
							defaultValue={editingSubCategory?.sub_cat_name}
							placeholder="Handbags"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="category_id">Category ID</Label>
						<Input
							id="category_id"
							name="category_id"
							defaultValue={editingSubCategory?.category_id}
							placeholder="Category ID"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="demand_id">Demand ID</Label>
						<Input
							id="demand_id"
							name="demand_id"
							defaultValue={editingSubCategory?.demand_id}
							placeholder="Optional"
						/>
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

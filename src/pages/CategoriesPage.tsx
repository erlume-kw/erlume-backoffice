import { useCallback, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, Column } from "@/components/common/DataTable";
import { DetailPanel } from "@/components/common/DetailPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { Category, SubCategory } from "@/types/models";
import { Folder } from "lucide-react";
import { restApi } from "@/lib/rest-client";
import { useResourceList } from "@/hooks/use-resource-list";

export default function CategoriesPage() {
	const [search, setSearch] = useState("");
	const [showForm, setShowForm] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
	const [editingCategory, setEditingCategory] = useState<Category | null>(null);
	const [formSubCategoryIds, setFormSubCategoryIds] = useState<string[]>([]);
	const loadCategories = useCallback(() => restApi.categories.getAll(), []);
	const loadSubCategories = useCallback(
		() => restApi.subcategories.getAll() as Promise<SubCategory[]>,
		[],
	);
	const {
		data: categories,
		loading,
		error,
		reload,
	} = useResourceList(loadCategories);
	const { data: subcategories } = useResourceList(loadSubCategories);

	const subCategoryNameById = useMemo(
		() => new Map(subcategories.map((sub) => [sub._id, sub.sub_cat_name])),
		[subcategories],
	);
	
	// Get subcategories that belong to the category being edited
	const categorySubCategories = useMemo(() => {
		if (!editingCategory?._id) return subcategories;
		return subcategories.filter((sub) => sub.category_id === editingCategory._id);
	}, [subcategories, editingCategory]);

	const columns: Column<Category>[] = [
		{
			key: "name",
			header: "Category",
			render: (cat) => (
				<div className="flex items-center gap-3">
					<div className="p-2 rounded-lg bg-primary/10">
						<Folder className="h-4 w-4 text-primary" />
					</div>
					<div>
						<p className="font-medium text-foreground">{cat.name}</p>
						<p className="text-sm text-muted-foreground">{cat._id}</p>
					</div>
				</div>
			),
		},
		{
			key: "base_rate",
			header: "Base Rate",
			render: (cat) => (
				<span className="text-muted-foreground">{cat.base_rate}%</span>
			),
		},
		{
			key: "op_rate",
			header: "Op Rate",
			render: (cat) => (
				<span className="text-muted-foreground">{cat.op_rate ?? "—"}</span>
			),
		},
		{
			key: "clean_rate",
			header: "Clean Rate",
			render: (cat) => (
				<span className="text-muted-foreground">{cat.clean_rate ?? "—"}</span>
			),
		},
		{
			key: "sub_category_id",
			header: "Sub Categories",
			render: (cat) => {
				const subcats = subcategories.filter((sub) => sub.category_id === cat._id);
				if (subcats.length === 0) return <span className="text-muted-foreground">—</span>;
				return (
					<div className="flex flex-wrap gap-1">
						{subcats.map((sub) => (
							<span
								key={sub._id}
								className="text-xs px-2 py-1 bg-muted rounded-md text-muted-foreground">
								{sub.sub_cat_name}
				</span>
						))}
					</div>
				);
			},
		},
	];

	const filteredCategories = categories.filter((cat) => {
		return (
			search === "" ||
			(cat.name ?? "").toLowerCase().includes(search.toLowerCase())
		);
	});

	const handleDelete = async (id: string) => {
		try {
			await restApi.categories.delete(id);
			await reload();
		} catch (err) {
			console.error("Failed to delete category", err);
		}
	};

	const handleSubCategoryToggle = (subCategoryId: string) => {
		setFormSubCategoryIds((prev) =>
			prev.includes(subCategoryId)
				? prev.filter((id) => id !== subCategoryId)
				: [...prev, subCategoryId],
		);
	};

	const handleSubmit = async (
		event: React.FormEvent<HTMLFormElement>,
	) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		// For now, use the first selected subcategory ID to maintain API compatibility
		// If API supports arrays, we can change this
		const payload = {
			name: String(formData.get("name") || ""),
			base_rate: Number(formData.get("base_rate") || 0),
			op_rate: Number(formData.get("op_rate") || 0) || undefined,
			clean_rate: Number(formData.get("clean_rate") || 0) || undefined,
			sub_category_id: formSubCategoryIds[0] || undefined,
		};

		try {
			if (editingCategory) {
				await restApi.categories.update(editingCategory._id, payload);
			} else {
				await restApi.categories.create(payload);
			}
			await reload();
			setShowForm(false);
			setEditingCategory(null);
			setFormSubCategoryIds([]);
		} catch (err) {
			console.error("Failed to save category", err);
		}
	};

	return (
		<AdminLayout>
			<PageHeader
				title="Categories"
				description="Manage product categories and hierarchy"
				searchValue={search}
				onSearchChange={setSearch}
				searchPlaceholder="Search categories..."
				onAdd={() => {
					setEditingCategory(null);
					setFormSubCategoryIds([]);
					setShowForm(true);
				}}
				addLabel="Add Category"
			/>

			<div className="p-6">
				{(loading || error) && (
					<div className="text-sm text-muted-foreground mb-3">
						{loading ? "Loading categories..." : ""}
						{error ? ` ${error}` : ""}
					</div>
				)}
				<DataTable
					data={filteredCategories}
					columns={columns}
					keyExtractor={(cat) => cat._id}
					onView={(cat) => setSelectedCategory(cat)}
					onEdit={(cat) => {
						setEditingCategory(cat);
						const subcats = subcategories.filter((sub) => sub.category_id === cat._id);
						setFormSubCategoryIds(subcats.map((sub) => sub._id));
						setShowForm(true);
					}}
					onDelete={(cat) => {
						void handleDelete(cat._id);
					}}
				/>
			</div>

			{/* Category Details View */}
			<DetailPanel
				open={!!selectedCategory}
				onClose={() => setSelectedCategory(null)}
				title="Category Details"
				description={selectedCategory?.name}>
				{selectedCategory && (
					<div className="space-y-4">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Name</span>
							<span className="font-medium">{selectedCategory.name}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Base Rate</span>
							<span className="font-medium">{selectedCategory.base_rate}%</span>
						</div>
						{selectedCategory.op_rate && (
							<div className="flex justify-between">
								<span className="text-muted-foreground">Op Rate</span>
								<span className="font-medium">{selectedCategory.op_rate}%</span>
							</div>
						)}
						{selectedCategory.clean_rate && (
							<div className="flex justify-between">
								<span className="text-muted-foreground">Clean Rate</span>
								<span className="font-medium">{selectedCategory.clean_rate}%</span>
							</div>
						)}
						<div className="space-y-2">
							<span className="text-muted-foreground">Sub Categories</span>
							<div className="space-y-2">
								{subcategories.filter((sub) => sub.category_id === selectedCategory._id)
									.length === 0 ? (
									<span className="text-sm text-muted-foreground">No subcategories</span>
								) : (
									subcategories
										.filter((sub) => sub.category_id === selectedCategory._id)
										.map((sub) => (
											<div
												key={sub._id}
												className="p-2 bg-muted/30 rounded-lg text-sm">
												{sub.sub_cat_name}
											</div>
										))
								)}
							</div>
						</div>
						<Button
							variant="outline"
							className="w-full"
							onClick={() => {
								setEditingCategory(selectedCategory);
								const subcats = subcategories.filter(
									(sub) => sub.category_id === selectedCategory._id,
								);
								setFormSubCategoryIds(subcats.map((sub) => sub._id));
								setSelectedCategory(null);
								setShowForm(true);
							}}>
							Edit Category
						</Button>
					</div>
				)}
			</DetailPanel>

			{/* Add/Edit Category Form */}
			<DetailPanel
				open={showForm}
				onClose={() => {
					setShowForm(false);
					setEditingCategory(null);
					setFormSubCategoryIds([]);
				}}
				title={editingCategory ? "Edit Category" : "Add Category"}
				type="dialog"
				size="md">
				<form className="space-y-4" onSubmit={handleSubmit}>
					<div className="space-y-2">
						<Label htmlFor="name">Name</Label>
						<Input
							id="name"
							name="name"
							defaultValue={editingCategory?.name}
							placeholder="Enter category name"
						/>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="base_rate">Base Rate (%)</Label>
							<Input
								id="base_rate"
								name="base_rate"
								type="number"
								defaultValue={editingCategory?.base_rate}
								placeholder="Number"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="op_rate">Op Rate (%)</Label>
							<Input
								id="op_rate"
								name="op_rate"
								type="number"
								defaultValue={editingCategory?.op_rate}
								placeholder="Optional"
							/>
						</div>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="clean_rate">Clean Rate (%)</Label>
							<Input
								id="clean_rate"
								name="clean_rate"
								type="number"
								defaultValue={editingCategory?.clean_rate}
								placeholder="Optional"
							/>
						</div>
						<div className="space-y-2">
							<Label>Sub Categories (Optional)</Label>
							<div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
								{subcategories.length === 0 ? (
									<p className="text-sm text-muted-foreground">
										No subcategories available
									</p>
								) : (
									subcategories.map((sub) => (
										<label
											key={sub._id}
											className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer">
											<Checkbox
												checked={formSubCategoryIds.includes(sub._id)}
												onCheckedChange={() => handleSubCategoryToggle(sub._id)}
											/>
											<span className="text-sm">{sub.sub_cat_name}</span>
										</label>
									))
								)}
							</div>
							{formSubCategoryIds.length > 0 && (
								<p className="text-xs text-muted-foreground">
									{formSubCategoryIds.length} subcategory
									{formSubCategoryIds.length !== 1 ? "ies" : ""} selected
								</p>
							)}
						</div>
					</div>
					<div className="flex gap-3 pt-4">
						<Button
							type="button"
							variant="outline"
							className="flex-1"
							onClick={() => {
								setShowForm(false);
								setEditingCategory(null);
								setFormSubCategoryIds([]);
							}}>
							Cancel
						</Button>
						<Button type="submit" className="flex-1">
							{editingCategory ? "Save Changes" : "Add Category"}
						</Button>
					</div>
				</form>
			</DetailPanel>
		</AdminLayout>
	);
}

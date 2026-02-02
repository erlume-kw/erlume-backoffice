import { useCallback, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DetailPanel } from "@/components/common/DetailPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { Drop } from "@/types/models";
import { Zap, Calendar } from "lucide-react";
import { restApi } from "@/lib/rest-client";
import { getEnumOptions, getEnumValues } from "@/lib/enums";
import { useResourceList } from "@/hooks/use-resource-list";

export default function DropsPage() {
	const [search, setSearch] = useState("");
	const [selectedDrop, setSelectedDrop] = useState<Drop | null>(null);
	const [showForm, setShowForm] = useState(false);
	const [editingDrop, setEditingDrop] = useState<Drop | null>(null);
	const [formReleaseDate, setFormReleaseDate] = useState<Date | undefined>(
		undefined,
	);
	const loadDrops = useCallback(() => restApi.drops.getAll(), []);
	const loadDropStatus = useCallback(
		() => restApi.enums.getByCategory("dropStatus"),
		[],
	);
	const { data: drops, loading, error, reload } = useResourceList(loadDrops);
	const { data: dropStatus } = useResourceList(loadDropStatus);
	const dropStatusValues = getEnumValues("dropStatus", dropStatus);
	const dropStatusOptions = getEnumOptions("dropStatus", dropStatusValues);

	const columns: Column<Drop>[] = [
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

	const filteredDrops = drops.filter((drop) => {
		return (
			search === "" ||
			(drop.name ?? "").toLowerCase().includes(search.toLowerCase())
		);
	});

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
		const formData = new FormData(event.currentTarget);
		const payload = {
			name: String(formData.get("name") || ""),
			description: String(formData.get("description") || ""),
			releaseDate: formReleaseDate
				? formReleaseDate.toISOString().slice(0, 10)
				: "",
			status: String(formData.get("status") || "upcoming"),
		};

		try {
			if (editingDrop) {
				await restApi.drops.update(editingDrop._id, payload);
			} else {
				await restApi.drops.create(payload);
			}
			await reload();
			setShowForm(false);
			setEditingDrop(null);
		} catch (err) {
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
				onAdd={() => {
					setEditingDrop(null);
					setFormReleaseDate(undefined);
					setShowForm(true);
				}}
				addLabel="Create Drop"
			/>

			<div className="p-6">
				{(loading || error) && (
					<div className="text-sm text-muted-foreground mb-3">
						{loading ? "Loading drops..." : ""}
						{error ? ` ${error}` : ""}
					</div>
				)}
				<DataTable
					data={filteredDrops}
					columns={columns}
					keyExtractor={(drop) => drop._id}
					onView={(drop) => setSelectedDrop(drop)}
					onEdit={(drop) => {
						setEditingDrop(drop);
						setFormReleaseDate(
							drop.releaseDate ? new Date(drop.releaseDate) : undefined,
						);
						setShowForm(true);
					}}
					onDelete={(drop) => {
						void handleDelete(drop._id);
					}}
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
								setEditingDrop(selectedDrop);
								setShowForm(true);
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
				onClose={() => {
					setShowForm(false);
					setEditingDrop(null);
				}}
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
									if (field) {
										field.value = value;
									}
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
					<div className="flex gap-3 pt-4">
						<Button
							type="button"
							variant="outline"
							className="flex-1"
							onClick={() => {
								setShowForm(false);
								setEditingDrop(null);
								setFormReleaseDate(undefined);
							}}>
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

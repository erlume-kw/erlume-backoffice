import { useCallback, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, Column } from "@/components/common/DataTable";
import { DetailPanel } from "@/components/common/DetailPanel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Demand } from "@/types/models";
import { Megaphone, DollarSign } from "lucide-react";
import { restApi } from "@/lib/rest-client";
import { useResourceList } from "@/hooks/use-resource-list";

export default function DemandsPage() {
	const [search, setSearch] = useState("");
	const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null);
	const [showForm, setShowForm] = useState(false);
	const [editingDemand, setEditingDemand] = useState<Demand | null>(null);
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [bulkLoading, setBulkLoading] = useState(false);
	const loadDemands = useCallback(() => restApi.demands.getAll(), []);
	const {
		data: demands,
		loading,
		error,
		reload,
	} = useResourceList(loadDemands);

	const filteredDemands = useMemo(() => {
		const list = Array.isArray(demands) ? demands : [];
		if (!search.trim()) return list;
		const q = search.toLowerCase();
		return list.filter((demand) =>
			(demand.demand_name ?? "").toLowerCase().includes(q),
		);
	}, [demands, search]);

	const allFilteredIds = filteredDemands.map((d) => d._id);
	const allSelected =
		allFilteredIds.length > 0 &&
		allFilteredIds.every((id) => selectedIds.includes(id));

	const columns: Column<Demand>[] = [
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
			render: (demand) => (
				<Checkbox
					checked={selectedIds.includes(demand._id)}
					onCheckedChange={(v) => {
						setSelectedIds((prev) =>
							v ? [...prev, demand._id] : prev.filter((id) => id !== demand._id),
						);
					}}
				/>
			),
		},
		{
			key: "demand_name",
			header: "Request",
			render: (demand) => (
				<div className="flex items-center gap-3">
					<div className="p-2 rounded-lg bg-primary/10">
						<Megaphone className="h-4 w-4 text-primary" />
					</div>
					<div className="max-w-[300px]">
						<p className="font-medium text-foreground truncate">
							{demand.demand_name}
						</p>
					</div>
				</div>
			),
		},
		{
			key: "demand_rate",
			header: "Rate",
			render: (demand) => (
				<span className="font-medium text-success">
					${demand.demand_rate.toLocaleString()}
				</span>
			),
		},
	];

	const handleBulkDelete = async () => {
		if (!selectedIds.length) return;
		setBulkLoading(true);
		try {
			await Promise.all(selectedIds.map((id) => restApi.demands.delete(id)));
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
			await restApi.demands.delete(id);
			await reload();
		} catch (err) {
			console.error("Failed to delete demand", err);
		}
	};

	const handleSubmit = async (
		event: React.FormEvent<HTMLFormElement>,
	) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		const payload = {
			demand_name: String(formData.get("demand_name") || ""),
			demand_rate: Number(formData.get("demand_rate") || 0),
		};

		try {
			if (editingDemand) {
				await restApi.demands.update(editingDemand._id, payload);
			} else {
				await restApi.demands.create(payload);
			}
			await reload();
			setShowForm(false);
			setEditingDemand(null);
		} catch (err) {
			console.error("Failed to save demand", err);
		}
	};

	return (
		<AdminLayout>
			<PageHeader
				title="Demands"
				description="Manage customer item requests and wishlists"
				searchValue={search}
				onSearchChange={setSearch}
				searchPlaceholder="Search demands..."
				onRefresh={reload}
				refreshing={loading}
				onAdd={() => {
					setEditingDemand(null);
					setShowForm(true);
				}}
				addLabel="Create Demand"
			/>

			<div className="p-6 space-y-4">
				{(loading || error) && (
					<div className="text-sm text-muted-foreground">
						{loading ? "Loading demands..." : ""}
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
					data={filteredDemands}
					columns={columns}
					keyExtractor={(demand) => demand._id}
					onView={(demand) => setSelectedDemand(demand)}
					onEdit={(demand) => {
						setEditingDemand(demand);
						setShowForm(true);
					}}
					onDelete={(demand) => {
						void handleDelete(demand._id);
					}}
				/>
			</div>

			{/* View Demand Panel */}
			<DetailPanel
				open={!!selectedDemand}
				onClose={() => setSelectedDemand(null)}
				title="Demand Details"
				description={selectedDemand?.demand_name}>
				{selectedDemand && (
					<div className="space-y-6">
						<div className="flex items-center gap-4">
							<div className="p-3 rounded-lg bg-primary/10">
								<Megaphone className="h-6 w-6 text-primary" />
							</div>
							<div>
								<h3 className="text-lg font-semibold">
									{selectedDemand.demand_name}
								</h3>
							</div>
						</div>
						<div className="space-y-3">
							<div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
								<DollarSign className="h-5 w-5 text-success" />
								<div>
									<p className="text-sm text-muted-foreground">Rate</p>
									<p className="font-semibold">
										${selectedDemand.demand_rate.toLocaleString()}
									</p>
								</div>
							</div>
						</div>
					</div>
				)}
			</DetailPanel>

			{/* Add/Edit Demand Form */}
			<DetailPanel
				open={showForm}
				onClose={() => {
					setShowForm(false);
					setEditingDemand(null);
				}}
				title={editingDemand ? "Edit Demand" : "Create Demand"}
				type="dialog"
				size="md">
				<form className="space-y-4" onSubmit={handleSubmit}>
					<div className="space-y-2">
						<Label htmlFor="demand_name">Demand Name</Label>
						<Input
							id="demand_name"
							name="demand_name"
							defaultValue={editingDemand?.demand_name}
							placeholder="Enter demand name"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="demand_rate">Demand Rate</Label>
						<Input
							id="demand_rate"
							name="demand_rate"
							type="number"
							defaultValue={editingDemand?.demand_rate}
							placeholder="Number"
						/>
					</div>
					<div className="flex gap-3 pt-4">
						<Button
							type="button"
							variant="outline"
							className="flex-1"
							onClick={() => {
								setShowForm(false);
								setEditingDemand(null);
							}}>
							Cancel
						</Button>
						<Button type="submit" className="flex-1">
							{editingDemand ? "Save Changes" : "Create Demand"}
						</Button>
					</div>
				</form>
			</DetailPanel>
		</AdminLayout>
	);
}

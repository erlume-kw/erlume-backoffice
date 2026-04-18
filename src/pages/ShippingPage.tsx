import { useCallback, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, Column } from "@/components/common/DataTable";
import { DetailPanel } from "@/components/common/DetailPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Truck } from "lucide-react";
import type { ShippingMethod } from "@/types/models";
import { restApi } from "@/lib/rest-client";
import { useResourceList } from "@/hooks/use-resource-list";

const ALL_ZONES = [
	"Al Asimah",
	"Hawalli",
	"Farwaniya",
	"Ahmadi",
	"Jahra",
	"Mubarak Al-Kabeer",
];

export default function ShippingPage() {
	const [search, setSearch] = useState("");
	const [showForm, setShowForm] = useState(false);
	const [editing, setEditing] = useState<ShippingMethod | null>(null);
	const [formIsActive, setFormIsActive] = useState(true);
	const [formZones, setFormZones] = useState<string[]>([]);

	const loadMethods = useCallback(() => restApi.shipping.getAll(), []);
	const { data: methods, loading, error, reload } = useResourceList(loadMethods);

	const filtered = useMemo(() => {
		const list = Array.isArray(methods) ? methods : [];
		return list.filter(
			(m) =>
				search === "" ||
				m.name.toLowerCase().includes(search.toLowerCase()) ||
				(m.description ?? "").toLowerCase().includes(search.toLowerCase()),
		);
	}, [methods, search]);

	const toggleZone = (zone: string) => {
		setFormZones((prev) =>
			prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone],
		);
	};

	const openCreate = () => {
		setEditing(null);
		setFormIsActive(true);
		setFormZones([]);
		setShowForm(true);
	};

	const openEdit = (m: ShippingMethod) => {
		setEditing(m);
		setFormIsActive(m.isActive);
		setFormZones(m.zones ?? []);
		setShowForm(true);
	};

	const handleDelete = async (id: string) => {
		try {
			await restApi.shipping.delete(id);
			await reload();
		} catch (err) {
			console.error("Failed to delete shipping method", err);
		}
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const fd = new FormData(e.currentTarget);
		const payload = {
			name: String(fd.get("name") ?? ""),
			description: String(fd.get("description") ?? ""),
			price: Number(fd.get("price") ?? 0),
			zones: formZones,
			isActive: formIsActive,
		};
		try {
			if (editing) {
				await restApi.shipping.update(editing._id, payload);
			} else {
				await restApi.shipping.create(payload);
			}
			await reload();
			setShowForm(false);
			setEditing(null);
		} catch (err) {
			console.error("Failed to save shipping method", err);
		}
	};

	const columns: Column<ShippingMethod>[] = [
		{
			key: "name",
			header: "Method",
			render: (m) => (
				<div className="flex items-center gap-2">
					<div className="p-2 rounded-lg bg-primary/10">
						<Truck className="h-4 w-4 text-primary" />
					</div>
					<div>
						<p className="font-semibold text-foreground">{m.name}</p>
						{m.description && (
							<p className="text-xs text-muted-foreground">{m.description}</p>
						)}
					</div>
				</div>
			),
		},
		{
			key: "price",
			header: "Price (KWD)",
			render: (m) => (
				<span className="font-semibold">
					{m.price === 0 ? (
						<span className="text-success">Free</span>
					) : (
						`${m.price.toFixed(3)} KWD`
					)}
				</span>
			),
		},
		{
			key: "zones",
			header: "Zones",
			render: (m) =>
				m.zones.length === 0 ? (
					<span className="text-xs text-muted-foreground">All Kuwait</span>
				) : (
					<div className="flex flex-wrap gap-1">
						{m.zones.map((z) => (
							<Badge key={z} variant="secondary" className="text-xs">
								{z}
							</Badge>
						))}
					</div>
				),
		},
		{
			key: "isActive",
			header: "Status",
			render: (m) => (
				<span
					className={`text-sm font-medium ${
						m.isActive ? "text-success" : "text-muted-foreground"
					}`}>
					{m.isActive ? "Active" : "Inactive"}
				</span>
			),
		},
	];

	return (
		<AdminLayout>
			<PageHeader
				title="Shipping Methods"
				description="Manage delivery options and rates for Kuwait governorates"
				searchValue={search}
				onSearchChange={setSearch}
				searchPlaceholder="Search methods..."
				onAdd={openCreate}
				addLabel="Add Method"
			/>

			<div className="p-6">
				{(loading || error) && (
					<div className="text-sm text-muted-foreground mb-3">
						{loading ? "Loading shipping methods..." : ""}
						{error ? ` ${error}` : ""}
					</div>
				)}
				<DataTable
					data={filtered}
					columns={columns}
					keyExtractor={(m) => m._id}
					onEdit={openEdit}
					onDelete={(m) => void handleDelete(m._id)}
				/>
			</div>

			<DetailPanel
				open={showForm}
				onClose={() => { setShowForm(false); setEditing(null); }}
				title={editing ? "Edit Shipping Method" : "Add Shipping Method"}
				type="dialog"
				size="md">
				<form className="space-y-4" onSubmit={handleSubmit}>
					<div className="space-y-2">
						<Label htmlFor="name">Name</Label>
						<Input
							id="name"
							name="name"
							defaultValue={editing?.name}
							placeholder="Standard Delivery"
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Input
							id="description"
							name="description"
							defaultValue={editing?.description}
							placeholder="2–3 business days"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="price">Price (KWD) — set 0 for free</Label>
						<Input
							id="price"
							name="price"
							type="number"
							step="0.001"
							min="0"
							defaultValue={editing?.price ?? 0}
							required
						/>
					</div>
					<div className="space-y-2">
						<Label>Zones — leave all unchecked for all Kuwait</Label>
						<div className="grid grid-cols-2 gap-2">
							{ALL_ZONES.map((zone) => (
								<label
									key={zone}
									className="flex items-center gap-2 text-sm cursor-pointer">
									<input
										type="checkbox"
										checked={formZones.includes(zone)}
										onChange={() => toggleZone(zone)}
										className="rounded border-input"
									/>
									{zone}
								</label>
							))}
						</div>
						{formZones.length === 0 && (
							<p className="text-xs text-muted-foreground">
								No zones selected = applies to all of Kuwait
							</p>
						)}
					</div>
					<div className="flex items-center justify-between">
						<Label htmlFor="isActive">Active</Label>
						<Switch
							id="isActive"
							checked={formIsActive}
							onCheckedChange={setFormIsActive}
						/>
					</div>
					<div className="flex gap-3 pt-4">
						<Button
							type="button"
							variant="outline"
							className="flex-1"
							onClick={() => { setShowForm(false); setEditing(null); }}>
							Cancel
						</Button>
						<Button type="submit" className="flex-1">
							{editing ? "Save Changes" : "Add Method"}
						</Button>
					</div>
				</form>
			</DetailPanel>
		</AdminLayout>
	);
}

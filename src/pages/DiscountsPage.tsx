import { useCallback, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, Column } from "@/components/common/DataTable";
import { DetailPanel } from "@/components/common/DetailPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { DiscountCode } from "@/types/models";
import { Ticket, Copy } from "lucide-react";
import { restApi } from "@/lib/rest-client";
import { useResourceList } from "@/hooks/use-resource-list";

export default function DiscountsPage() {
	const [search, setSearch] = useState("");
	const [showForm, setShowForm] = useState(false);
	const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);
	const [formIsActive, setFormIsActive] = useState(true);
	const [formExpiryDate, setFormExpiryDate] = useState<Date | undefined>(
		undefined,
	);
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [showBulkUpdate, setShowBulkUpdate] = useState(false);
	const [bulkActive, setBulkActive] = useState<"" | "active" | "inactive">("");
	const [bulkLoading, setBulkLoading] = useState(false);
	const loadDiscounts = useCallback(() => restApi.discountcodes.getAll(), []);
	const {
		data: discountCodes,
		loading,
		error,
		reload,
	} = useResourceList(loadDiscounts);

	const copyCode = (code: string) => {
		navigator.clipboard.writeText(code);
	};

	const filteredCodes = useMemo(() => {
		const list = Array.isArray(discountCodes) ? discountCodes : [];
		return list.filter((dc) => {
			return (
				search === "" ||
				(dc.code ?? "").toLowerCase().includes(search.toLowerCase())
			);
		});
	}, [discountCodes, search]);

	const allFilteredIds = filteredCodes.map((dc) => dc._id);
	const allSelected =
		allFilteredIds.length > 0 &&
		allFilteredIds.every((id) => selectedIds.includes(id));

	const columns: Column<DiscountCode>[] = [
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
			render: (dc) => (
				<Checkbox
					checked={selectedIds.includes(dc._id)}
					onCheckedChange={(v) => {
						setSelectedIds((prev) =>
							v ? [...prev, dc._id] : prev.filter((id) => id !== dc._id),
						);
					}}
				/>
			),
		},
		{
			key: "code",
			header: "Code",
			render: (dc) => (
				<div className="flex items-center gap-2">
					<div className="p-2 rounded-lg bg-primary/10">
						<Ticket className="h-4 w-4 text-primary" />
					</div>
					<code className="font-mono font-semibold text-foreground">
						{dc.code}
					</code>
					<Button
						variant="ghost"
						size="icon"
						className="h-6 w-6"
						onClick={() => copyCode(dc.code)}>
						<Copy className="h-3 w-3" />
					</Button>
				</div>
			),
		},
		{
			key: "discount_percentage",
			header: "Discount",
			render: (dc) => (
				<span className="font-semibold text-success">
					{dc.discount_percentage}%
				</span>
			),
		},
		{
			key: "expiry_date",
			header: "Expiry Date",
			render: (dc) => (
				<span className="text-muted-foreground">
					{new Date(dc.expiry_date).toLocaleDateString()}
				</span>
			),
		},
		{
			key: "is_active",
			header: "Status",
			render: (dc) => (
				<span
					className={`text-sm font-medium ${
						dc.is_active ? "text-success" : "text-muted-foreground"
					}`}>
					{dc.is_active ? "Active" : "Inactive"}
				</span>
			),
		},
	];

	const handleBulkDelete = async () => {
		if (!selectedIds.length) return;
		setBulkLoading(true);
		try {
			await Promise.all(selectedIds.map((id) => restApi.discountcodes.delete(id)));
			setSelectedIds([]);
			await reload();
		} catch (err) {
			console.error("Bulk delete failed", err);
		} finally {
			setBulkLoading(false);
		}
	};

	const handleBulkUpdate = async () => {
		if (!selectedIds.length || !bulkActive) return;
		setBulkLoading(true);
		try {
			const nextIsActive = bulkActive === "active";
			await Promise.all(
				selectedIds.map((id) => {
					const current = filteredCodes.find((dc) => dc._id === id);
					if (!current) return Promise.resolve();
					return restApi.discountcodes.update(id, {
						...current,
						is_active: nextIsActive,
					});
				}),
			);
			setSelectedIds([]);
			setShowBulkUpdate(false);
			setBulkActive("");
			await reload();
		} catch (err) {
			console.error("Bulk update failed", err);
		} finally {
			setBulkLoading(false);
		}
	};

	const handleDelete = async (id: string) => {
		try {
			await restApi.discountcodes.delete(id);
			await reload();
		} catch (err) {
			console.error("Failed to delete discount code", err);
		}
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		const payload = {
			code: String(formData.get("code") || ""),
			discount_percentage: Number(formData.get("discount_percentage") || 0),
			expiry_date: formExpiryDate
				? formExpiryDate.toISOString().slice(0, 10)
				: "",
			is_active: formData.get("isActive") === "on",
		};

		try {
			if (editingCode) {
				await restApi.discountcodes.update(editingCode._id, payload);
			} else {
				await restApi.discountcodes.create(payload);
			}
			await reload();
			setShowForm(false);
			setEditingCode(null);
		} catch (err) {
			console.error("Failed to save discount code", err);
		}
	};

	return (
		<AdminLayout>
			<PageHeader
				title="Discount Codes"
				description="Create and manage promotional discount codes"
				searchValue={search}
				onSearchChange={setSearch}
				searchPlaceholder="Search codes..."
				onAdd={() => {
					setEditingCode(null);
					setFormIsActive(true);
					setFormExpiryDate(undefined);
					setShowForm(true);
				}}
				addLabel="Create Code"
			/>

			<div className="p-6">
				{(loading || error) && (
					<div className="text-sm text-muted-foreground mb-3">
						{loading ? "Loading discount codes..." : ""}
						{error ? ` ${error}` : ""}
					</div>
				)}
				{selectedIds.length > 0 && (
					<div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 mb-2">
						<span className="text-xs font-medium text-muted-foreground">
							{selectedIds.length} selected
						</span>
						<div className="flex flex-wrap items-center gap-2 ml-auto">
							<Button
								variant="destructive"
								size="sm"
								className="h-8 text-xs"
								disabled={bulkLoading}
								onClick={() => void handleBulkDelete()}>
								Delete Selected
							</Button>
							<Button
								variant="outline"
								size="sm"
								className="h-8 text-xs"
								onClick={() => setShowBulkUpdate((v) => !v)}>
								{showBulkUpdate ? "Cancel" : "Bulk Update"}
							</Button>
							{showBulkUpdate && (
								<>
									<Select
										value={bulkActive}
										onValueChange={(v) =>
											setBulkActive(v === "__none__" ? "" : (v as typeof bulkActive))
										}>
										<SelectTrigger className="h-8 w-40 text-xs">
											<SelectValue placeholder="Set active" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="__none__" className="text-xs">
												—
											</SelectItem>
											<SelectItem value="active" className="text-xs">
												Active
											</SelectItem>
											<SelectItem value="inactive" className="text-xs">
												Inactive
											</SelectItem>
										</SelectContent>
									</Select>
									<Button
										size="sm"
										className="h-8 text-xs"
										disabled={bulkLoading || !bulkActive}
										onClick={() => void handleBulkUpdate()}>
										{bulkLoading ? "Updating..." : "Apply"}
									</Button>
								</>
							)}
						</div>
					</div>
				)}
				<DataTable
					data={filteredCodes}
					columns={columns}
					keyExtractor={(dc) => dc._id}
					onEdit={(dc) => {
						setEditingCode(dc);
						setFormIsActive(dc.is_active);
						setFormExpiryDate(
							dc.expiry_date ? new Date(dc.expiry_date) : undefined,
						);
						setShowForm(true);
					}}
					onDelete={(dc) => {
						void handleDelete(dc._id);
					}}
				/>
			</div>

			{/* Add/Edit Discount Code Form */}
			<DetailPanel
				open={showForm}
				onClose={() => {
					setShowForm(false);
					setEditingCode(null);
					setFormExpiryDate(undefined);
				}}
				title={editingCode ? "Edit Discount Code" : "Create Discount Code"}
				type="dialog"
				size="md">
				<form className="space-y-4" onSubmit={handleSubmit}>
					<div className="space-y-2">
						<Label htmlFor="code">Code</Label>
						<Input
							id="code"
							name="code"
							defaultValue={editingCode?.code}
							placeholder="SUMMER20"
							className="uppercase"
						/>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="discount_percentage">Discount (%)</Label>
							<Input
								id="discount_percentage"
								name="discount_percentage"
								type="number"
								defaultValue={editingCode?.discount_percentage}
								placeholder="Percentage"
							/>
						</div>
						<div className="space-y-2">
							<Label>Expiry date</Label>
							<DatePicker
								value={formExpiryDate}
								onChange={setFormExpiryDate}
								placeholder="Select date"
							/>
						</div>
					</div>
					<div className="flex items-center justify-between">
						<Label htmlFor="isActive">Active</Label>
						<Switch
							id="isActive"
							checked={formIsActive}
							onCheckedChange={(value) => setFormIsActive(value)}
						/>
						<input
							type="hidden"
							name="isActive"
							value={formIsActive ? "on" : "off"}
						/>
					</div>
					<div className="flex gap-3 pt-4">
						<Button
							type="button"
							variant="outline"
							className="flex-1"
							onClick={() => {
								setShowForm(false);
								setEditingCode(null);
								setFormExpiryDate(undefined);
							}}>
							Cancel
						</Button>
						<Button type="submit" className="flex-1">
							{editingCode ? "Save Changes" : "Create Code"}
						</Button>
					</div>
				</form>
			</DetailPanel>
		</AdminLayout>
	);
}

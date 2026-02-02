import { useCallback, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, Column } from "@/components/common/DataTable";
import { DetailPanel } from "@/components/common/DetailPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
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

	const columns: Column<DiscountCode>[] = [
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

	const filteredCodes = discountCodes.filter((dc) => {
		return (
			search === "" ||
			(dc.code ?? "").toLowerCase().includes(search.toLowerCase())
		);
	});

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

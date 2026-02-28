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
import { Switch } from "@/components/ui/switch";
import type { Employee, Expense } from "@/types/models";
import { Receipt } from "lucide-react";
import { restApi } from "@/lib/rest-client";
import { getEnumOptions, getEnumValues } from "@/lib/enums";
import { useResourceList } from "@/hooks/use-resource-list";

export default function ExpensesPage() {
	const [search, setSearch] = useState("");
	const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
	const [showForm, setShowForm] = useState(false);
	const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
	const [formEmployeeId, setFormEmployeeId] = useState("");
	const [formCurrency, setFormCurrency] = useState("KWD");
	const [formPaidBy, setFormPaidBy] = useState("");
	const [formRecurring, setFormRecurring] = useState(false);
	const [formPhase, setFormPhase] = useState("");
	const [formType, setFormType] = useState("");
	const [formError, setFormError] = useState<string | null>(null);

	const loadExpenses = useCallback(
		() => restApi.expenses.getAll() as Promise<Expense[]>,
		[],
	);
	const loadEmployees = useCallback(
		() => restApi.employees.getAll() as Promise<Employee[]>,
		[],
	);
	const loadExpenseTypes = useCallback(
		() => restApi.enums.getByCategory("expenseType"),
		[],
	);

	const {
		data: expenses = [],
		loading,
		error,
		reload,
	} = useResourceList(loadExpenses);
	const { data: employees = [] } = useResourceList(loadEmployees);
	const { data: expenseTypes } = useResourceList(loadExpenseTypes);

	const employeeLabelById = useMemo(
		() =>
			new Map(
				employees.map((e) => [
					e._id,
					[e.name, e.role].filter(Boolean).join(" · ") || e._id,
				]),
			),
		[employees],
	);
	const expenseTypeValues = getEnumValues("expenseType", expenseTypes);
	const expenseTypeOptions =
		expenseTypeValues.length > 0
			? getEnumOptions("expenseType", expenseTypeValues)
			: [
					{ value: "supplies", label: "Supplies" },
					{ value: "subscriptions", label: "Subscriptions" },
					{ value: "services", label: "Services" },
				];

	const columns: Column<Expense>[] = [
		{
			key: "name",
			header: "Name",
			render: (e) => (
				<span className="font-medium text-foreground">{e.name}</span>
			),
		},
		{
			key: "cost",
			header: "Cost",
			render: (e) => (
				<span className="font-semibold text-destructive">
					{e.currency ?? "KWD"} {Number(e.cost ?? 0).toFixed(2)}
				</span>
			),
		},
		{
			key: "employee_id",
			header: "Employee",
			render: (e) => (
				<span className="text-sm text-muted-foreground">
					{e.employee_id
						? employeeLabelById.get(e.employee_id) ?? e.employee_id
						: "—"}
				</span>
			),
		},
		{
			key: "month",
			header: "Month",
			render: (e) => (
				<span className="text-muted-foreground text-sm">
					{e.month
						? new Date(e.month).toLocaleDateString("en-US", {
								month: "short",
								year: "numeric",
						  })
						: "—"}
				</span>
			),
		},
		{
			key: "paidBy",
			header: "Paid By",
			render: (e) => (
				<span className="text-sm text-muted-foreground">{e.paidBy ?? "—"}</span>
			),
		},
		{
			key: "isRecurring",
			header: "Recurring",
			render: (e) => (
				<span className="text-sm text-muted-foreground">
					{e.isRecurring ? "Yes" : "No"}
				</span>
			),
		},
		{
			key: "notes",
			header: "Notes",
			render: (e) => (
				<span className="text-sm text-muted-foreground truncate max-w-[160px] block">
					{e.notes ?? "—"}
				</span>
			),
		},
	];

	const filteredExpenses = useMemo(() => {
		const list = Array.isArray(expenses) ? expenses : [];
		if (!search.trim()) return list;
		const q = search.toLowerCase();
		return list.filter(
			(e) =>
				(e.name ?? "").toLowerCase().includes(q) ||
				(e.notes ?? "").toLowerCase().includes(q),
		);
	}, [expenses, search]);

	const safeEmployees = Array.isArray(employees) ? employees : [];

	const handleDelete = async (id: string) => {
		try {
			await restApi.expenses.delete(id);
			await reload();
		} catch (err) {
			console.error("Failed to delete expense", err);
		}
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setFormError(null);
		const formData = new FormData(event.currentTarget);
		const name = String(formData.get("name") ?? "").trim();
		const cost = String(formData.get("cost") ?? "").trim();
		const employee_id = formEmployeeId || undefined;
		const notes = String(formData.get("notes") ?? "").trim();
		const monthRaw = String(formData.get("month") ?? "").trim();

		if (!name || !cost) {
			setFormError("Name and cost are required.");
			return;
		}
		if (!monthRaw) {
			setFormError("Month is required.");
			return;
		}

		try {
			const payload = {
				name,
				cost,
				currency: formCurrency || "KWD",
				...(employee_id && { employee_id }),
				...(notes && { notes }),
				...(formType && { type: [formType] }),
				month: new Date(monthRaw + "-01").toISOString(),
				...(formPaidBy.trim() && { paidBy: formPaidBy.trim() }),
				isRecurring: formRecurring,
				...(formPhase.trim() && { phase: formPhase.trim() }),
			};
			if (editingExpense) {
				await restApi.expenses.update(editingExpense._id, payload);
			} else {
				await restApi.expenses.create(
					payload as Omit<Expense, "_id" | "createdAt" | "updatedAt">,
				);
			}
			await reload();
			setShowForm(false);
			setEditingExpense(null);
			setFormEmployeeId("");
			setFormCurrency("KWD");
			setFormPaidBy("");
			setFormRecurring(false);
			setFormPhase("");
			setFormType("");
		} catch (err) {
			setFormError(
				err instanceof Error ? err.message : "Failed to save expense",
			);
			console.error("Failed to save expense", err);
		}
	};

	return (
		<AdminLayout>
			<PageHeader
				title="Expenses"
				description="Expense records with optional employee link"
				searchValue={search}
				onSearchChange={setSearch}
				searchPlaceholder="Search expenses..."
				onAdd={() => {
					setEditingExpense(null);
					setFormEmployeeId("");
					setFormCurrency("KWD");
					setFormPaidBy("");
					setFormRecurring(false);
					setFormPhase("");
					setFormType("");
					setFormError(null);
					setShowForm(true);
				}}
				addLabel="Add expense"
			/>

			<div className="p-6 space-y-4">
				{(loading || error) && (
					<div className="text-sm text-muted-foreground">
						{loading ? "Loading..." : ""} {error ? String(error) : ""}
					</div>
				)}
				<DataTable
					data={filteredExpenses}
					columns={columns}
					keyExtractor={(e) => e._id}
					onView={(e) => setSelectedExpense(e)}
					onEdit={(e) => {
						setEditingExpense(e);
						setFormEmployeeId(e.employee_id ?? "");
						setFormCurrency(e.currency ?? "KWD");
						setFormPaidBy(e.paidBy ?? "");
						setFormRecurring(e.isRecurring ?? false);
						setFormPhase(e.phase ?? "");
						setFormType(Array.isArray(e.type) ? (e.type[0] ?? "") : e.type ?? "");
						setFormError(null);
						setShowForm(true);
					}}
					onDelete={(e) => void handleDelete(e._id)}
				/>
			</div>

			<DetailPanel
				open={!!selectedExpense}
				onClose={() => setSelectedExpense(null)}
				title="Expense details"
				description={selectedExpense?.name}>
				{selectedExpense && (
					<div className="space-y-4">
						<div className="flex items-center gap-4">
							<div className="p-3 rounded-lg bg-muted">
								<Receipt className="h-6 w-6 text-muted-foreground" />
							</div>
							<div>
								<h3 className="text-lg font-semibold">
									{selectedExpense.name}
								</h3>
								<p className="text-xl font-bold text-destructive">
									{selectedExpense.currency ?? "KWD"}{" "}
									{Number(selectedExpense.cost ?? 0).toFixed(2)}
								</p>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div className="p-3 bg-muted/30 rounded-lg col-span-2">
								<p className="text-xs text-muted-foreground">Employee</p>
								<p className="text-sm">
									{selectedExpense.employee_id
								? employeeLabelById.get(selectedExpense.employee_id) ??
										  selectedExpense.employee_id
										: "—"}
								</p>
							</div>
							{selectedExpense.notes && (
								<div className="p-3 bg-muted/30 rounded-lg col-span-2">
									<p className="text-xs text-muted-foreground">Notes</p>
									<p className="text-sm">{selectedExpense.notes}</p>
								</div>
							)}
							<div className="p-3 bg-muted/30 rounded-lg col-span-2">
								<p className="text-xs text-muted-foreground">Month</p>
								<p className="text-sm">
									{selectedExpense.month
										? new Date(selectedExpense.month).toLocaleDateString(
												"en-US",
												{ month: "short", year: "numeric" },
										  )
										: "—"}
								</p>
							</div>
							{selectedExpense.paidBy && (
								<div className="p-3 bg-muted/30 rounded-lg col-span-2">
									<p className="text-xs text-muted-foreground">Paid By</p>
									<p className="text-sm">{selectedExpense.paidBy}</p>
								</div>
							)}
							<div className="p-3 bg-muted/30 rounded-lg">
								<p className="text-xs text-muted-foreground">Recurring?</p>
								<p className="text-sm">
									{selectedExpense.isRecurring ? "Yes" : "No"}
								</p>
							</div>
							{selectedExpense.phase && (
								<div className="p-3 bg-muted/30 rounded-lg">
									<p className="text-xs text-muted-foreground">Phase</p>
									<p className="text-sm">{selectedExpense.phase}</p>
								</div>
							)}
							{selectedExpense.type && selectedExpense.type.length > 0 && (
								<div className="p-3 bg-muted/30 rounded-lg col-span-2">
									<p className="text-xs text-muted-foreground">Type</p>
									<p className="text-sm">
										{Array.isArray(selectedExpense.type)
											? selectedExpense.type.join(", ")
											: String(selectedExpense.type)}
									</p>
								</div>
							)}
						</div>
						<Button
							variant="outline"
							className="w-full"
							onClick={() => {
								setEditingExpense(selectedExpense);
								setFormEmployeeId(selectedExpense.employee_id ?? "");
								setFormCurrency(selectedExpense.currency ?? "KWD");
								setFormPaidBy(selectedExpense.paidBy ?? "");
								setFormRecurring(selectedExpense.isRecurring ?? false);
								setFormPhase(selectedExpense.phase ?? "");
								setFormType(
									Array.isArray(selectedExpense.type)
										? (selectedExpense.type[0] ?? "")
										: selectedExpense.type ?? "",
								);
								setSelectedExpense(null);
								setShowForm(true);
							}}>
							Edit expense
						</Button>
					</div>
				)}
			</DetailPanel>

			<DetailPanel
				open={showForm}
				onClose={() => {
					setShowForm(false);
					setEditingExpense(null);
					setFormEmployeeId("");
					setFormCurrency("KWD");
					setFormPaidBy("");
					setFormRecurring(false);
					setFormPhase("");
					setFormType("");
					setFormError(null);
				}}
				title={editingExpense ? "Edit expense" : "Add expense"}
				type="dialog"
				size="md">
				<form className="space-y-4" onSubmit={handleSubmit}>
					{formError && (
						<div className="text-sm text-destructive">{formError}</div>
					)}
					<div className="space-y-2">
						<Label htmlFor="name">Name *</Label>
						<Input
							id="name"
							name="name"
							required
							defaultValue={editingExpense?.name ?? ""}
							placeholder="Expense name"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="cost">Cost *</Label>
						<Input
							id="cost"
							name="cost"
							type="text"
							inputMode="decimal"
							required
							defaultValue={editingExpense?.cost ?? ""}
							placeholder="Amount"
						/>
					</div>
					<div className="space-y-2">
						<Label>Currency</Label>
						<Select value={formCurrency} onValueChange={setFormCurrency}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="KWD">KWD</SelectItem>
								<SelectItem value="USD">USD</SelectItem>
								<SelectItem value="EUR">EUR</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label>Employee</Label>
						<Select
							value={
								formEmployeeId || "__none__"
							}
							onValueChange={(v) =>
								setFormEmployeeId(v === "__none__" ? "" : v)
							}>
							<SelectTrigger>
								<SelectValue placeholder="Select employee (user)" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__none__">None</SelectItem>
								{safeEmployees.map((e) => (
									<SelectItem key={e._id} value={e._id}>
										{employeeLabelById.get(e._id) ?? e._id}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label htmlFor="month">Month *</Label>
						<Input
							id="month"
							name="month"
							type="month"
							className="h-10"
							required
							placeholder="Select month"
							defaultValue={
								editingExpense?.month
									? new Date(editingExpense.month).toISOString().slice(0, 7)
									: ""
							}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="paidBy">Paid By</Label>
						<Input
							id="paidBy"
							name="paidBy"
							value={formPaidBy}
							onChange={(e) => setFormPaidBy(e.target.value)}
							placeholder="Optional"
						/>
					</div>
					<div className="flex items-center gap-2">
						<Switch
							id="isRecurring"
							checked={formRecurring}
							onCheckedChange={setFormRecurring}
						/>
						<Label htmlFor="isRecurring">Recurring?</Label>
					</div>
					<div className="space-y-2">
						<Label htmlFor="phase">Phase</Label>
						<Input
							id="phase"
							name="phase"
							value={formPhase}
							onChange={(e) => setFormPhase(e.target.value)}
							placeholder="e.g. Pre-launch"
						/>
					</div>
					<div className="space-y-2">
						<Label>Type</Label>
						<Select
							value={formType || "__none__"}
							onValueChange={(value) =>
								setFormType(value === "__none__" ? "" : value)
							}>
							<SelectTrigger>
								<SelectValue placeholder="Select expense type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__none__">None</SelectItem>
								{expenseTypeOptions.map(({ value, label }) => (
									<SelectItem key={value} value={value}>
										{label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label htmlFor="notes">Notes</Label>
						<Input
							id="notes"
							name="notes"
							defaultValue={editingExpense?.notes ?? ""}
							placeholder="Optional"
						/>
					</div>
					<div className="flex gap-3 pt-4">
						<Button
							type="button"
							variant="outline"
							className="flex-1"
							onClick={() => setShowForm(false)}>
							Cancel
						</Button>
						<Button type="submit" className="flex-1">
							{editingExpense ? "Update" : "Create"}
						</Button>
					</div>
				</form>
			</DetailPanel>
		</AdminLayout>
	);
}

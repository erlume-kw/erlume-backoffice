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
import { Switch } from "@/components/ui/switch";
import type { Employee, Expense } from "@/types/models";
import { Receipt } from "lucide-react";
import { restApi } from "@/lib/rest-client";
import { getEnumOptions, getEnumValues } from "@/lib/enums";
import { useResourceList } from "@/hooks/use-resource-list";
import { formatApiError } from "@/lib/error-utils";

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
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [bulkLoading, setBulkLoading] = useState(false);

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
	const { data: employeesRaw = [], reload: reloadEmployees } = useResourceList(loadEmployees);
	const employees = Array.isArray(employeesRaw) ? employeesRaw : [];
	const { data: expenseTypes, reload: reloadExpenseTypes } = useResourceList(loadExpenseTypes);
	const handleRefresh = () => { void Promise.all([reload(), reloadEmployees(), reloadExpenseTypes()]); };

	const employeeLabelById = useMemo(() => {
		const map = new Map<string, string>();
		for (const e of employees) {
			if (!e || typeof e !== "object" || !e._id) continue;

			const id = String(e._id);

			// Extract name - must be a string, not an object
			const nameStr = e.name && typeof e.name === "string" ? e.name.trim() : "";

			// Extract role - must be a string, not an object
			const roleStr = e.role && typeof e.role === "string" ? e.role.trim() : "";

			// Create label prioritizing name
			let label = "";
			if (nameStr && roleStr) {
				label = `${nameStr} · ${roleStr}`;
			} else if (nameStr) {
				label = nameStr;
			} else if (roleStr) {
				label = roleStr;
			} else {
				label = id; // Fallback to ID if no name/role
			}

			map.set(id, label);
		}
		return map;
	}, [employees]);
	const expenseTypeValues = getEnumValues("expenseType", expenseTypes);
	const expenseTypeOptions =
		expenseTypeValues.length > 0
			? getEnumOptions("expenseType", expenseTypeValues)
			: [
					{ value: "supplies", label: "Supplies" },
					{ value: "subscriptions", label: "Subscriptions" },
					{ value: "services", label: "Services" },
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

	const columns: Column<Expense>[] = [
		{
			key: "_select",
			header: (
				<Checkbox
					checked={
						filteredExpenses.length > 0 &&
						filteredExpenses.every((e) => selectedIds.includes(e._id))
					}
					onCheckedChange={(v) => {
						if (v) setSelectedIds(filteredExpenses.map((e) => e._id));
						else setSelectedIds([]);
					}}
				/>
			),
			render: (e) => (
				<Checkbox
					checked={selectedIds.includes(e._id)}
					onCheckedChange={(v) => {
						setSelectedIds((prev) =>
							v ? [...prev, e._id] : prev.filter((id) => id !== e._id),
						);
					}}
				/>
			),
		},
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
			render: (e) => {
				if (!e.employee_id) {
					return <span className="text-sm text-muted-foreground">—</span>;
				}

				// If employee_id is a populated Employee object, use it directly
				if (typeof e.employee_id === "object" && e.employee_id !== null) {
					const empObj = e.employee_id as {
						_id?: string;
						name?: string;
						role?: string;
					};

					// Extract name and role as strings
					const nameStr =
						empObj.name && typeof empObj.name === "string"
							? empObj.name.trim()
							: "";
					const roleStr =
						empObj.role && typeof empObj.role === "string"
							? empObj.role.trim()
							: "";

					// Show name if available, with role if both exist
					if (nameStr) {
						const display = roleStr ? `${nameStr} · ${roleStr}` : nameStr;
						return (
							<span className="text-sm text-muted-foreground">{display}</span>
						);
					}

					// Fallback: try to get from map using _id
					if (empObj._id) {
						const label = employeeLabelById.get(String(empObj._id));
						if (label && typeof label === "string" && label) {
							return (
								<span className="text-sm text-muted-foreground">{label}</span>
							);
						}
					}

					return <span className="text-sm text-muted-foreground">—</span>;
				}

				// If employee_id is a string, look it up in the map
				if (typeof e.employee_id === "string") {
					const label = employeeLabelById.get(e.employee_id);
					if (label && typeof label === "string" && label) {
						return (
							<span className="text-sm text-muted-foreground">{label}</span>
						);
					}
					// Fallback to showing the ID if not found in map
					return (
						<span className="text-sm text-muted-foreground">
							{e.employee_id}
						</span>
					);
				}

				return <span className="text-sm text-muted-foreground">—</span>;
			},
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

	const safeEmployees = Array.isArray(employees) ? employees : [];

	const handleBulkDelete = async () => {
		if (!selectedIds.length) return;
		setBulkLoading(true);
		try {
			await Promise.all(selectedIds.map((id) => restApi.expenses.delete(id)));
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
			setFormError(formatApiError(err) || "Failed to save expense");
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
				onRefresh={handleRefresh}
				refreshing={loading}
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
					data={filteredExpenses}
					columns={columns}
					keyExtractor={(e) => e._id}
					onView={(e) => setSelectedExpense(e)}
					onEdit={(e) => {
						setEditingExpense(e);
						// Handle both string ID and populated Employee object
						let employeeIdStr = "";
						if (e.employee_id) {
							if (typeof e.employee_id === "string") {
								employeeIdStr = e.employee_id;
							} else if (
								typeof e.employee_id === "object" &&
								e.employee_id !== null
							) {
								const empObj = e.employee_id as { _id?: string };
								employeeIdStr = empObj._id ? String(empObj._id) : "";
							}
						}
						setFormEmployeeId(employeeIdStr);
						setFormCurrency(e.currency ?? "KWD");
						setFormPaidBy(e.paidBy ?? "");
						setFormRecurring(e.isRecurring ?? false);
						setFormPhase(e.phase ?? "");
						setFormType(
							Array.isArray(e.type) ? (e.type[0] ?? "") : (e.type ?? ""),
						);
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
									{(() => {
										if (!selectedExpense.employee_id) return "—";

										// Handle string ID
										if (typeof selectedExpense.employee_id === "string") {
											const label = employeeLabelById.get(
												selectedExpense.employee_id,
											);
											return typeof label === "string" && label
												? label
												: selectedExpense.employee_id;
										}

										// Handle populated Employee object
										if (
											selectedExpense.employee_id &&
											typeof selectedExpense.employee_id === "object"
										) {
											const empObj = selectedExpense.employee_id as {
												_id?: string;
												name?: string;
												role?: string;
											};

											// Try to get name/role from the object
											if (empObj.name || empObj.role) {
												const nameStr =
													empObj.name && typeof empObj.name === "string"
														? empObj.name.trim()
														: "";
												const roleStr =
													empObj.role && typeof empObj.role === "string"
														? empObj.role.trim()
														: "";
												const parts = [nameStr, roleStr].filter(Boolean);
												if (parts.length > 0) {
													return parts.join(" · ");
												}
											}

											// Fallback to looking up by _id
											if (empObj._id) {
												const label = employeeLabelById.get(String(empObj._id));
												return typeof label === "string" && label
													? label
													: String(empObj._id);
											}
										}

										return "—";
									})()}
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
								// Handle both string ID and populated Employee object
								let employeeIdStr = "";
								if (selectedExpense.employee_id) {
									if (typeof selectedExpense.employee_id === "string") {
										employeeIdStr = selectedExpense.employee_id;
									} else if (
										typeof selectedExpense.employee_id === "object" &&
										selectedExpense.employee_id !== null
									) {
										const empObj = selectedExpense.employee_id as {
											_id?: string;
										};
										employeeIdStr = empObj._id ? String(empObj._id) : "";
									}
								}
								setFormEmployeeId(employeeIdStr);
								setFormCurrency(selectedExpense.currency ?? "KWD");
								setFormPaidBy(selectedExpense.paidBy ?? "");
								setFormRecurring(selectedExpense.isRecurring ?? false);
								setFormPhase(selectedExpense.phase ?? "");
								setFormType(
									Array.isArray(selectedExpense.type)
										? (selectedExpense.type[0] ?? "")
										: (selectedExpense.type ?? ""),
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
							value={formEmployeeId || "__none__"}
							onValueChange={(v) =>
								setFormEmployeeId(v === "__none__" ? "" : v)
							}>
							<SelectTrigger>
								<SelectValue placeholder="Select employee (user)" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__none__">None</SelectItem>
								{safeEmployees.map((e) => {
									if (!e || typeof e !== "object" || !e._id) return null;
									const employeeId = String(e._id);
									const label = employeeLabelById.get(employeeId);
									const displayText =
										typeof label === "string" && label ? label : employeeId;
									return (
										<SelectItem key={employeeId} value={employeeId}>
											{displayText}
										</SelectItem>
									);
								})}
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

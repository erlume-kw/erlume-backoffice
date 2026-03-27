import { useCallback, useEffect, useMemo, useState } from "react";
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
import type { Employee, User } from "@/types/models";
import { restApi } from "@/lib/rest-client";
import { useResourceList } from "@/hooks/use-resource-list";

export default function EmployeesPage() {
	const [search, setSearch] = useState("");
	const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
	const [showForm, setShowForm] = useState(false);
	const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
	const [formUserId, setFormUserId] = useState("");
	const [formType, setFormType] = useState("");
	const [formError, setFormError] = useState<string | null>(null);
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [bulkLoading, setBulkLoading] = useState(false);

	const EMPLOYEE_TYPE_OPTIONS = [
		{ value: "__none__", label: "None" },
		{ value: "full-time", label: "Full-time" },
		{ value: "part-time", label: "Part-time" },
		{ value: "contractor", label: "Contractor" },
	];
	const typeOptions = useMemo(() => {
		const list = [...EMPLOYEE_TYPE_OPTIONS];
		const current = editingEmployee?.type?.trim();
		if (current && !list.some((o) => o.value === current)) {
			list.push({ value: current, label: current });
		}
		return list;
	}, [editingEmployee?.type]);

	useEffect(() => {
		if (showForm) setFormType(editingEmployee?.type ?? "");
	}, [showForm, editingEmployee]);

	const loadEmployees = useCallback(
		() => restApi.employees.getAll() as Promise<Employee[]>,
		[],
	);
	const loadUsers = useCallback(
		() => restApi.users.getAll() as Promise<User[]>,
		[],
	);
	const { data: employees, loading, error, reload } = useResourceList(loadEmployees);
	const { data: users } = useResourceList(loadUsers);

	const safeEmployees = Array.isArray(employees) ? employees : [];
	const safeUsers = Array.isArray(users) ? users : [];
	const userLabelById = useMemo(
		() =>
			new Map(
				safeUsers.map((u) => [u._id, u.emailAddress || u.phoneNumber || u._id]),
			),
		[safeUsers],
	);

	const filteredEmployees = useMemo(() => {
		if (!search.trim()) return safeEmployees;
		const q = search.toLowerCase();
		return safeEmployees.filter(
			(e) =>
				(e.name ?? "").toLowerCase().includes(q) ||
				(e.role ?? "").toLowerCase().includes(q) ||
				(e.type ?? "").toLowerCase().includes(q) ||
				(e.user_id ?? "").toLowerCase().includes(q),
		);
	}, [safeEmployees, search]);

	const allFilteredIds = filteredEmployees.map((e) => e._id);
	const allSelected =
		allFilteredIds.length > 0 &&
		allFilteredIds.every((id) => selectedIds.includes(id));

	const columns: Column<Employee>[] = [
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
			render: (e) => <span className="font-medium">{e.name}</span>,
		},
		{
			key: "role",
			header: "Role",
			render: (e) => <span className="text-muted-foreground">{e.role || "—"}</span>,
		},
		{
			key: "type",
			header: "Type",
			render: (e) => <span className="text-muted-foreground">{e.type || "—"}</span>,
		},
		{
			key: "salaryActual",
			header: "Actual Salary",
			render: (e) => (
				<span className="text-muted-foreground">{e.salaryActual || "—"}</span>
			),
		},
		{
			key: "salaryProjected",
			header: "Projected Salary",
			render: (e) => (
				<span className="text-muted-foreground">{e.salaryProjected || "—"}</span>
			),
		},
	];

	const handleBulkDelete = async () => {
		if (!selectedIds.length) return;
		setBulkLoading(true);
		try {
			await Promise.all(selectedIds.map((id) => restApi.employees.delete(id)));
			setSelectedIds([]);
			await reload();
		} catch (err) {
			setFormError(err instanceof Error ? err.message : "Bulk delete failed");
		} finally {
			setBulkLoading(false);
		}
	};

	const handleDelete = async (id: string) => {
		try {
			await restApi.employees.delete(id);
			await reload();
		} catch (err) {
			setFormError(err instanceof Error ? err.message : "Failed to delete employee");
		}
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setFormError(null);
		const formData = new FormData(event.currentTarget);
		const name = String(formData.get("name") ?? "").trim();
		const photo = String(formData.get("photo") ?? "").trim();
		const role = String(formData.get("role") ?? "").trim();
		const type = formType.trim();
		const salaryActual = String(formData.get("salaryActual") ?? "").trim();
		const salaryProjected = String(formData.get("salaryProjected") ?? "").trim();

		if (!name) {
			setFormError("Name is required.");
			return;
		}

		const payload: Partial<Employee> = {
			name,
			...(photo && { photo }),
			...(role && { role }),
			...(type && { type }),
			...(salaryActual && { salaryActual }),
			...(salaryProjected && { salaryProjected }),
			...(formUserId && { user_id: formUserId }),
		};

		try {
			if (editingEmployee) {
				await restApi.employees.update(editingEmployee._id, payload);
			} else {
				await restApi.employees.create(
					payload as Omit<Employee, "_id" | "createdAt" | "updatedAt">,
				);
			}
			await reload();
			setShowForm(false);
			setEditingEmployee(null);
			setFormUserId("");
		} catch (err) {
			setFormError(err instanceof Error ? err.message : "Failed to save employee");
		}
	};

	return (
		<AdminLayout>
			<PageHeader
				title="Employees"
				description="Manage employee records and salary data"
				searchValue={search}
				onSearchChange={setSearch}
				searchPlaceholder="Search employees..."
				onAdd={() => {
					setEditingEmployee(null);
					setFormUserId("");
					setFormError(null);
					setShowForm(true);
				}}
				addLabel="Add employee"
			/>
			<div className="p-6 space-y-4">
				{(loading || error) && (
					<div className="text-sm text-muted-foreground">
						{loading ? "Loading employees..." : ""}
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
					data={filteredEmployees}
					columns={columns}
					keyExtractor={(e) => e._id}
					onView={(e) => setSelectedEmployee(e)}
					onEdit={(e) => {
						setEditingEmployee(e);
						setFormUserId(e.user_id ?? "");
						setShowForm(true);
						setFormError(null);
					}}
					onDelete={(e) => void handleDelete(e._id)}
				/>
			</div>

			<DetailPanel
				open={!!selectedEmployee}
				onClose={() => setSelectedEmployee(null)}
				title="Employee details"
				description={selectedEmployee?.name}>
				{selectedEmployee && (
					<div className="space-y-3">
						<p>
							<span className="text-muted-foreground">Role: </span>
							{selectedEmployee.role || "—"}
						</p>
						<p>
							<span className="text-muted-foreground">Type: </span>
							{selectedEmployee.type || "—"}
						</p>
						<p>
							<span className="text-muted-foreground">Actual Salary: </span>
							{selectedEmployee.salaryActual || "—"}
						</p>
						<p>
							<span className="text-muted-foreground">Projected Salary: </span>
							{selectedEmployee.salaryProjected || "—"}
						</p>
						<p>
							<span className="text-muted-foreground">User Link: </span>
							{selectedEmployee.user_id
								? (userLabelById.get(selectedEmployee.user_id) ??
									selectedEmployee.user_id)
								: "—"}
						</p>
						<Button
							variant="outline"
							className="w-full"
							onClick={() => {
								setEditingEmployee(selectedEmployee);
								setFormUserId(selectedEmployee.user_id ?? "");
								setSelectedEmployee(null);
								setShowForm(true);
							}}>
							Edit employee
						</Button>
					</div>
				)}
			</DetailPanel>

			<DetailPanel
				open={showForm}
				onClose={() => {
					setShowForm(false);
					setEditingEmployee(null);
					setFormUserId("");
					setFormError(null);
				}}
				title={editingEmployee ? "Edit employee" : "Add employee"}
				type="dialog"
				size="md">
				<form className="space-y-4" onSubmit={handleSubmit}>
					{formError && <div className="text-sm text-destructive">{formError}</div>}
					<div className="space-y-2">
						<Label htmlFor="name">Name *</Label>
						<Input
							id="name"
							name="name"
							required
							defaultValue={editingEmployee?.name ?? ""}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="role">Role</Label>
						<Input id="role" name="role" defaultValue={editingEmployee?.role ?? ""} />
					</div>
					<div className="space-y-2">
						<Label>Type</Label>
						<Select
							value={formType || "__none__"}
							onValueChange={(v) => setFormType(v === "__none__" ? "" : v)}>
							<SelectTrigger>
								<SelectValue placeholder="Select type" />
							</SelectTrigger>
							<SelectContent>
								{typeOptions.map(({ value, label }) => (
									<SelectItem key={value} value={value}>
										{label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label htmlFor="photo">Photo URL</Label>
						<Input
							id="photo"
							name="photo"
							defaultValue={editingEmployee?.photo ?? ""}
						/>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-2">
							<Label htmlFor="salaryActual">Actual salary</Label>
							<Input
								id="salaryActual"
								name="salaryActual"
								defaultValue={editingEmployee?.salaryActual ?? ""}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="salaryProjected">Projected salary</Label>
							<Input
								id="salaryProjected"
								name="salaryProjected"
								defaultValue={editingEmployee?.salaryProjected ?? ""}
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="user_id">User ID (optional)</Label>
						<Input
							id="user_id"
							name="user_id"
							value={formUserId}
							onChange={(e) => setFormUserId(e.target.value)}
							placeholder="Link to user _id"
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
							{editingEmployee ? "Update" : "Create"}
						</Button>
					</div>
				</form>
			</DetailPanel>
		</AdminLayout>
	);
}

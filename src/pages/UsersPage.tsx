import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { FilterBar } from "@/components/common/FilterBar";
import { DetailPanel } from "@/components/common/DetailPanel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { User } from "@/types/models";
import { Mail, Phone, Calendar, User as UserIcon } from "lucide-react";
import { restApi, ApiError } from "@/lib/rest-client";
import { getEnumOptions, getEnumValues } from "@/lib/enums";
import { useResourceList } from "@/hooks/use-resource-list";

const formatPhoneNumber = (value: string) => value.trim();

export default function UsersPage() {
	const usersApi = restApi.users as unknown as {
		getAll: (
			params?: Record<string, string | number | boolean | undefined>,
		) => Promise<User[]>;
		getById: (id: string) => Promise<User>;
		create: (data: Record<string, unknown>) => Promise<User>;
		update: (id: string, data: Record<string, unknown>) => Promise<User>;
	};
	const [search, setSearch] = useState("");
	const [filters, setFilters] = useState<Record<string, string | undefined>>({
		status: "active",
	});
	const [selectedUser, setSelectedUser] = useState<User | null>(null);
	const [showForm, setShowForm] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [editingUser, setEditingUser] = useState<User | null>(null);
	const [showDeleted, setShowDeleted] = useState(false);
	const [formRole, setFormRole] = useState("user");
	const [formStatus, setFormStatus] = useState("active");
	const [formGovernorate, setFormGovernorate] = useState("");
	const [formCity, setFormCity] = useState("");
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [showBulkUpdate, setShowBulkUpdate] = useState(false);
	const [bulkRole, setBulkRole] = useState("");
	const [bulkStatus, setBulkStatus] = useState("");
	const [bulkLoading, setBulkLoading] = useState(false);
	const loadUsers = useCallback(
		() => usersApi.getAll(showDeleted ? { includeDeleted: "true" } : undefined),
		[usersApi, showDeleted],
	);
	const loadUserRoles = useCallback(
		() => restApi.enums.getByCategory("userRole"),
		[],
	);
	const loadGovernorates = useCallback(
		() => restApi.enums.getByCategory("kuwaitGovernorate"),
		[],
	);
	const loadCities = useCallback(
		() => restApi.enums.getByCategory("kuwaitCity"),
		[],
	);
	const { data: users, loading, error, reload } = useResourceList(loadUsers);
	const { data: userRoles } = useResourceList(loadUserRoles);
	const {
		data: governorates,
		loading: governoratesLoading,
		error: governoratesError,
	} = useResourceList(loadGovernorates);
	const {
		data: cities,
		loading: citiesLoading,
		error: citiesError,
	} = useResourceList(loadCities);
	const userRoleValues = getEnumValues("userRole", userRoles).map((v) =>
		v.toLowerCase(),
	);
	const userRoleOptions = getEnumOptions("userRole", userRoleValues);
	const governorateValues = getEnumValues("kuwaitGovernorate", governorates);
	const governorateOptions = getEnumOptions(
		"kuwaitGovernorate",
		governorateValues,
	);
	const cityValues = getEnumValues("kuwaitCity", cities);
	const cityOptions = getEnumOptions("kuwaitCity", cityValues);

	useEffect(() => {
		if (!showForm || editingUser) {
			return;
		}

		if (!formGovernorate && governorateValues.length > 0) {
			setFormGovernorate(governorateValues[0]);
		}

		if (!formCity && cityOptions.length > 0) {
			setFormCity(cityOptions[0].value);
		}
	}, [
		showForm,
		editingUser,
		formGovernorate,
		formCity,
		governorateValues,
		cityOptions,
	]);

	useEffect(() => {
		if (!showForm) {
			return;
		}

		if (cityOptions.length === 0) {
			if (formCity) {
				setFormCity("");
			}
			return;
		}

		const cityIsValid = cityOptions.some((option) => option.value === formCity);
		if (!cityIsValid) {
			setFormCity(cityOptions[0].value);
		}
	}, [showForm, cityOptions, formCity]);

	const filteredUsers = users.filter((user) => {
		const matchesSearch =
			search === "" ||
			(user.emailAddress ?? "").toLowerCase().includes(search.toLowerCase());
		const matchesStatus =
			!filters.status ||
			(filters.status === "active" ? !user.isDeleted : user.isDeleted);
		const matchesRole = !filters.role || user.roles?.includes(filters.role);
		return matchesSearch && matchesStatus && matchesRole;
	});

	const allFilteredUserIds = filteredUsers.map((u) => u._id);
	const allUsersSelected =
		allFilteredUserIds.length > 0 &&
		allFilteredUserIds.every((id) => selectedIds.includes(id));

	const columns: Column<User>[] = [
		{
			key: "_select",
			header: (
				<Checkbox
					checked={allUsersSelected}
					onCheckedChange={(v) => {
						if (v) setSelectedIds(allFilteredUserIds);
						else setSelectedIds([]);
					}}
				/>
			),
			render: (user) => (
				<Checkbox
					checked={selectedIds.includes(user._id)}
					onCheckedChange={(v) => {
						setSelectedIds((prev) =>
							v ? [...prev, user._id] : prev.filter((id) => id !== user._id),
						);
					}}
				/>
			),
		},
		{
			key: "emailAddress",
			header: "Email",
			render: (user) => (
				<div className="flex items-center gap-3">
					<div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
						<UserIcon className="h-4 w-4 text-primary" />
					</div>
					<div>
						<p className="font-medium text-foreground">{user.emailAddress}</p>
						<p className="text-sm text-muted-foreground">
							{user.phoneNumber || "—"}
						</p>
					</div>
				</div>
			),
		},
		{
			key: "roles",
			header: "Roles",
			render: (user) => (
				<span className="text-sm font-medium text-muted-foreground">
					{user.roles?.length ? user.roles.join(" ") : "—"}
				</span>
			),
		},
		{
			key: "isDeleted",
			header: "Status",
			render: (user) => (
				<StatusBadge status={user.isDeleted ? "inactive" : "active"} />
			),
		},
		{
			key: "phoneNumber",
			header: "Phone",
			render: (user) => (
				<span className="text-muted-foreground">{user.phoneNumber || "—"}</span>
			),
		},
		{
			key: "createdAt",
			header: "Joined",
			render: (user) => (
				<span className="text-muted-foreground">
					{new Date(user.createdAt).toLocaleDateString()}
				</span>
			),
		},
	];

	const handleFilterChange = (key: string, value: string | undefined) => {
		if (key === "status") {
			const nextStatus = value === "inactive" ? "inactive" : "active";
			setShowDeleted(nextStatus === "inactive");
			setFilters((prev) => ({ ...prev, status: nextStatus }));
			return;
		}
		setFilters((prev) => ({ ...prev, [key]: value }));
	};

	const handleClearFilters = () => {
		setFilters({ status: showDeleted ? "inactive" : "active" });
	};

	const handleBulkDelete = async () => {
		if (!selectedIds.length) return;
		setBulkLoading(true);
		try {
			await Promise.all(
				selectedIds.map((id) => restApi.usersExtra.softDelete(id)),
			);
			setSelectedIds([]);
			await reload();
		} catch (err) {
			console.error("Bulk delete failed", err);
		} finally {
			setBulkLoading(false);
		}
	};

	const handleBulkUpdate = async () => {
		if (!selectedIds.length || (!bulkRole && !bulkStatus)) return;
		setBulkLoading(true);
		try {
			const patch: Record<string, unknown> = {};
			if (bulkRole) patch.roles = [bulkRole];
			if (bulkStatus) {
				patch.isDeleted = bulkStatus === "inactive";
			}
			await Promise.all(
				selectedIds.map((id) => restApi.usersExtra.patch(id, patch)),
			);
			setSelectedIds([]);
			setShowBulkUpdate(false);
			setBulkRole("");
			setBulkStatus("");
			await reload();
		} catch (err) {
			console.error("Bulk update failed", err);
		} finally {
			setBulkLoading(false);
		}
	};

	const handleDelete = async (id: string) => {
		try {
			setFormError(null);
			// Try PATCH first (soft delete)
			try {
				await restApi.usersExtra.softDelete(id);
			} catch (patchError) {
				// If PATCH returns 404/405, the endpoint might not be implemented
				// Fallback: fetch user and update with PUT
				if (
					patchError instanceof ApiError &&
					(patchError.statusCode === 404 || patchError.statusCode === 405)
				) {
					try {
						// Fetch the user first
						const user = await usersApi.getById(id);
						// Update with isDeleted set to true
						await usersApi.update(id, {
							...user,
							isDeleted: true,
						} as Record<string, unknown>);
					} catch (updateError) {
						// If that also fails, throw the original PATCH error
						throw patchError;
					}
				} else {
					throw patchError;
				}
			}
			await reload();
		} catch (err) {
			if (err instanceof ApiError) {
				// Handle API errors with better messages
				if (err.statusCode === 404) {
					setFormError(
						"User not found. The user may have already been deleted, or the delete endpoint is not available.",
					);
				} else if (err.statusCode === 405) {
					setFormError(
						"Delete method not supported by the server. Please contact support.",
					);
				} else if (err.isValidationError()) {
					const fieldErrors = err.getFieldErrors();
					if (Object.keys(fieldErrors).length > 0) {
						const errorMessages = Object.entries(fieldErrors).map(
							([field, message]) => `${field}: ${message}`,
						);
						setFormError(errorMessages.join("; "));
					} else {
						setFormError(err.message);
					}
				} else {
					// Extract readable error message from HTML responses
					const errorMessage = err.message.includes("<!DOCTYPE")
						? "Server returned an error page. The delete endpoint may not be implemented."
						: err.message || "Failed to delete user";
					setFormError(errorMessage);
				}
			} else {
				const message =
					err instanceof Error ? err.message : "Failed to delete user";
				setFormError(message);
			}
			console.error("Failed to delete user", err);
		}
	};

	// Permanent, irreversible removal — distinct from the soft delete above.
	// Used to fully wipe a test account so the email/OTP/welcome flow can be
	// re-run from scratch. The newsletter row for the same email is kept.
	const handleHardDelete = async (id: string) => {
		try {
			setFormError(null);
			await restApi.usersExtra.hardDelete(id);
			setSelectedUser(null);
			await reload();
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to permanently delete user";
			setFormError(message);
			console.error("Failed to hard delete user", err);
		}
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		setFormError(null);
		const password = String(formData.get("password") || "");
		const emailAddress = String(formData.get("emailAddress") || "");
		const phoneNumber = formatPhoneNumber(
			String(formData.get("phoneNumber") || ""),
		);
		// Ensure role is lowercase and valid - defensive normalization
		let normalizedRole = String(formRole || "user")
			.toLowerCase()
			.trim();
		const validRoles = ["user", "seller", "admin"];
		if (!validRoles.includes(normalizedRole)) {
			console.warn(
				`Invalid role "${formRole}", defaulting to "user". Valid roles: ${validRoles.join(", ")}`,
			);
			normalizedRole = "user";
		}
		const roles = [normalizedRole];
		const isDeleted = formStatus === "inactive";
		const address = {
			street: String(formData.get("street") || ""),
			city: formCity,
			block: String(formData.get("block") || ""),
			governorate: formGovernorate,
			house: String(formData.get("house") || ""),
			flat: String(formData.get("flat") || ""),
			avenue: String(formData.get("avenue") || ""),
		};
		const payload = {
			...(password ? { password } : {}),
			emailAddress,
			phoneNumber,
			roles, // Already normalized to lowercase array: ["user"] | ["seller"] | ["admin"]
			cardIds: editingUser?.cardIds ?? [],
			isDeleted,
			address,
		};

		// Debug: Verify roles are lowercase before sending
		if (roles[0] && roles[0] !== roles[0].toLowerCase()) {
			console.error(
				"ERROR: Role is not lowercase!",
				roles,
				"formRole:",
				formRole,
			);
			// Force lowercase as final safety check
			payload.roles = [roles[0].toLowerCase()];
		}

		try {
			if (!emailAddress || !phoneNumber || (!editingUser && !password)) {
				setFormError("Email, phone, and password are required.");
				return;
			}
			if (
				!address.street ||
				!address.city ||
				!address.block ||
				!address.governorate ||
				!address.house
			) {
				setFormError("Please complete all required address fields.");
				return;
			}
			if (editingUser) {
				await usersApi.update(
					editingUser._id,
					payload as Record<string, unknown>,
				);
			} else {
				await usersApi.create(payload as Record<string, unknown>);
			}
			await reload();
			setShowForm(false);
			setEditingUser(null);
		} catch (err) {
			if (err instanceof ApiError && err.isValidationError()) {
				// Handle field-level validation errors
				const errors = err.getFieldErrors();
				setFieldErrors(errors);

				if (Object.keys(errors).length > 0) {
					// Show general error message
					setFormError("Please fix the errors below");
				} else {
					setFormError(err.message);
				}
			} else {
				setFieldErrors({});
				const message =
					err instanceof Error ? err.message : "Failed to save user";
				setFormError(message);
			}
			console.error("Failed to save user", err);
		}
	};

	return (
		<AdminLayout>
			<PageHeader
				title="Users"
				description="Manage marketplace users and their accounts"
				searchValue={search}
				onSearchChange={setSearch}
				searchPlaceholder="Search users..."
				onRefresh={reload}
				refreshing={loading}
				onAdd={() => {
					setEditingUser(null);
					setFormRole("user");
					setFormStatus("active");
					setFormGovernorate(governorateValues[0] ?? "");
					setFormCity("");
					setShowForm(true);
				}}
				addLabel="Add User"
			/>

			<div className="p-6 space-y-4">
				{(loading || error) && (
					<div className="text-sm text-muted-foreground">
						{loading ? "Loading users..." : ""}
						{error ? ` ${error}` : ""}
					</div>
				)}
				<FilterBar
					filters={[
						{
							key: "status",
							label: "Status",
							value: filters.status,
							options: [
								{ value: "active", label: "Active" },
								{ value: "inactive", label: "Inactive" },
							],
						},
						{
							key: "role",
							label: "Role",
							value: filters.role,
							options: userRoleOptions,
						},
					]}
					onFilterChange={handleFilterChange}
					onClearAll={handleClearFilters}
				/>
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<Switch
						id="show-deleted-users"
						checked={showDeleted}
						onCheckedChange={(checked) => {
							setShowDeleted(checked);
							setFilters((prev) => ({
								...prev,
								status: checked ? "inactive" : "active",
							}));
							// Reload users with new includeDeleted parameter
							// The useResourceList hook will automatically reload when loadUsers changes
							reload();
						}}
					/>
					<Label htmlFor="show-deleted-users">Show deleted</Label>
				</div>

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
									<Select value={bulkRole} onValueChange={setBulkRole}>
										<SelectTrigger className="h-8 w-36 text-xs">
											<SelectValue placeholder="Set role" />
										</SelectTrigger>
										<SelectContent>
											{userRoleOptions.map(({ value, label }) => (
												<SelectItem
													key={value}
													value={value}
													className="text-xs">
													{label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<Select value={bulkStatus} onValueChange={setBulkStatus}>
										<SelectTrigger className="h-8 w-36 text-xs">
											<SelectValue placeholder="Set status" />
										</SelectTrigger>
										<SelectContent>
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
										disabled={bulkLoading || (!bulkRole && !bulkStatus)}
										onClick={() => void handleBulkUpdate()}>
										{bulkLoading ? "Updating..." : "Apply"}
									</Button>
								</>
							)}
						</div>
					</div>
				)}
				<DataTable
					data={filteredUsers}
					columns={columns}
					keyExtractor={(user) => user._id}
					onView={(user) => setSelectedUser(user)}
					onEdit={(user) => {
						setEditingUser(user);
						// Convert role to lowercase for form (backend expects lowercase)
						const userRole = user.roles?.[0]?.toLowerCase() || "user";
						setFormRole(userRole);
						setFormStatus(user.isDeleted ? "inactive" : "active");
						setFormGovernorate(user.address?.governorate || "");
						setFormCity(user.address?.city || "");
						setShowForm(true);
					}}
					onDelete={(user) => {
						void handleDelete(user._id);
					}}
				/>
			</div>

			{/* View User Panel */}
			<DetailPanel
				open={!!selectedUser}
				onClose={() => setSelectedUser(null)}
				title="User Details"
				description={selectedUser ? selectedUser.emailAddress : ""}>
				{selectedUser && (
					<div className="space-y-6">
						<div className="flex items-center gap-4">
							<div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
								<UserIcon className="h-8 w-8 text-primary" />
							</div>
							<div>
								<h3 className="text-lg font-semibold">
									{selectedUser.emailAddress}
								</h3>
								<p className="text-sm text-muted-foreground">
									{selectedUser.phoneNumber}
								</p>
								<StatusBadge
									status={selectedUser.isDeleted ? "inactive" : "active"}
								/>
							</div>
						</div>
						<div className="space-y-4">
							<div className="flex items-center gap-3 text-muted-foreground">
								<Mail className="h-4 w-4" />
								<span>{selectedUser.emailAddress}</span>
							</div>
							{selectedUser.phoneNumber && (
								<div className="flex items-center gap-3 text-muted-foreground">
									<Phone className="h-4 w-4" />
									<span>{selectedUser.phoneNumber}</span>
								</div>
							)}
							<div className="flex items-center gap-3 text-muted-foreground">
								<Calendar className="h-4 w-4" />
								<span>
									Joined {new Date(selectedUser.createdAt).toLocaleDateString()}
								</span>
							</div>
						</div>
						<div className="pt-4 border-t border-border space-y-3">
							<Button
								variant="outline"
								className="w-full"
								onClick={() => {
									setEditingUser(selectedUser);
									setShowForm(true);
									setSelectedUser(null);
								}}>
								Edit User
							</Button>
							<Button
								variant="destructive"
								className="w-full"
								onClick={() => {
									if (
										window.confirm(
											`Permanently delete ${selectedUser.emailAddress}?\n\nThis removes the account, its seller record and active sessions, and cannot be undone. Their newsletter subscription (if any) is kept.`,
										)
									) {
										void handleHardDelete(selectedUser._id);
									}
								}}>
								Permanently Delete
							</Button>
							<p className="text-xs text-muted-foreground">
								Soft-deactivate instead from the row menu — permanent delete is
								for fully resetting a test account.
							</p>
						</div>
					</div>
				)}
			</DetailPanel>

			{/* Add/Edit User Form */}
			<DetailPanel
				open={showForm}
				onClose={() => {
					setShowForm(false);
					setEditingUser(null);
					setFormGovernorate("");
					setFormCity("");
					setFieldErrors({});
					setFormError(null);
				}}
				title={editingUser ? "Edit User" : "Add User"}
				type="dialog"
				size="md">
				<form className="space-y-4" onSubmit={handleSubmit}>
					{formError && (
						<div className="text-sm text-destructive">{formError}</div>
					)}
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="emailAddress">Email (primary)</Label>
							<Input
								id="emailAddress"
								name="emailAddress"
								type="email"
								required
								defaultValue={editingUser?.emailAddress}
								placeholder="Enter email"
								className={fieldErrors.emailAddress ? "border-destructive" : ""}
								onChange={() => {
									if (fieldErrors.emailAddress) {
										setFieldErrors((prev) => {
											const next = { ...prev };
											delete next.emailAddress;
											return next;
										});
									}
								}}
							/>
							{fieldErrors.emailAddress && (
								<div className="text-sm text-destructive">
									{fieldErrors.emailAddress}
								</div>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="phoneNumber">Phone</Label>
							<Input
								id="phoneNumber"
								name="phoneNumber"
								defaultValue={editingUser?.phoneNumber}
								placeholder="Enter phone number"
								required
								className={fieldErrors.phoneNumber ? "border-destructive" : ""}
								onChange={() => {
									if (fieldErrors.phoneNumber) {
										setFieldErrors((prev) => {
											const next = { ...prev };
											delete next.phoneNumber;
											return next;
										});
									}
								}}
							/>
							{fieldErrors.phoneNumber && (
								<div className="text-sm text-destructive">
									{fieldErrors.phoneNumber}
								</div>
							)}
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="password">Password</Label>
						<Input
							id="password"
							name="password"
							type="password"
							defaultValue={editingUser?.password}
							placeholder={
								editingUser ? "Leave blank to keep" : "Enter password"
							}
							required={!editingUser}
							className={fieldErrors.password ? "border-destructive" : ""}
							onChange={() => {
								if (fieldErrors.password) {
									setFieldErrors((prev) => {
										const next = { ...prev };
										delete next.password;
										return next;
									});
								}
							}}
						/>
						{fieldErrors.password && (
							<div className="text-sm text-destructive">
								{fieldErrors.password}
							</div>
						)}
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="role">Role</Label>
							<Select
								value={formRole.toLowerCase()}
								onValueChange={(value) => setFormRole(value.toLowerCase())}>
								<SelectTrigger>
									<SelectValue placeholder="Select role" />
								</SelectTrigger>
								<SelectContent>
									{userRoleOptions.length === 0 ? (
										<SelectItem value="user" disabled>
											Loading roles...
										</SelectItem>
									) : (
										userRoleOptions.map(({ value, label }) => {
											const normalizedValue = value.toLowerCase();
											return (
												<SelectItem
													key={normalizedValue}
													value={normalizedValue}>
													{label}
												</SelectItem>
											);
										})
									)}
								</SelectContent>
							</Select>
							{fieldErrors["roles.0"] && (
								<div className="text-sm text-destructive">
									{fieldErrors["roles.0"]}
								</div>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="status">Status</Label>
							<Select
								value={formStatus}
								onValueChange={(value) => setFormStatus(value)}>
								<SelectTrigger>
									<SelectValue placeholder="Select status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="active">Active</SelectItem>
									<SelectItem value="inactive">Inactive</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Governorate</Label>
							<Select
								value={formGovernorate}
								onValueChange={(value) => {
									setFormGovernorate(value);
									if (fieldErrors["address.governorate"]) {
										setFieldErrors((prev) => {
											const next = { ...prev };
											delete next["address.governorate"];
											return next;
										});
									}
								}}
								disabled={governoratesLoading || !!governoratesError}>
								<SelectTrigger>
									<SelectValue placeholder="Select governorate" />
								</SelectTrigger>
								<SelectContent>
									{governoratesLoading && (
										<SelectItem value="__loading__" disabled>
											Loading governorates...
										</SelectItem>
									)}
									{!governoratesLoading && governoratesError && (
										<SelectItem value="__error__" disabled>
											Failed to load governorates
										</SelectItem>
									)}
									{governorateOptions.length === 0 && (
										<SelectItem value="__none__" disabled>
											No governorates found
										</SelectItem>
									)}
									{governorateOptions.map(({ value, label }) => (
										<SelectItem key={value} value={value}>
											{label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{fieldErrors["address.governorate"] && (
								<div className="text-sm text-destructive">
									{fieldErrors["address.governorate"]}
								</div>
							)}
							<input type="hidden" name="governorate" value={formGovernorate} />
						</div>
						<div className="space-y-2">
							<Label>City</Label>
							<Select
								value={formCity}
								onValueChange={(value) => {
									setFormCity(value);
									if (fieldErrors["address.city"]) {
										setFieldErrors((prev) => {
											const next = { ...prev };
											delete next["address.city"];
											return next;
										});
									}
								}}
								disabled={citiesLoading || !!citiesError}>
								<SelectTrigger>
									<SelectValue placeholder="Select city" />
								</SelectTrigger>
								<SelectContent>
									{citiesLoading && (
										<SelectItem value="__loading__" disabled>
											Loading cities...
										</SelectItem>
									)}
									{!citiesLoading && citiesError && (
										<SelectItem value="__error__" disabled>
											Failed to load cities
										</SelectItem>
									)}
									{cityOptions.length === 0 && (
										<SelectItem value="__none__" disabled>
											No cities found
										</SelectItem>
									)}
									{cityOptions.map(({ value, label }) => (
										<SelectItem key={value} value={value}>
											{label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{fieldErrors["address.city"] && (
								<div className="text-sm text-destructive">
									{fieldErrors["address.city"]}
								</div>
							)}
							<input type="hidden" name="city" value={formCity} />
						</div>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="street">Street</Label>
							<Input
								id="street"
								name="street"
								defaultValue={editingUser?.address?.street}
								placeholder="Street"
								className={
									fieldErrors["address.street"] ? "border-destructive" : ""
								}
								onChange={() => {
									if (fieldErrors["address.street"]) {
										setFieldErrors((prev) => {
											const next = { ...prev };
											delete next["address.street"];
											return next;
										});
									}
								}}
							/>
							{fieldErrors["address.street"] && (
								<div className="text-sm text-destructive">
									{fieldErrors["address.street"]}
								</div>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="block">Block</Label>
							<Input
								id="block"
								name="block"
								defaultValue={editingUser?.address?.block}
								placeholder="Block"
								className={
									fieldErrors["address.block"] ? "border-destructive" : ""
								}
								onChange={() => {
									if (fieldErrors["address.block"]) {
										setFieldErrors((prev) => {
											const next = { ...prev };
											delete next["address.block"];
											return next;
										});
									}
								}}
							/>
							{fieldErrors["address.block"] && (
								<div className="text-sm text-destructive">
									{fieldErrors["address.block"]}
								</div>
							)}
						</div>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="house">House</Label>
							<Input
								id="house"
								name="house"
								defaultValue={editingUser?.address?.house}
								placeholder="House"
								className={
									fieldErrors["address.house"] ? "border-destructive" : ""
								}
								onChange={() => {
									if (fieldErrors["address.house"]) {
										setFieldErrors((prev) => {
											const next = { ...prev };
											delete next["address.house"];
											return next;
										});
									}
								}}
							/>
							{fieldErrors["address.house"] && (
								<div className="text-sm text-destructive">
									{fieldErrors["address.house"]}
								</div>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="flat">Flat</Label>
							<Input
								id="flat"
								name="flat"
								defaultValue={editingUser?.address?.flat}
								placeholder="Flat"
								className={
									fieldErrors["address.flat"] ? "border-destructive" : ""
								}
								onChange={() => {
									if (fieldErrors["address.flat"]) {
										setFieldErrors((prev) => {
											const next = { ...prev };
											delete next["address.flat"];
											return next;
										});
									}
								}}
							/>
							{fieldErrors["address.flat"] && (
								<div className="text-sm text-destructive">
									{fieldErrors["address.flat"]}
								</div>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="avenue">Avenue</Label>
							<Input
								id="avenue"
								name="avenue"
								defaultValue={editingUser?.address?.avenue}
								placeholder="Avenue"
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
								setEditingUser(null);
							}}>
							Cancel
						</Button>
						<Button type="submit" className="flex-1">
							{editingUser ? "Save Changes" : "Add User"}
						</Button>
					</div>
				</form>
			</DetailPanel>
		</AdminLayout>
	);
}

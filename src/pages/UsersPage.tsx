import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { FilterBar } from "@/components/common/FilterBar";
import { DetailPanel } from "@/components/common/DetailPanel";
import { Button } from "@/components/ui/button";
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
import { restApi } from "@/lib/rest-client";
import {
	getEnumOptions,
	getEnumValues,
	kuwaitGovernorateCities,
} from "@/lib/enums";
import { useResourceList } from "@/hooks/use-resource-list";

const formatPhoneNumber = (value: string) => value.trim();

export default function UsersPage() {
	const [search, setSearch] = useState("");
	const [filters, setFilters] = useState<Record<string, string | undefined>>({
		status: "active",
	});
	const [selectedUser, setSelectedUser] = useState<User | null>(null);
	const [showForm, setShowForm] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);
	const [editingUser, setEditingUser] = useState<User | null>(null);
	const [showDeleted, setShowDeleted] = useState(false);
	const [formRole, setFormRole] = useState("user");
	const [formStatus, setFormStatus] = useState("active");
	const [formGovernorate, setFormGovernorate] = useState("");
	const [formCity, setFormCity] = useState("");
	const loadUsers = useCallback(() => restApi.users.getAll(), []);
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
	const userRoleValues = getEnumValues("userRole", userRoles);
	const userRoleOptions = getEnumOptions("userRole", userRoleValues);
	const governorateValues = getEnumValues("kuwaitGovernorate", governorates);
	const governorateOptions = getEnumOptions(
		"kuwaitGovernorate",
		governorateValues,
	);
	const cityValues = getEnumValues("kuwaitCity", cities);
	const cityOptions = getEnumOptions("kuwaitCity", cityValues);
	const filteredCityOptions = useMemo(() => {
		if (!formGovernorate) {
			return cityOptions;
		}
		const entry =
			kuwaitGovernorateCities[
				formGovernorate as keyof typeof kuwaitGovernorateCities
			];
		return entry?.cities ? [...entry.cities] : cityOptions;
	}, [cityOptions, formGovernorate]);

	useEffect(() => {
		if (!showForm || editingUser) {
			return;
		}

		if (!formGovernorate && governorateValues.length > 0) {
			setFormGovernorate(governorateValues[0]);
		}

		if (!formCity && filteredCityOptions.length > 0) {
			setFormCity(filteredCityOptions[0].value);
		}
	}, [
		showForm,
		editingUser,
		formGovernorate,
		formCity,
		governorateValues,
		filteredCityOptions,
	]);

	useEffect(() => {
		if (!showForm) {
			return;
		}

		if (filteredCityOptions.length === 0) {
			if (formCity) {
				setFormCity("");
			}
			return;
		}

		const cityIsValid = filteredCityOptions.some(
			(option) => option.value === formCity,
		);
		if (!cityIsValid) {
			setFormCity(filteredCityOptions[0].value);
		}
	}, [showForm, formGovernorate, filteredCityOptions, formCity]);

	const columns: Column<User>[] = [
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
							{user.username || "—"}
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

	const handleDelete = async (id: string) => {
		try {
			setFormError(null);
			await restApi.usersExtra.softDelete(id);
			await reload();
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to delete user";
			setFormError(message);
			console.error("Failed to delete user", err);
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
		const roles = [formRole.toUpperCase()];
		const isDeleted = formStatus === "inactive";
		const address = {
			street: String(formData.get("street") || ""),
			city: formCity,
			block: String(formData.get("block") || ""),
			governorate: formGovernorate,
			house: String(formData.get("house") || ""),
			flat: String(formData.get("flat") || ""),
		};
		const payload = {
			...(password ? { password } : {}),
			emailAddress,
			phoneNumber,
			roles,
			cardIds: editingUser?.cardIds ?? [],
			isDeleted,
			address,
		};

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
				await restApi.users.update(editingUser._id, payload);
			} else {
				await restApi.users.create(payload);
			}
			await reload();
			setShowForm(false);
			setEditingUser(null);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to save user";
			setFormError(message);
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
						}}
					/>
					<Label htmlFor="show-deleted-users">Show deleted</Label>
				</div>

				<DataTable
					data={filteredUsers}
					columns={columns}
					keyExtractor={(user) => user._id}
					onView={(user) => setSelectedUser(user)}
					onEdit={(user) => {
						setEditingUser(user);
						setFormRole(user.roles?.[0] || "user");
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
								{selectedUser.username && (
									<p className="text-sm text-muted-foreground">
										{selectedUser.username}
									</p>
								)}
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
						<div className="pt-4 border-t border-border">
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
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="phoneNumber">Phone</Label>
							<Input
								id="phoneNumber"
								name="phoneNumber"
								defaultValue={editingUser?.phoneNumber}
								placeholder="Enter phone number"
								required
							/>
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
						/>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="role">Role</Label>
							<Select
								value={formRole}
								onValueChange={(value) => setFormRole(value)}>
								<SelectTrigger>
									<SelectValue placeholder="Select role" />
								</SelectTrigger>
								<SelectContent>
									{userRoleOptions.map(({ value, label }) => (
										<SelectItem key={value} value={value}>
											{label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
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
								onValueChange={(value) => setFormGovernorate(value)}
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
							<input type="hidden" name="governorate" value={formGovernorate} />
						</div>
						<div className="space-y-2">
							<Label>City</Label>
							<Select
								value={formCity}
								onValueChange={(value) => setFormCity(value)}
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
									{filteredCityOptions.length === 0 && (
										<SelectItem value="__none__" disabled>
											No cities found
										</SelectItem>
									)}
									{filteredCityOptions.map(({ value, label }) => (
										<SelectItem key={value} value={value}>
											{label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
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
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="block">Block</Label>
							<Input
								id="block"
								name="block"
								defaultValue={editingUser?.address?.block}
								placeholder="Block"
							/>
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
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="flat">Flat</Label>
							<Input
								id="flat"
								name="flat"
								defaultValue={editingUser?.address?.flat}
								placeholder="Flat"
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

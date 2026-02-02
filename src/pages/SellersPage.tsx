import { useCallback, useMemo, useState } from "react";
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
import type { Item, Seller, User } from "@/types/models";
import { DatePicker, DateTimePicker } from "@/components/ui/date-picker";
import { Store, DollarSign, QrCode, CalendarCheck2 } from "lucide-react";
import { restApi } from "@/lib/rest-client";
import { getEnumOptions, getEnumValues } from "@/lib/enums";
import { useResourceList } from "@/hooks/use-resource-list";

export default function SellersPage() {
	const [search, setSearch] = useState("");
	const [filters, setFilters] = useState<Record<string, string | undefined>>({
		status: "active",
	});
	const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
	const [showForm, setShowForm] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);
	const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
	const [formStep, setFormStep] = useState(1);
	const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
	const [itemSearch, setItemSearch] = useState("");
	const [formUserId, setFormUserId] = useState("");
	const [userSearch, setUserSearch] = useState("");
	const [showDeleted, setShowDeleted] = useState(false);
	const [formGovernorate, setFormGovernorate] = useState("");
	const [formCity, setFormCity] = useState("");
	const [escalationStatusSelectValue, setEscalationStatusSelectValue] =
		useState("__none__");
	const [formPreferredPickupDate, setFormPreferredPickupDate] = useState<
		Date | undefined
	>(undefined);
	const [formPolicyAcceptedAt, setFormPolicyAcceptedAt] = useState<
		Date | undefined
	>(undefined);
	const loadSellers = useCallback(() => {
		// Include deactivated so "Show deleted" filter works without refetch
		return restApi.sellers.getAll({
			includeDeactivated: "true",
		}) as Promise<Seller[]>;
	}, []);
	const loadUsers = useCallback(
		() => restApi.users.getAll() as Promise<User[]>,
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
	const loadItems = useCallback(
		() => restApi.items.getAll() as Promise<Item[]>,
		[],
	);
	const {
		data: sellers,
		loading,
		error,
		reload,
	} = useResourceList(loadSellers);
	const { data: users } = useResourceList(loadUsers);
	const { data: governorates } = useResourceList(loadGovernorates);
	const { data: cities } = useResourceList(loadCities);
	const { data: items } = useResourceList(loadItems);
	const userLabelById = useMemo(
		() =>
			new Map(
				users.map((user) => [
					user._id,
					user.emailAddress || user.username || user._id,
				]),
			),
		[users],
	);
	const governorateValues = getEnumValues("kuwaitGovernorate", governorates);
	const governorateOptions = getEnumOptions(
		"kuwaitGovernorate",
		governorateValues,
	);
	const cityValues = getEnumValues("kuwaitCity", cities);
	const cityOptions = getEnumOptions("kuwaitCity", cityValues);
	/** Resolve raw user id from seller (string or populated object). */
	const getSellerUserId = (seller: Seller): string => {
		const uid = seller.userId;
		if (typeof uid === "string") return uid;
		if (uid && typeof uid === "object" && "_id" in uid)
			return (uid as { _id: string })._id;
		return seller._id;
	};
	const getUserIdLabel = (userId: Seller["userId"]) => {
		if (typeof userId === "string") {
			return userLabelById.get(userId) ?? userId;
		}
		if (userId && typeof userId === "object") {
			const candidate = userId as {
				emailAddress?: string;
				username?: string;
				_id?: string;
			};
			return (
				candidate.emailAddress ?? candidate.username ?? candidate._id ?? "—"
			);
		}
		return "—";
	};
	const formatPickupDate = (value?: string | null) => {
		if (!value) {
			return "—";
		}
		const parsed = Date.parse(value);
		if (Number.isNaN(parsed)) {
			return value;
		}
		return new Date(parsed).toLocaleDateString();
	};
	const itemLabelById = useMemo(
		() =>
			new Map(
				items.map((item) => [
					item._id,
					[item.itemName, item.brandName].filter(Boolean).join(" · ") ||
						item._id,
				]),
			),
		[items],
	);
	const getUserIdValue = (userId: Seller["userId"]) => {
		if (typeof userId === "string") {
			return userId;
		}
		if (userId && typeof userId === "object") {
			const candidate = userId as { _id?: string };
			return candidate._id ?? "";
		}
		return "";
	};
	const filteredUsers = useMemo(() => {
		if (!userSearch) {
			return users;
		}
		const query = userSearch.toLowerCase();
		return users.filter((user) => {
			const label =
				(userLabelById.get(user._id) || "").toLowerCase() ||
				user._id.toLowerCase();
			return (
				label.includes(query) ||
				user._id.toLowerCase().includes(query) ||
				(user.username ?? "").toLowerCase().includes(query) ||
				(user.emailAddress ?? "").toLowerCase().includes(query)
			);
		});
	}, [userLabelById, userSearch, users]);
	const filteredItems = useMemo(() => {
		if (!itemSearch) {
			return items;
		}
		const query = itemSearch.toLowerCase();
		return items.filter((item) => {
			const label =
				itemLabelById.get(item._id)?.toLowerCase() ?? item._id.toLowerCase();
			return (
				label.includes(query) ||
				item._id.toLowerCase().includes(query) ||
				(item.itemName ?? "").toLowerCase().includes(query) ||
				(item.brandName ?? "").toLowerCase().includes(query)
			);
		});
	}, [itemLabelById, itemSearch, items]);

	const formatPhoneNumber = (value: string) => value.trim();

	const columns: Column<Seller>[] = [
		{
			key: "userId",
			header: "Seller",
			render: (seller) => (
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
						<Store className="h-5 w-5 text-primary" />
					</div>
					<div>
						<p className="font-medium text-foreground">
							{getUserIdLabel(seller.userId)}
						</p>
						<p className="text-sm text-muted-foreground truncate max-w-[200px]">
							{seller.IBAN || "—"}
						</p>
					</div>
				</div>
			),
		},
		{
			key: "isDeactivated",
			header: "Status",
			render: (seller) => (
				<StatusBadge status={seller.isDeactivated ? "inactive" : "active"} />
			),
		},
		{
			key: "balance",
			header: "Balance",
			render: (seller) => (
				<span className="font-medium">
					${Number(seller.balance || 0).toFixed(2)}
				</span>
			),
		},
		{
			key: "IBAN",
			header: "IBAN",
			render: (seller) => (
				<span className="text-muted-foreground">{seller.IBAN || "—"}</span>
			),
		},
		{
			key: "itemIds",
			header: "Items",
			render: (seller) => (
				<span className="font-medium">{seller.itemIds?.length ?? 0}</span>
			),
		},
		{
			key: "consentGiven",
			header: "Consent",
			render: (seller) => (
				<span className="text-muted-foreground">
					{seller.consentGiven ? "Yes" : "No"}
				</span>
			),
		},
		{
			key: "preferredPickupDate",
			header: "Pickup",
			render: (seller) => (
				<span className="text-muted-foreground">
					{formatPickupDate(seller.preferredPickupDate)}
				</span>
			),
		},
		{
			key: "createdAt",
			header: "Joined",
			render: (seller) => (
				<span className="text-muted-foreground">
					{new Date(seller.createdAt).toLocaleDateString()}
				</span>
			),
		},
	];

	const filteredSellers = useMemo(() => {
		return sellers.filter((seller) => {
			const matchesSearch =
				search === "" ||
				getUserIdLabel(seller.userId)
					.toLowerCase()
					.includes(search.toLowerCase());
			const matchesStatus =
				!filters.status ||
				(filters.status === "active"
					? !seller.isDeactivated
					: seller.isDeactivated);
			return matchesSearch && matchesStatus;
		});
	}, [filters.status, search, sellers]);

	const handleDelete = async (seller: Seller) => {
		try {
			setFormError(null);
			// DELETE /api/sellers/:id soft-deletes linked user and deactivates seller
			await restApi.sellers.delete(seller._id);
			await reload();
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to delete seller";
			setFormError(message);
			console.error("Failed to delete seller", err);
		}
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		setFormError(null);
		const updatePayload = {
			userId: formUserId,
			balance: Number(formData.get("balance") || 0),
			itemIds: selectedItemIds,
			IBAN: String(formData.get("IBAN") || ""),
			qrCode: String(formData.get("qrCode") || ""),
			isDeactivated: formData.get("isDeactivated") === "on",
			consentGiven: formData.get("consentGiven") === "on",
			preferredPickupDate: formPreferredPickupDate
				? formPreferredPickupDate.toISOString().slice(0, 10)
				: "",
			escalationStatus:
				String(formData.get("escalationStatus") || "").trim() || undefined,
			escalationNotes:
				String(formData.get("escalationNotes") || "").trim() || undefined,
			sellerPolicyAcceptedAt: formPolicyAcceptedAt
				? formPolicyAcceptedAt.toISOString()
				: undefined,
		};
		const password = String(formData.get("password") || "");
		const emailAddress = String(formData.get("emailAddress") || "");
		const phoneNumber = formatPhoneNumber(
			String(formData.get("phoneNumber") || ""),
		);
		const createPayload = {
			password,
			emailAddress,
			phoneNumber,
			address: {
				street: String(formData.get("street") || ""),
				city: formCity,
				block: String(formData.get("block") || ""),
				governorate: formGovernorate,
				house: String(formData.get("house") || ""),
				flat: String(formData.get("flat") || ""),
			},
			roles: ["SELLER"],
			cardIds: [],
			isDeleted: false,
		};
		const createSellerPayload = {
			consentGiven: formData.get("consentGiven") === "on",
			preferredPickupDate: formPreferredPickupDate
				? formPreferredPickupDate.toISOString().slice(0, 10)
				: "",
		};

		try {
			if (!editingSeller) {
				if (!password || !emailAddress || !phoneNumber) {
					setFormError("Please fill in password, email, and phone.");
					return;
				}
				if (
					!createPayload.address.street ||
					!createPayload.address.city ||
					!createPayload.address.block ||
					!createPayload.address.governorate ||
					!createPayload.address.house
				) {
					setFormError("Please complete all required address fields.");
					return;
				}
			}
			if (editingSeller) {
				// PUT /api/sellers/{id} — use user ID so backend resolves seller (single source for seller updates)
				const id = getSellerUserId(editingSeller);
				if (!id) {
					setFormError("Seller user ID is missing.");
					return;
				}
				await restApi.sellers.update(id, updatePayload);
			} else {
				const createdUser = await restApi.users.create(createPayload);
				// id = user ID (backend accepts seller _id or user ID)
				await restApi.sellers.update(createdUser._id, createSellerPayload);
			}
			await reload();
			setShowForm(false);
			setEditingSeller(null);
			setFormPreferredPickupDate(undefined);
			setFormPolicyAcceptedAt(undefined);
			setFormUserId("");
			setUserSearch("");
			setEscalationStatusSelectValue("__none__");
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Failed to save seller";
			setFormError(message);
			console.error("Failed to save seller", err);
		}
	};

	const handleFilterChange = (key: string, value: string | undefined) => {
		if (key === "status") {
			const nextStatus = value === "inactive" ? "inactive" : "active";
			setShowDeleted(nextStatus === "inactive");
			setFilters((prev) => ({ ...prev, status: nextStatus }));
			return;
		}
		setFilters((prev) => ({ ...prev, [key]: value }));
	};

	return (
		<AdminLayout>
			<PageHeader
				title="Sellers"
				description="Manage marketplace sellers and their stores"
				searchValue={search}
				onSearchChange={setSearch}
				searchPlaceholder="Search sellers..."
				onAdd={() => {
					setEditingSeller(null);
					setFormStep(1);
					setFormPreferredPickupDate(undefined);
					setFormPolicyAcceptedAt(undefined);
					setSelectedItemIds([]);
					setItemSearch("");
					setFormUserId("");
					setUserSearch("");
					setFormGovernorate(governorateValues[0] ?? "");
					setFormCity(cityValues[0] ?? "");
					setEscalationStatusSelectValue("__none__");
					setShowForm(true);
				}}
				addLabel="Create Seller"
			/>

			<div className="p-6 space-y-4">
				{(loading || error) && (
					<div className="text-sm text-muted-foreground">
						{loading ? "Loading sellers..." : ""}
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
					]}
					onFilterChange={handleFilterChange}
					onClearAll={() =>
						setFilters({ status: showDeleted ? "inactive" : "active" })
					}
				/>
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<Switch
						id="show-deleted-sellers"
						checked={showDeleted}
						onCheckedChange={(checked) => {
							setShowDeleted(checked);
							setFilters((prev) => ({
								...prev,
								status: checked ? "inactive" : "active",
							}));
						}}
					/>
					<Label htmlFor="show-deleted-sellers">Show deleted</Label>
				</div>

				<DataTable
					data={filteredSellers}
					columns={columns}
					keyExtractor={(seller) => seller._id}
					onView={(seller) => setSelectedSeller(seller)}
					onEdit={(seller) => {
						setEditingSeller(seller);
						setFormStep(1);
						setFormPreferredPickupDate(
							seller.preferredPickupDate
								? new Date(seller.preferredPickupDate)
								: undefined,
						);
						setFormPolicyAcceptedAt(
							seller.sellerPolicyAcceptedAt
								? new Date(seller.sellerPolicyAcceptedAt)
								: undefined,
						);
						setSelectedItemIds(seller.itemIds ?? []);
						setItemSearch("");
						setFormUserId(getUserIdValue(seller.userId));
						setUserSearch("");
						setFormGovernorate("");
						setFormCity("");
						setEscalationStatusSelectValue(
							(seller.escalationStatus ?? "") || "__none__",
						);
						setShowForm(true);
					}}
					onDelete={(seller) => {
						void handleDelete(seller);
					}}
				/>
			</div>

			{/* View Seller Panel */}
			<DetailPanel
				open={!!selectedSeller}
				onClose={() => setSelectedSeller(null)}
				title="Seller Details"
				description={
					selectedSeller ? getUserIdLabel(selectedSeller.userId) : ""
				}>
				{selectedSeller && (
					<div className="space-y-6">
						<div className="flex items-center gap-4">
							<div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
								<Store className="h-8 w-8 text-primary" />
							</div>
							<div>
								<h3 className="text-lg font-semibold">
									{getUserIdLabel(selectedSeller.userId)}
								</h3>
								<StatusBadge
									status={selectedSeller.isDeactivated ? "inactive" : "active"}
								/>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="p-3 bg-muted/30 rounded-lg">
								<div className="flex items-center gap-2 mb-1">
									<DollarSign className="h-4 w-4 text-primary" />
									<span className="text-sm text-muted-foreground">Balance</span>
								</div>
								<p className="text-lg font-semibold">
									${Number(selectedSeller.balance || 0).toFixed(2)}
								</p>
							</div>
							<div className="p-3 bg-muted/30 rounded-lg">
								<div className="flex items-center gap-2 mb-1">
									<Store className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm text-muted-foreground">Items</span>
								</div>
								<p className="text-lg font-semibold">
									{selectedSeller.itemIds?.length ?? 0}
								</p>
							</div>
							<div className="p-3 bg-muted/30 rounded-lg col-span-2">
								<div className="flex items-center gap-2 mb-1">
									<QrCode className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm text-muted-foreground">QR Code</span>
								</div>
								<p className="text-sm text-muted-foreground">
									{selectedSeller.qrCode || "—"}
								</p>
							</div>
							<div className="p-3 bg-muted/30 rounded-lg col-span-2">
								<div className="flex items-center gap-2 mb-1">
									<span className="text-sm text-muted-foreground">IBAN</span>
								</div>
								<p className="text-sm text-muted-foreground">
									{selectedSeller.IBAN || "—"}
								</p>
							</div>
							<div className="p-3 bg-muted/30 rounded-lg">
								<div className="flex items-center gap-2 mb-1">
									<CalendarCheck2 className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm text-muted-foreground">
										Preferred Pickup Date
									</span>
								</div>
								<p className="text-base font-medium text-foreground">
									{formatPickupDate(selectedSeller.preferredPickupDate)}
								</p>
							</div>
							<div className="p-3 bg-muted/30 rounded-lg">
								<div className="flex items-center gap-2 mb-1">
									<span className="text-sm text-muted-foreground">
										Consent Given
									</span>
								</div>
								<p className="text-base font-medium text-foreground">
									{selectedSeller.consentGiven ? "Yes" : "No"}
								</p>
							</div>
							{(selectedSeller.escalationStatus ??
								selectedSeller.escalationNotes) && (
								<>
									<div className="p-3 bg-muted/30 rounded-lg col-span-2">
										<span className="text-sm text-muted-foreground">
											Escalation
										</span>
										<p className="text-sm font-medium mt-1">
											{selectedSeller.escalationStatus || "—"}
										</p>
										{selectedSeller.escalationNotes && (
											<p className="text-sm text-muted-foreground mt-1">
												{selectedSeller.escalationNotes}
											</p>
										)}
									</div>
									<div className="p-3 bg-muted/30 rounded-lg col-span-2">
										<span className="text-sm text-muted-foreground">
											Policy accepted
										</span>
										<p className="text-sm mt-1">
											{selectedSeller.sellerPolicyAcceptedAt
												? new Date(
														selectedSeller.sellerPolicyAcceptedAt,
												  ).toLocaleDateString()
												: "—"}
										</p>
									</div>
								</>
							)}
						</div>
						<Button
							variant="outline"
							className="w-full"
							onClick={() => {
								setEditingSeller(selectedSeller);
								setSelectedItemIds(selectedSeller.itemIds ?? []);
								setFormUserId(getUserIdValue(selectedSeller.userId));
								setUserSearch("");
								setFormGovernorate("");
								setFormCity("");
								setEscalationStatusSelectValue(
									(selectedSeller.escalationStatus ?? "") || "__none__",
								);
								setShowForm(true);
								setSelectedSeller(null);
							}}>
							Edit Seller
						</Button>
					</div>
				)}
			</DetailPanel>

			{/* Update Seller Form */}
			<DetailPanel
				open={showForm}
				onClose={() => {
					setShowForm(false);
					setEditingSeller(null);
					setFormStep(1);
					setSelectedItemIds([]);
					setItemSearch("");
					setFormUserId("");
					setUserSearch("");
					setFormGovernorate("");
					setFormCity("");
					setEscalationStatusSelectValue("__none__");
				}}
				title={editingSeller ? "Update Seller" : "Create Seller"}
				type="dialog"
				size="md">
				<form className="space-y-4" onSubmit={handleSubmit}>
					{formError && (
						<div className="text-sm text-destructive">{formError}</div>
					)}
					<div className="flex items-center justify-between text-sm text-muted-foreground">
						<span>Step {formStep} of 3</span>
						<div className="flex gap-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={formStep === 1}
								onClick={() => setFormStep((prev) => Math.max(1, prev - 1))}>
								Back
							</Button>
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={formStep === 3}
								onClick={() => setFormStep((prev) => Math.min(3, prev + 1))}>
								Next
							</Button>
						</div>
					</div>
					{editingSeller ? (
						<>
							<div className={formStep !== 1 ? "hidden" : undefined}>
								<div className="space-y-2">
									<Label>User</Label>
										<Input
											value={userSearch}
											onChange={(event) => setUserSearch(event.target.value)}
											placeholder="Search users..."
										/>
										<Select
											value={formUserId || "__placeholder__"}
											onValueChange={(value) =>
												setFormUserId(value === "__placeholder__" ? "" : value)
											}>
											<SelectTrigger>
												<SelectValue placeholder="Select user" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="__placeholder__" disabled>
													Select user
												</SelectItem>
												{filteredUsers.length === 0 && (
													<SelectItem value="__none__" disabled>
														No users found
													</SelectItem>
												)}
												{filteredUsers.map((user) => (
													<SelectItem key={user._id} value={user._id}>
														{userLabelById.get(user._id) ?? user._id}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<Label htmlFor="iban">IBAN</Label>
										<Input
											id="IBAN"
											name="IBAN"
											defaultValue={editingSeller?.IBAN}
											placeholder="Enter IBAN"
										/>
									</div>
									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor="balance">Balance</Label>
											<Input
												id="balance"
												name="balance"
												type="number"
												defaultValue={editingSeller?.balance || 0}
												min={0}
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="status">Status</Label>
											<Select
												defaultValue={
													editingSeller?.isDeactivated ? "inactive" : "active"
												}
												onValueChange={(value) => {
													const field = document.querySelector<HTMLInputElement>(
														'input[name="isDeactivated"]',
													);
													if (field) {
														field.value = value === "inactive" ? "on" : "off";
													}
												}}>
												<SelectTrigger>
													<SelectValue placeholder="Select status" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="active">Active</SelectItem>
													<SelectItem value="inactive">Inactive</SelectItem>
												</SelectContent>
											</Select>
											<input
												type="hidden"
												name="isDeactivated"
												defaultValue={editingSeller?.isDeactivated ? "on" : "off"}
											/>
										</div>
									</div>
							</div>
							<div className={formStep !== 2 ? "hidden" : undefined}>
									<div className="space-y-2">
										<Label htmlFor="qrCode">QR Code</Label>
										<Input
											id="qrCode"
											name="qrCode"
											defaultValue={editingSeller?.qrCode}
											placeholder="QR Code"
										/>
									</div>
									<div className="space-y-2">
										<Label>Preferred pickup date</Label>
										<DatePicker
											value={formPreferredPickupDate}
											onChange={setFormPreferredPickupDate}
											placeholder="Select date"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="consentGiven" className="text-sm font-medium">
											Consent Given
										</Label>
										<label
											htmlFor="consentGiven"
											className="flex h-10 cursor-pointer items-center gap-3 rounded-md border border-input bg-background px-3 text-sm ring-offset-background has-[:focus]:ring-2 has-[:focus]:ring-ring has-[:focus]:ring-offset-2">
											<input
												type="checkbox"
												id="consentGiven"
												name="consentGiven"
												defaultChecked={editingSeller?.consentGiven}
												className="h-4 w-4 rounded border border-input accent-primary"
											/>
											<span>Consent Given</span>
										</label>
									</div>
							</div>
							<div className={formStep !== 3 ? "hidden" : undefined}>
									<div className="space-y-2">
										<Label htmlFor="escalationStatus">Escalation status</Label>
										<Select
											value={escalationStatusSelectValue}
											onValueChange={(value) => {
												setEscalationStatusSelectValue(value);
												const el = document.querySelector<HTMLInputElement>(
													'input[name="escalationStatus"]',
												);
												if (el) el.value = value === "__none__" ? "" : value;
											}}>
											<SelectTrigger>
												<SelectValue placeholder="None" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="__none__">None</SelectItem>
												<SelectItem value="seller_no_response">
													Seller no response
												</SelectItem>
												<SelectItem value="escalated">Escalated</SelectItem>
												<SelectItem value="resolved">Resolved</SelectItem>
											</SelectContent>
										</Select>
										<input
											type="hidden"
											name="escalationStatus"
											value={
												escalationStatusSelectValue === "__none__"
													? ""
													: escalationStatusSelectValue
											}
											readOnly
											aria-hidden
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="escalationNotes">Escalation notes</Label>
										<Input
											id="escalationNotes"
											name="escalationNotes"
											defaultValue={editingSeller?.escalationNotes ?? ""}
											placeholder="Notes"
										/>
									</div>
									<div className="space-y-2">
										<Label>Policy accepted at</Label>
										<DateTimePicker
											value={formPolicyAcceptedAt}
											onChange={setFormPolicyAcceptedAt}
											placeholder="Select date and time"
										/>
									</div>
									<div className="space-y-2">
										<Label>Items</Label>
										<Input
											value={itemSearch}
											onChange={(event) => setItemSearch(event.target.value)}
											placeholder="Search items..."
										/>
										<div className="border border-input rounded-md p-3 max-h-56 overflow-y-auto space-y-2">
											{filteredItems.length === 0 && (
												<p className="text-sm text-muted-foreground">
													No items found.
												</p>
											)}
											{filteredItems.map((item) => (
												<label
													key={item._id}
													className="flex items-center gap-3 text-sm text-foreground">
													<Checkbox
														checked={selectedItemIds.includes(item._id)}
														onCheckedChange={(checked) => {
															setSelectedItemIds((prev) => {
																if (checked) {
																	return prev.includes(item._id)
																		? prev
																		: [...prev, item._id];
																}
																return prev.filter((id) => id !== item._id);
															});
														}}
													/>
													<span className="truncate">
														{itemLabelById.get(item._id)}
													</span>
												</label>
											))}
										</div>
									</div>
							</div>
						</>
					) : (
						<>
							{formStep === 1 && (
								<>
									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor="emailAddress">Email</Label>
											<Input
												id="emailAddress"
												name="emailAddress"
												type="email"
												placeholder="seller@example.com"
												required
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="phoneNumber">Phone</Label>
											<Input
												id="phoneNumber"
												name="phoneNumber"
												placeholder="66651092"
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
											placeholder="P@ssw0rd123!"
											required
										/>
									</div>
								</>
							)}
							{formStep === 2 && (
								<>
									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label>Governorate</Label>
											<Select
												value={formGovernorate}
												onValueChange={(value) => setFormGovernorate(value)}>
												<SelectTrigger>
													<SelectValue placeholder="Select governorate" />
												</SelectTrigger>
												<SelectContent>
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
											<input
												type="hidden"
												name="governorate"
												value={formGovernorate}
											/>
										</div>
										<div className="space-y-2">
											<Label>City</Label>
											<Select
												value={formCity}
												onValueChange={(value) => setFormCity(value)}>
												<SelectTrigger>
													<SelectValue placeholder="Select city" />
												</SelectTrigger>
												<SelectContent>
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
											<input type="hidden" name="city" value={formCity} />
										</div>
									</div>
									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor="street">Street</Label>
											<Input id="street" name="street" placeholder="Street" />
										</div>
										<div className="space-y-2">
											<Label htmlFor="block">Block</Label>
											<Input id="block" name="block" placeholder="Block" />
										</div>
									</div>
									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor="house">House</Label>
											<Input id="house" name="house" placeholder="House" />
										</div>
										<div className="space-y-2">
											<Label htmlFor="flat">Flat</Label>
											<Input id="flat" name="flat" placeholder="Flat" />
										</div>
									</div>
								</>
							)}
							{formStep === 3 && (
								<>
									<div className="space-y-2">
										<Label>Preferred pickup date</Label>
										<DatePicker
											value={formPreferredPickupDate}
											onChange={setFormPreferredPickupDate}
											placeholder="Select date"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="consentGivenStep3" className="text-sm font-medium">
											Consent Given
										</Label>
										<label
											htmlFor="consentGivenStep3"
											className="flex h-10 cursor-pointer items-center gap-3 rounded-md border border-input bg-background px-3 text-sm ring-offset-background has-[:focus]:ring-2 has-[:focus]:ring-ring has-[:focus]:ring-offset-2">
											<input
												type="checkbox"
												id="consentGivenStep3"
												name="consentGiven"
												defaultChecked={editingSeller?.consentGiven}
												className="h-4 w-4 rounded border border-input accent-primary"
											/>
											<span>Consent Given</span>
										</label>
									</div>
								</>
							)}
						</>
					)}
					<div className="flex gap-3 pt-4">
						<Button
							type="button"
							variant="outline"
							className="flex-1"
							onClick={() => {
								setShowForm(false);
								setEditingSeller(null);
								setEscalationStatusSelectValue("__none__");
							}}>
							Cancel
						</Button>
						<Button type="submit" className="flex-1">
							{editingSeller ? "Update Seller" : "Create Seller"}
						</Button>
					</div>
				</form>
			</DetailPanel>
		</AdminLayout>
	);
}

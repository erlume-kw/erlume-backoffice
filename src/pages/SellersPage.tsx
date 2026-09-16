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
import { Store, QrCode, CalendarCheck2 } from "lucide-react";
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
	const [formIsDeactivated, setFormIsDeactivated] = useState(false);
	const [formGovernorate, setFormGovernorate] = useState("");
	const [formCity, setFormCity] = useState("");
	const [escalationStatusSelectValue, setEscalationStatusSelectValue] =
		useState("__none__");
	const [onboardingStatusSelectValue, setOnboardingStatusSelectValue] =
		useState("__none__");
	const [
		itemsOnboardingStatusSelectValue,
		setItemsOnboardingStatusSelectValue,
	] = useState("__none__");
	const [formPreferredPickupDate, setFormPreferredPickupDate] = useState<
		Date | undefined
	>(undefined);
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [showBulkUpdate, setShowBulkUpdate] = useState(false);
	// Payout
	const [showPayoutForm, setShowPayoutForm] = useState(false);
	const [payoutAmount, setPayoutAmount] = useState("");
	const [payoutMethod, setPayoutMethod] = useState("bank_transfer");
	const [payoutNotes, setPayoutNotes] = useState("");
	const [payoutError, setPayoutError] = useState<string | null>(null);
	const [payoutLoading, setPayoutLoading] = useState(false);
	const [payoutHistory, setPayoutHistory] = useState<any[]>([]);
	const [payoutHistoryLoading, setPayoutHistoryLoading] = useState(false);
	const [editingPayout, setEditingPayout] = useState<any | null>(null);
	const [editPayoutAmount, setEditPayoutAmount] = useState("");
	const [editPayoutMethod, setEditPayoutMethod] = useState("bank_transfer");
	const [editPayoutNotes, setEditPayoutNotes] = useState("");
	const [editPayoutLoading, setEditPayoutLoading] = useState(false);
	const [bulkOnboardingStatus, setBulkOnboardingStatus] = useState("");
	const [bulkItemsOnboardingStatus, setBulkItemsOnboardingStatus] =
		useState("");
	const [bulkLoading, setBulkLoading] = useState(false);
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
	const sellerOnboardingOptions = [
		{ value: "initial_contact", label: "Initial Contact" },
		{ value: "price_shared", label: "Price Shared" },
		{ value: "google_form_submitted", label: "Google Form Submitted" },
		{ value: "manual_entry_pending", label: "Manual Entry Pending" },
		{ value: "ready_for_pickup", label: "Ready For Pickup" },
		{ value: "onboarded", label: "Onboarded" },
	];
	const itemsOnboardingOptions = [
		{ value: "no_items", label: "No Items" },
		{ value: "items_pending_pickup", label: "Items Pending Pickup" },
		{ value: "items_received", label: "Items Received" },
		{ value: "items_in_processing", label: "Items In Processing" },
		{ value: "items_listed", label: "Items Listed" },
		{ value: "partially_listed", label: "Partially Listed" },
	];
	const {
		data: sellers,
		loading,
		error,
		reload,
	} = useResourceList(loadSellers);
	const { data: users, reload: reloadUsers } = useResourceList(loadUsers);
	const { data: governorates } = useResourceList(loadGovernorates);
	const { data: cities } = useResourceList(loadCities);
	const { data: items, reload: reloadItems } = useResourceList(loadItems);
	const handleRefresh = () => { void Promise.all([reload(), reloadUsers(), reloadItems()]); };
	const userLabelById = useMemo(
		() =>
			new Map(
				users.map((user) => [
					user._id,
					user.emailAddress || user.phoneNumber || user._id,
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
	/** Item count per seller derived from items (item.seller_id / sellerId). More accurate than seller.itemIds when backend doesn't sync it. */
	const itemCountBySellerId = useMemo(() => {
		const countBy = new Map<string, number>();
		for (const item of items) {
			const sid =
				(item as Item & { sellerId?: string }).sellerId ?? item.seller_id ?? "";
			if (!sid) continue;
			countBy.set(sid, (countBy.get(sid) ?? 0) + 1);
		}
		return countBy;
	}, [items]);
	const getItemCountForSeller = (seller: Seller): number => {
		const bySellerId = itemCountBySellerId.get(seller._id);
		if (bySellerId !== undefined) return bySellerId;
		const byUserId = itemCountBySellerId.get(getSellerUserId(seller));
		if (byUserId !== undefined) return byUserId;
		return seller.itemIds?.length ?? 0;
	};
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
				(user.phoneNumber ?? "").toLowerCase().includes(query) ||
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
	const allFilteredSellerIds = filteredSellers.map((s) => s._id);
	const allSellersSelected =
		allFilteredSellerIds.length > 0 &&
		allFilteredSellerIds.every((id) => selectedIds.includes(id));

	const columns: Column<Seller>[] = [
		{
			key: "_select",
			header: (
				<Checkbox
					checked={allSellersSelected}
					onCheckedChange={(v) => {
						if (v) setSelectedIds(allFilteredSellerIds);
						else setSelectedIds([]);
					}}
				/>
			),
			render: (seller) => (
				<Checkbox
					checked={selectedIds.includes(seller._id)}
					onCheckedChange={(v) => {
						setSelectedIds((prev) =>
							v
								? [...prev, seller._id]
								: prev.filter((id) => id !== seller._id),
						);
					}}
				/>
			),
		},
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
			key: "onboardingStatus",
			header: "Onboarding",
			render: (seller) =>
				seller.onboardingStatus ? (
					<StatusBadge status={seller.onboardingStatus} />
				) : (
					<span className="text-muted-foreground">—</span>
				),
		},
		{
			key: "itemsOnboardingStatus",
			header: "Items Status",
			render: (seller) =>
				seller.itemsOnboardingStatus ? (
					<StatusBadge status={seller.itemsOnboardingStatus} />
				) : (
					<span className="text-muted-foreground">—</span>
				),
		},
		{
			key: "balance",
			header: "Balance",
			render: (seller) => (
				<span className="font-medium">
					KWD {Number(seller.balance || 0).toFixed(3)}
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
				<span className="font-medium">{getItemCountForSeller(seller)}</span>
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

	const handleBulkDelete = async () => {
		if (!selectedIds.length) return;
		setBulkLoading(true);
		try {
			await Promise.all(selectedIds.map((id) => restApi.sellers.delete(id)));
			setSelectedIds([]);
			await reload();
		} catch (err) {
			console.error("Bulk delete failed", err);
		} finally {
			setBulkLoading(false);
		}
	};

	const handleBulkUpdate = async () => {
		if (
			!selectedIds.length ||
			(!bulkOnboardingStatus && !bulkItemsOnboardingStatus)
		)
			return;
		setBulkLoading(true);
		try {
			const patch: Record<string, string> = {};
			if (bulkOnboardingStatus) patch.onboardingStatus = bulkOnboardingStatus;
			if (bulkItemsOnboardingStatus)
				patch.itemsOnboardingStatus = bulkItemsOnboardingStatus;
			await Promise.all(
				selectedIds.map((id) => restApi.sellers.patch(id, patch)),
			);
			setSelectedIds([]);
			setShowBulkUpdate(false);
			setBulkOnboardingStatus("");
			setBulkItemsOnboardingStatus("");
			await reload();
		} catch (err) {
			console.error("Bulk update failed", err);
		} finally {
			setBulkLoading(false);
		}
	};

	const loadPayoutHistory = async (sellerId: string) => {
		setPayoutHistoryLoading(true);
		try {
			const res = await fetch(`/api/payouts?seller_id=${sellerId}`, {
				headers: { Authorization: `Bearer ${localStorage.getItem("erlume_token")}` },
			});
			const data = await res.json();
			setPayoutHistory(data.data ?? []);
		} catch {
			setPayoutHistory([]);
		} finally {
			setPayoutHistoryLoading(false);
		}
	};

	const handlePayout = async () => {
		if (!selectedSeller) return;
		setPayoutError(null);
		setPayoutLoading(true);
		try {
			const res = await fetch("/api/payouts", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("erlume_token")}`,
				},
				body: JSON.stringify({
					seller_id: selectedSeller._id,
					amount: payoutAmount,
					method: payoutMethod,
					notes: payoutNotes || undefined,
				}),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Payout failed");
			setShowPayoutForm(false);
			setPayoutAmount("");
			setPayoutNotes("");
			setPayoutMethod("bank_transfer");
			// Reload sellers then update selectedSeller from fresh data
			await reload();
			setSelectedSeller((prev) =>
				prev ? { ...prev, balance: data.newBalance ?? "0.000" } : prev,
			);
			void loadPayoutHistory(selectedSeller._id);
		} catch (err: any) {
			setPayoutError(err.message || "Failed to record payout");
		} finally {
			setPayoutLoading(false);
		}
	};

	const handleEditPayout = async () => {
		if (!editingPayout || !selectedSeller) return;
		setEditPayoutLoading(true);
		try {
			const res = await fetch(`/api/payouts/${editingPayout._id}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("erlume_token")}`,
				},
				body: JSON.stringify({
					amount: editPayoutAmount,
					method: editPayoutMethod,
					notes: editPayoutNotes || undefined,
				}),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Update failed");
			if (data.newBalance !== undefined) {
				setSelectedSeller((prev) => prev ? { ...prev, balance: data.newBalance } : prev);
			}
			setEditingPayout(null);
			void loadPayoutHistory(selectedSeller._id);
			await reload();
		} catch (err: any) {
			alert(err.message);
		} finally {
			setEditPayoutLoading(false);
		}
	};

	const handleDeletePayout = async (payoutId: string) => {
		if (!selectedSeller) return;
		if (!window.confirm("Delete this payout? The balance will be restored.")) return;
		try {
			const res = await fetch(`/api/payouts/${payoutId}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${localStorage.getItem("erlume_token")}` },
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Delete failed");
			// Restore balance in UI
			const restored = (parseFloat(String(selectedSeller.balance)) || 0) +
				parseFloat(String(payoutHistory.find((p) => p._id === payoutId)?.amount || 0));
			setSelectedSeller((prev) => prev ? { ...prev, balance: restored.toFixed(3) } : prev);
			void loadPayoutHistory(selectedSeller._id);
			await reload();
		} catch (err: any) {
			alert(err.message);
		}
	};

	const handleDelete = async (seller: Seller) => {
		try {
			setFormError(null);
			// DELETE /api/sellers/:id soft-deletes linked user and deactivates seller
			await restApi.sellers.delete(seller._id);
			// Clear selected seller if it was the one deleted
			if (selectedSeller?._id === seller._id) {
				setSelectedSeller(null);
			}
			// Clear editing seller if it was the one deleted
			if (editingSeller?._id === seller._id) {
				setEditingSeller(null);
				setShowForm(false);
			}
			await Promise.all([reload(), reloadItems(), reloadUsers()]);
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
			balance: String(formData.get("balance") || "0"),
			itemIds: selectedItemIds,
			IBAN: String(formData.get("IBAN") || ""),
			qrCode: String(formData.get("qrCode") || ""),
			isDeactivated: formData.get("isDeactivated") === "on",
			consentGiven: formData.get("consentGiven") === "on",
			preferredPickupDate: formPreferredPickupDate && !isNaN(formPreferredPickupDate.getTime())
				? formPreferredPickupDate.toISOString().slice(0, 10)
				: "",
			escalationStatus:
				String(formData.get("escalationStatus") || "").trim() || undefined,
			escalationNotes:
				String(formData.get("escalationNotes") || "").trim() || undefined,
			onboardingStatus:
				onboardingStatusSelectValue === "__none__"
					? undefined
					: onboardingStatusSelectValue,
			itemsOnboardingStatus:
				itemsOnboardingStatusSelectValue === "__none__"
					? undefined
					: itemsOnboardingStatusSelectValue,
			sellerPolicyAcceptedAt: formPolicyAcceptedAt
				? formPolicyAcceptedAt.toISOString()
				: undefined,
		};
		const password = String(formData.get("password") || "");
		const emailAddress = String(formData.get("emailAddress") || "");
		const phoneNumber = formatPhoneNumber(
			String(formData.get("phoneNumber") || ""),
		);
		const street = String(formData.get("street") || "").trim();
		const block = String(formData.get("block") || "").trim();
		const house = String(formData.get("house") || "").trim();
		const flat = String(formData.get("flat") || "").trim();
		const avenue = String(formData.get("avenue") || "").trim();
		const createPayload: Record<string, unknown> = {
			password,
			emailAddress,
			phoneNumber,
			address: {
				street,
				city: formCity,
				block,
				governorate: formGovernorate,
				house,
				...(flat ? { flat } : {}),
				...(avenue ? { avenue } : {}),
			},
			roles: ["seller"], // Backend expects lowercase: "user" | "seller" | "admin"
			cardIds: [],
			isDeleted: false,
		};
		const createSellerPayload = {
			consentGiven: formData.get("consentGiven") === "on",
			preferredPickupDate: formPreferredPickupDate && !isNaN(formPreferredPickupDate.getTime())
				? formPreferredPickupDate.toISOString().slice(0, 10)
				: "",
			onboardingStatus:
				onboardingStatusSelectValue === "__none__"
					? undefined
					: onboardingStatusSelectValue,
			itemsOnboardingStatus:
				itemsOnboardingStatusSelectValue === "__none__"
					? undefined
					: itemsOnboardingStatusSelectValue,
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
				// PUT /api/sellers/:id — :id is seller document _id or user id (same resolution as GET/DELETE)
				const id = editingSeller._id;
				if (!id) {
					setFormError("Seller ID is missing.");
					return;
				}
				await restApi.sellers.update(id, updatePayload);
				// Sync item.seller_id so Items page and item count reflect the assignment (seller document _id)
				const sellerDocId = editingSeller._id;
				const previousItemIds = editingSeller.itemIds ?? [];
				const itemSyncErrors: string[] = [];
				let firstErrorMessage: string | null = null;
				// Try PATCH first (partial update), then PUT fallback.
				// For clear, backend validators can reject null ObjectId, so we try a few payload shapes.
				const assignPayload = { seller_id: sellerDocId, sellerId: sellerDocId };
				const clearPayloadCandidates: Array<Record<string, unknown>> = [
					{ seller_id: null, sellerId: null },
					{ seller_id: "" },
					{ sellerId: "" },
				];
				const updateItemSeller = async (
					itemId: string,
					payloads: Array<Record<string, unknown>>,
					options?: { ignoreValidationError?: boolean },
				): Promise<void> => {
					let lastError: unknown;
					for (const payload of payloads) {
						try {
							await restApi.items.patch(itemId, payload);
							return;
						} catch (patchErr) {
							lastError = patchErr;
							try {
								await restApi.items.update(itemId, payload as Partial<Item>);
								return;
							} catch (putErr) {
								lastError = putErr;
							}
						}
					}
					const message =
						lastError instanceof Error ? lastError.message : String(lastError);
					if (
						options?.ignoreValidationError &&
						message.toLowerCase().includes("validation error")
					) {
						// Some backends disallow explicit clearing of seller_id (ObjectId validator).
						// Seller document is still saved; skip blocking submit on this specific case.
						return;
					}
					if (!firstErrorMessage) firstErrorMessage = message;
					throw lastError;
				};
				for (const itemId of selectedItemIds) {
					try {
						await updateItemSeller(itemId, [assignPayload]);
					} catch (e) {
						console.error("Failed to set item seller_id:", itemId, e);
						itemSyncErrors.push(itemId);
					}
				}
				for (const itemId of previousItemIds) {
					if (selectedItemIds.includes(itemId)) continue;
					try {
						await updateItemSeller(itemId, clearPayloadCandidates, {
							ignoreValidationError: true,
						});
					} catch (e) {
						console.error("Failed to clear item seller_id:", itemId, e);
						itemSyncErrors.push(itemId);
					}
				}
				if (itemSyncErrors.length > 0) {
					// Seller was saved — close form and reload, then show a non-blocking warning
					await Promise.all([reload(), reloadItems(), reloadUsers()]);
					setShowForm(false);
					setEditingSeller(null);
					setFormStep(1);
					setSelectedItemIds([]);
					setFormPreferredPickupDate(undefined);
					setFormPolicyAcceptedAt(undefined);
					setFormUserId("");
					setUserSearch("");
					setEscalationStatusSelectValue("__none__");
					setOnboardingStatusSelectValue("__none__");
					setItemsOnboardingStatusSelectValue("__none__");
					setFormError(null);
					// Log warning but don't block the user
					console.warn(
						`Seller saved, but ${itemSyncErrors.length} item(s) could not be synced (they may not exist in the DB).`,
					);
					return;
				}
			} else {
				let createdUser = await restApi.users.create(createPayload);
				if (!createdUser || !createdUser._id) {
					// If response is empty but creation succeeded (201), try to find the user by email
					// Wait a bit for the database to be consistent
					await new Promise((resolve) => setTimeout(resolve, 500));
					const allUsers = await restApi.users.getAll();
					const foundUser = allUsers.find(
						(u) => u.emailAddress === emailAddress,
					);
					if (!foundUser) {
						// Still reload to show the created seller if it exists
						await Promise.all([reload(), reloadItems(), reloadUsers()]);
						setFormError(
							"User was created but response was empty. Please check if the seller was created successfully.",
						);
						return;
					}
					createdUser = foundUser;
				}
				// id = user ID (backend accepts seller _id or user ID)
				await restApi.sellers.update(createdUser._id, createSellerPayload);
			}
			await Promise.all([reload(), reloadItems(), reloadUsers()]);
			// Clear form state
			setShowForm(false);
			setEditingSeller(null);
			setFormStep(1);
			setSelectedItemIds([]);
			setFormPreferredPickupDate(undefined);
			setFormPolicyAcceptedAt(undefined);
			setFormUserId("");
			setUserSearch("");
			setEscalationStatusSelectValue("__none__");
			setOnboardingStatusSelectValue("__none__");
			setItemsOnboardingStatusSelectValue("__none__");
			setFormError(null);
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
				onRefresh={handleRefresh}
				refreshing={loading}
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
					setFormIsDeactivated(false);
					setEscalationStatusSelectValue("__none__");
					setOnboardingStatusSelectValue("__none__");
					setItemsOnboardingStatusSelectValue("__none__");
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
							// Reload to ensure we have fresh data
							reload();
						}}
					/>
					<Label htmlFor="show-deleted-sellers">Show deleted</Label>
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
									<Select
										value={bulkOnboardingStatus}
										onValueChange={setBulkOnboardingStatus}>
										<SelectTrigger className="h-8 w-44 text-xs">
											<SelectValue placeholder="Set onboarding" />
										</SelectTrigger>
										<SelectContent>
											{sellerOnboardingOptions.map(({ value, label }) => (
												<SelectItem
													key={value}
													value={value}
													className="text-xs">
													{label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<Select
										value={bulkItemsOnboardingStatus}
										onValueChange={setBulkItemsOnboardingStatus}>
										<SelectTrigger className="h-8 w-44 text-xs">
											<SelectValue placeholder="Set items status" />
										</SelectTrigger>
										<SelectContent>
											{itemsOnboardingOptions.map(({ value, label }) => (
												<SelectItem
													key={value}
													value={value}
													className="text-xs">
													{label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<Button
										size="sm"
										className="h-8 text-xs"
										disabled={
											bulkLoading ||
											(!bulkOnboardingStatus && !bulkItemsOnboardingStatus)
										}
										onClick={() => void handleBulkUpdate()}>
										{bulkLoading ? "Updating..." : "Apply"}
									</Button>
								</>
							)}
						</div>
					</div>
				)}
				<DataTable
					data={filteredSellers}
					columns={columns}
					keyExtractor={(seller) => seller._id}
					onView={(seller) => {
						setSelectedSeller(seller);
						setShowPayoutForm(false);
						setPayoutAmount("");
						setPayoutNotes("");
						setPayoutError(null);
						void loadPayoutHistory(seller._id);
					}}
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
						setFormIsDeactivated(!!seller.isDeactivated);
						setEscalationStatusSelectValue(
							(seller.escalationStatus ?? "") || "__none__",
						);
						setOnboardingStatusSelectValue(
							seller.onboardingStatus || "initial_contact",
						);
						setItemsOnboardingStatusSelectValue(
							seller.itemsOnboardingStatus || "no_items",
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
							<div className="p-3 bg-muted/30 rounded-lg col-span-2">
								<div className="flex items-center justify-between mb-2">
									<div className="flex items-center gap-2">
										<span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">KWD</span>
										<span className="text-sm text-muted-foreground">Balance Owed</span>
									</div>
									{Number(selectedSeller.balance || 0) > 0 && (
										<Button size="sm" variant="outline" className="h-7 text-xs"
											onClick={() => setShowPayoutForm((v) => !v)}>
											{showPayoutForm ? "Cancel" : "Mark as Paid"}
										</Button>
									)}
								</div>
								<p className="text-2xl font-semibold text-primary">
									KWD {Number(selectedSeller.balance || 0).toFixed(3)}
								</p>

								{/* Payout form */}
								{showPayoutForm && (
									<div className="mt-3 space-y-2 border-t border-border pt-3">
										{payoutError && (
											<p className="text-xs text-destructive">{payoutError}</p>
										)}
										<div className="grid grid-cols-2 gap-2">
											<div className="space-y-1">
												<div className="flex items-center justify-between">
													<Label className="text-xs">Amount (KWD) *</Label>
													<button type="button" className="text-xs text-primary underline leading-none"
														onClick={() => setPayoutAmount(Number(selectedSeller.balance || 0).toFixed(3))}>
														Pay all
													</button>
												</div>
												<Input
													type="number" step="0.001" min="0.001"
													value={payoutAmount}
													onChange={(e) => setPayoutAmount(e.target.value)}
													placeholder={`Max ${Number(selectedSeller.balance || 0).toFixed(3)}`}
												/>
											</div>
											<div className="space-y-1">
												<Label className="text-xs">Method</Label>
												<Select value={payoutMethod} onValueChange={setPayoutMethod}>
													<SelectTrigger className="h-9">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="bank_transfer">Bank Transfer</SelectItem>
														<SelectItem value="cash">Cash</SelectItem>
														<SelectItem value="knet">KNET</SelectItem>
														<SelectItem value="other">Other</SelectItem>
													</SelectContent>
												</Select>
											</div>
										</div>
										<div className="space-y-1">
											<Label className="text-xs">Notes (optional)</Label>
											<Input
												value={payoutNotes}
												onChange={(e) => setPayoutNotes(e.target.value)}
												placeholder="e.g. Transferred to IBAN KW..."
											/>
										</div>
										<Button
											size="sm" className="w-full"
											disabled={payoutLoading || !payoutAmount}
											onClick={() => void handlePayout()}>
											{payoutLoading ? "Recording..." : "Confirm Payout"}
										</Button>
									</div>
								)}
							</div>
							<div className="p-3 bg-muted/30 rounded-lg">
								<div className="flex items-center gap-2 mb-1">
									<Store className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm text-muted-foreground">Items</span>
								</div>
								<p className="text-lg font-semibold">
									{getItemCountForSeller(selectedSeller)}
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
								<p className="text-sm font-mono">
									{selectedSeller.IBAN || "—"}
								</p>
							</div>

							{/* Payout history */}
							<div className="col-span-2 space-y-2">
								<p className="text-sm font-medium">Payout History</p>
								{payoutHistoryLoading ? (
									<p className="text-xs text-muted-foreground">Loading...</p>
								) : payoutHistory.length === 0 ? (
									<p className="text-xs text-muted-foreground">No payouts recorded yet.</p>
								) : (
									<div className="space-y-2">
										{payoutHistory.map((p: any) => (
											<div key={p._id} className="rounded-md border border-border px-3 py-2 text-sm space-y-2">
												{editingPayout?._id === p._id ? (
													<div className="space-y-2">
														<div className="grid grid-cols-2 gap-2">
															<div className="space-y-1">
																<Label className="text-xs">Amount</Label>
																<Input type="number" step="0.001" min="0.001"
																	value={editPayoutAmount}
																	onChange={(e) => setEditPayoutAmount(e.target.value)} />
															</div>
															<div className="space-y-1">
																<Label className="text-xs">Method</Label>
																<Select value={editPayoutMethod} onValueChange={setEditPayoutMethod}>
																	<SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
																	<SelectContent>
																		<SelectItem value="bank_transfer">Bank Transfer</SelectItem>
																		<SelectItem value="cash">Cash</SelectItem>
																		<SelectItem value="knet">KNET</SelectItem>
																		<SelectItem value="other">Other</SelectItem>
																	</SelectContent>
																</Select>
															</div>
														</div>
														<Input placeholder="Notes (optional)"
															value={editPayoutNotes}
															onChange={(e) => setEditPayoutNotes(e.target.value)} />
														<div className="flex gap-2">
															<Button size="sm" className="flex-1" disabled={editPayoutLoading}
																onClick={() => void handleEditPayout()}>
																{editPayoutLoading ? "Saving..." : "Save"}
															</Button>
															<Button size="sm" variant="outline" className="flex-1"
																onClick={() => setEditingPayout(null)}>
																Cancel
															</Button>
														</div>
													</div>
												) : (
													<div className="flex items-center justify-between">
														<div>
															<p className="font-medium">KWD {Number(p.amount).toFixed(3)}</p>
															<p className="text-xs text-muted-foreground capitalize">
																{p.method?.replace("_", " ")} · {new Date(p.paid_at).toLocaleDateString()}
															</p>
															{p.notes && <p className="text-xs text-muted-foreground">{p.notes}</p>}
														</div>
														<div className="flex gap-1">
															<Button size="sm" variant="ghost" className="h-7 text-xs"
																onClick={() => {
																	setEditingPayout(p);
																	setEditPayoutAmount(p.amount);
																	setEditPayoutMethod(p.method || "bank_transfer");
																	setEditPayoutNotes(p.notes || "");
																}}>
																Edit
															</Button>
															<Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive"
																onClick={() => void handleDeletePayout(p._id)}>
																Delete
															</Button>
														</div>
													</div>
												)}
											</div>
										))}
									</div>
								)}
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
							{(selectedSeller.onboardingStatus ||
								selectedSeller.itemsOnboardingStatus) && (
								<>
									<div className="p-3 bg-muted/30 rounded-lg">
										<span className="text-sm text-muted-foreground">
											Seller Onboarding
										</span>
										<div className="mt-1">
											{selectedSeller.onboardingStatus ? (
												<StatusBadge status={selectedSeller.onboardingStatus} />
											) : (
												<p className="text-sm">—</p>
											)}
										</div>
									</div>
									<div className="p-3 bg-muted/30 rounded-lg">
										<span className="text-sm text-muted-foreground">
											Items Onboarding
										</span>
										<div className="mt-1">
											{selectedSeller.itemsOnboardingStatus ? (
												<StatusBadge
													status={selectedSeller.itemsOnboardingStatus}
												/>
											) : (
												<p className="text-sm">—</p>
											)}
										</div>
									</div>
								</>
							)}

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
								setFormStep(1);
								setFormPreferredPickupDate(
									selectedSeller.preferredPickupDate
										? new Date(selectedSeller.preferredPickupDate)
										: undefined,
								);
								setFormPolicyAcceptedAt(
									selectedSeller.sellerPolicyAcceptedAt
										? new Date(selectedSeller.sellerPolicyAcceptedAt)
										: undefined,
								);
								setSelectedItemIds(selectedSeller.itemIds ?? []);
								setFormUserId(getUserIdValue(selectedSeller.userId));
								setUserSearch("");
								setFormGovernorate("");
								setFormCity("");
								setFormIsDeactivated(!!selectedSeller.isDeactivated);
								setEscalationStatusSelectValue(
									(selectedSeller.escalationStatus ?? "") || "__none__",
								);
								setOnboardingStatusSelectValue(
									selectedSeller.onboardingStatus || "initial_contact",
								);
								setItemsOnboardingStatusSelectValue(
									selectedSeller.itemsOnboardingStatus || "no_items",
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
					setFormIsDeactivated(false);
					setEscalationStatusSelectValue("__none__");
					setOnboardingStatusSelectValue("__none__");
					setItemsOnboardingStatusSelectValue("__none__");
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
										value={
											formUserId &&
											(filteredUsers.some((u) => u._id === formUserId) ||
												(editingSeller &&
													getUserIdValue(editingSeller.userId) === formUserId))
												? formUserId
												: "__placeholder__"
										}
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
											{editingSeller &&
												formUserId &&
												!filteredUsers.some((u) => u._id === formUserId) && (
													<SelectItem value={formUserId}>
														{getUserIdLabel(editingSeller.userId)}
													</SelectItem>
												)}
											{filteredUsers.length === 0 &&
												!(editingSeller && formUserId) && (
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
											step="0.001"
											inputMode="decimal"
											defaultValue={editingSeller?.balance || 0}
											min={0}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="status">Status</Label>
										<Select
											value={formIsDeactivated ? "inactive" : "active"}
											onValueChange={(value) =>
												setFormIsDeactivated(value === "inactive")
											}>
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
											value={formIsDeactivated ? "on" : "off"}
											readOnly
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
									<Label>Seller Onboarding Status</Label>
									<Select
										value={onboardingStatusSelectValue}
										onValueChange={setOnboardingStatusSelectValue}>
										<SelectTrigger>
											<SelectValue placeholder="None" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="__none__">None</SelectItem>
											{sellerOnboardingOptions.map(({ value, label }) => (
												<SelectItem key={value} value={value}>
													{label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label>Items Onboarding Status</Label>
									<Select
										value={itemsOnboardingStatusSelectValue}
										onValueChange={setItemsOnboardingStatusSelectValue}>
										<SelectTrigger>
											<SelectValue placeholder="None" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="__none__">None</SelectItem>
											{itemsOnboardingOptions.map(({ value, label }) => (
												<SelectItem key={value} value={value}>
													{label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
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
							{/* Create flow: render all steps, hide inactive so data is kept when switching steps */}
							<div className={formStep !== 1 ? "hidden" : undefined}>
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
							</div>
							<div className={formStep !== 2 ? "hidden" : undefined}>
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
									<div className="space-y-2">
										<Label htmlFor="avenue">Avenue</Label>
										<Input id="avenue" name="avenue" placeholder="Avenue" />
									</div>
								</div>
							</div>
							<div className={formStep !== 3 ? "hidden" : undefined}>
								<div className="space-y-2">
									<Label>Preferred pickup date</Label>
									<DatePicker
										value={formPreferredPickupDate}
										onChange={setFormPreferredPickupDate}
										placeholder="Select date"
									/>
								</div>
								<div className="space-y-2">
									<Label
										htmlFor="consentGivenStep3"
										className="text-sm font-medium">
										Consent Given
									</Label>
									<label
										htmlFor="consentGivenStep3"
										className="flex h-10 cursor-pointer items-center gap-3 rounded-md border border-input bg-background px-3 text-sm ring-offset-background has-[:focus]:ring-2 has-[:focus]:ring-ring has-[:focus]:ring-offset-2">
										<input
											type="checkbox"
											id="consentGivenStep3"
											name="consentGiven"
											className="h-4 w-4 rounded border border-input accent-primary"
										/>
										<span>Consent Given</span>
									</label>
								</div>
							</div>
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
								setFormStep(1);
								setSelectedItemIds([]);
								setFormError(null);
								setFormPreferredPickupDate(undefined);
								setFormPolicyAcceptedAt(undefined);
								setFormUserId("");
								setUserSearch("");
								setEscalationStatusSelectValue("__none__");
								setOnboardingStatusSelectValue("__none__");
								setItemsOnboardingStatusSelectValue("__none__");
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

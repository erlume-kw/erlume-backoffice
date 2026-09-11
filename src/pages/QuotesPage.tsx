import { useCallback, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, Column } from "@/components/common/DataTable";
import { FilterBar } from "@/components/common/FilterBar";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	ExternalLink,
	FileDown,
	FileSignature,
	Link2,
	Link2Off,
	MoreHorizontal,
	Pencil,
	Search,
	Trash2,
	UserX,
} from "lucide-react";
import type { Quote, QuoteItemRef, QuoteSellerRef } from "@/types/models";
import { restApi } from "@/lib/rest-client";
import { endpoints } from "@/lib/api-config";
import { getToken } from "@/lib/auth";
import { useResourceList } from "@/hooks/use-resource-list";
import { useToast } from "@/hooks/use-toast";
import { formatApiError } from "@/lib/error-utils";

/** seller_id / item_id come back populated from the list endpoint, but can be a
 *  bare id (or null) depending on how the quote was created. Narrow safely. */
function asSeller(v: Quote["seller_id"]): QuoteSellerRef | null {
	return v && typeof v === "object" ? (v as QuoteSellerRef) : null;
}
function asItem(v: Quote["item_id"]): QuoteItemRef | null {
	return v && typeof v === "object" ? (v as QuoteItemRef) : null;
}

const kwd = (n: number | undefined) =>
	typeof n === "number" ? n.toLocaleString(undefined, { minimumFractionDigits: 3 }) : "—";

interface ItemOption {
	_id: string;
	itemName?: string;
	brandName?: string;
	itemStatus?: string;
}

interface SellerOption {
	_id: string;
	fullName?: string;
	phoneNumber?: string;
	emailAddress?: string;
}

interface QuoteFilters {
	linked?: string;
	status?: string;
}

export default function QuotesPage() {
	const { toast } = useToast();

	const [search, setSearch] = useState("");
	// Default to the unlinked backlog — that is the job this page exists for.
	const [filters, setFilters] = useState<QuoteFilters>({ linked: "unlinked" });

	// Fetch everything once and filter client-side: the list is small, and it
	// keeps the filter dropdowns instant instead of round-tripping per change.
	const loadQuotes = useCallback(() => restApi.quotes.getAll(), []);
	const { data: quotes, loading, error, reload } = useResourceList<Quote>(loadQuotes);

	// `linkTarget` is deliberately NOT cleared on close — the dialog animates out
	// over ~150ms, and nulling it immediately makes the header flash its empty
	// fallback. Keeping the last value renders a stable dialog while it fades.
	const [linkTarget, setLinkTarget] = useState<Quote | null>(null);
	const [linkOpen, setLinkOpen] = useState(false);
	const [itemQuery, setItemQuery] = useState("");
	const [itemResults, setItemResults] = useState<ItemOption[]>([]);
	const [itemSearching, setItemSearching] = useState(false);
	const [linking, setLinking] = useState(false);

	// Edit (re-assign seller) dialog. Sellers are few, so load once and filter
	// client-side rather than round-tripping a search per keystroke.
	const [editTarget, setEditTarget] = useState<Quote | null>(null);
	const [editOpen, setEditOpen] = useState(false);
	const [sellers, setSellers] = useState<SellerOption[]>([]);
	const [sellerQuery, setSellerQuery] = useState("");
	const [savingSeller, setSavingSeller] = useState(false);

	const handleFilterChange = (key: string, value: string | undefined) => {
		setFilters((prev) => ({ ...prev, [key]: value }));
	};

	const filtered = useMemo(() => {
		const list = Array.isArray(quotes) ? quotes : [];
		const term = search.trim().toLowerCase();
		return list.filter((q) => {
			if (filters.linked === "unlinked" && q.item_id != null) return false;
			if (filters.linked === "linked" && q.item_id == null) return false;
			if (filters.status && q.status !== filters.status) return false;
			if (!term) return true;
			const seller = asSeller(q.seller_id);
			return Boolean(
				q.estimateNumber?.toLowerCase().includes(term) ||
					q.bagName?.toLowerCase().includes(term) ||
					q.brand?.toLowerCase().includes(term) ||
					q.model?.toLowerCase().includes(term) ||
					seller?.fullName?.toLowerCase().includes(term) ||
					q.contact?.name?.toLowerCase().includes(term),
			);
		});
	}, [quotes, search, filters]);

	const searchItems = useCallback(
		async (term: string) => {
			setItemQuery(term);
			if (term.trim().length < 2) {
				setItemResults([]);
				return;
			}
			setItemSearching(true);
			try {
				const res = await restApi.items.getAll({ search: term.trim(), limit: 15 });
				const list = Array.isArray(res) ? res : ((res as { data?: ItemOption[] })?.data ?? []);
				setItemResults(list as ItemOption[]);
			} catch (err) {
				toast({
					title: "Item search failed",
					description: formatApiError(err),
					variant: "destructive",
				});
				setItemResults([]);
			} finally {
				setItemSearching(false);
			}
		},
		[toast],
	);

	const openLinkDialog = (quote: Quote) => {
		setLinkTarget(quote);
		setLinkOpen(true);
		setItemQuery("");
		setItemResults([]);
	};

	const doLink = async (item: ItemOption, force = false) => {
		if (!linkTarget) return;
		setLinking(true);
		try {
			await restApi.quotes.link(linkTarget.estimateNumber, item._id, force);
			toast({
				title: "Quote linked",
				description: `${linkTarget.estimateNumber} → ${item.brandName ?? ""} ${item.itemName ?? ""}`.trim(),
			});
			setLinkOpen(false);
			await reload();
		} catch (err) {
			// The backend returns 409 ALREADY_LINKED rather than silently moving a
			// quote that is attached elsewhere. Surface it and let staff confirm.
			const msg = formatApiError(err) ?? "";
			// Two overridable 409s: the quote is already on another item, or the
			// quote's seller is not the item's seller (payout would go to the
			// wrong person). Both are warnings staff can consciously override.
			const overridable = /already linked/i.test(msg) || /belongs to/i.test(msg);
			if (!force && overridable) {
				if (window.confirm(`${msg}\n\nLink them anyway?`)) {
					setLinking(false);
					await doLink(item, true);
					return;
				}
			} else {
				toast({ title: "Link failed", description: msg, variant: "destructive" });
			}
		} finally {
			setLinking(false);
		}
	};

	const doUnlink = async (quote: Quote) => {
		const item = asItem(quote.item_id);
		const label = item ? `${item.brandName ?? ""} ${item.itemName ?? ""}`.trim() : "its item";
		if (!window.confirm(`Unlink ${quote.estimateNumber} from ${label}?`)) return;
		try {
			await restApi.quotes.unlink(quote.estimateNumber);
			toast({ title: "Quote unlinked", description: quote.estimateNumber });
			await reload();
		} catch (err) {
			toast({
				title: "Unlink failed",
				description: formatApiError(err),
				variant: "destructive",
			});
		}
	};

	const openEditDialog = async (quote: Quote) => {
		setEditTarget(quote);
		setEditOpen(true);
		setSellerQuery("");
		if (sellers.length === 0) {
			try {
				const res = await restApi.sellers.getAll();
				const list = Array.isArray(res) ? res : ((res as { data?: SellerOption[] })?.data ?? []);
				setSellers(list as SellerOption[]);
			} catch (err) {
				toast({ title: "Could not load sellers", description: formatApiError(err), variant: "destructive" });
			}
		}
	};

	const assignSeller = async (sellerId: string | null, label: string) => {
		if (!editTarget) return;
		setSavingSeller(true);
		try {
			await restApi.quotes.update(editTarget.estimateNumber, { sellerId });
			toast({ title: "Seller updated", description: editTarget.estimateNumber + " → " + label });
			setEditOpen(false);
			await reload();
		} catch (err) {
			toast({ title: "Update failed", description: formatApiError(err), variant: "destructive" });
		} finally {
			setSavingSeller(false);
		}
	};

	const doDelete = async (quote: Quote, force = false) => {
		if (!force) {
			// Spell out that Zoho is untouched — staff will assume otherwise.
			const warning =
				"Delete quote " + quote.estimateNumber + "?\n\n" +
				"This removes the backend record only — the estimate still exists in Zoho " +
				"and would need voiding there separately. This cannot be undone.";
			if (!window.confirm(warning)) return;
		}
		try {
			await restApi.quotes.delete(quote.estimateNumber, force);
			toast({ title: "Quote deleted", description: quote.estimateNumber });
			await reload();
		} catch (err) {
			const msg = formatApiError(err) ?? "";
			// Deleting a linked quote would strip an item's history silently.
			if (!force && /still linked/i.test(msg)) {
				if (window.confirm(msg + "\n\nDelete it anyway?")) {
					await doDelete(quote, true);
					return;
				}
			} else {
				toast({ title: "Delete failed", description: msg, variant: "destructive" });
			}
		}
	};

	const filteredSellers = useMemo(() => {
		const term = sellerQuery.trim().toLowerCase();
		const list = Array.isArray(sellers) ? sellers : [];
		if (!term) return list.slice(0, 20);
		return list
			.filter(
				(x) =>
					x.fullName?.toLowerCase().includes(term) ||
					x.phoneNumber?.toLowerCase().includes(term) ||
					x.emailAddress?.toLowerCase().includes(term),
			)
			.slice(0, 20);
	}, [sellers, sellerQuery]);

	// The PDF comes from an admin-only endpoint, so a plain <a href> will not
	// work — it cannot carry the Bearer token. Fetch it, then hand the browser
	// a blob with the right filename. (The endpoint also falls back to Zoho
	// when a quote has no stored backup, so this is offered on every row.)
	const downloadPdf = async (quote: Quote) => {
		try {
			const res = await fetch(`${endpoints.quotes}/${quote.estimateNumber}/pdf`, {
				headers: { Authorization: `Bearer ${getToken() ?? ""}` },
			});
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				throw new Error((body as { error?: string }).error ?? `Download failed (${res.status})`);
			}
			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${quote.estimateNumber}.pdf`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
		} catch (err) {
			toast({ title: "Download failed", description: formatApiError(err) ?? (err as Error).message, variant: "destructive" });
		}
	};

	const columns: Column<Quote>[] = [
		{
			key: "estimateNumber",
			header: "Quote",
			render: (q) => (
				<div className="flex items-center gap-3">
					<div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
						<FileSignature className="h-5 w-5 text-muted-foreground" />
					</div>
					<div>
						<p className="font-medium text-foreground">{q.estimateNumber}</p>
						<p className="text-sm text-muted-foreground">
							{q.bagName || [q.brand, q.model].filter(Boolean).join(" ") || "—"}
						</p>
						<p className="text-xs text-muted-foreground/50 font-mono">…{q._id.slice(-8)}</p>
					</div>
				</div>
			),
		},
		{
			key: "listingPrice",
			header: "Pricing",
			render: (q) => (
				<div>
					<p className="font-medium text-foreground">KD {kwd(q.listingPrice)}</p>
					<p className="text-sm text-muted-foreground">Payout {kwd(q.sellerPayout)}</p>
				</div>
			),
		},
		{
			key: "status",
			header: "Status",
			render: (q) => <StatusBadge status={q.status} />,
		},
		{
			key: "seller_id",
			header: "Seller",
			render: (q) => {
				const seller = asSeller(q.seller_id);
				if (seller) {
					return (
						<div>
							<p className="text-foreground">{seller.fullName || "—"}</p>
							{seller.phoneNumber && (
								<p className="text-xs text-muted-foreground">{seller.phoneNumber}</p>
							)}
						</div>
					);
				}
				// No seller record: a walk-in quoted before onboarding.
				return (
					<div>
						<span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide">
							Walk-in
						</span>
						<p className="text-xs text-muted-foreground mt-1">{q.contact?.name ?? "—"}</p>
					</div>
				);
			},
		},
		{
			key: "item_id",
			header: "Linked Item",
			render: (q) => {
				const item = asItem(q.item_id);
				if (!item) return <span className="text-muted-foreground">—</span>;
				return (
					<div>
						<p className="text-foreground">{item.itemName ?? item._id}</p>
						{item.brandName && (
							<p className="text-xs text-muted-foreground">{item.brandName}</p>
						)}
					</div>
				);
			},
		},
		{
			key: "createdAt",
			header: "Created",
			render: (q) => new Date(q.createdAt).toLocaleDateString(),
		},
		{
			key: "actions",
			header: "Actions",
			className: "w-12",
			render: (q) => (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon" className="h-8 w-8">
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						{q.item_id == null ? (
							<DropdownMenuItem onClick={() => openLinkDialog(q)}>
								<Link2 className="h-4 w-4 mr-2" />
								Link to item
							</DropdownMenuItem>
						) : (
							<DropdownMenuItem onClick={() => void doUnlink(q)}>
								<Link2Off className="h-4 w-4 mr-2" />
								Unlink
							</DropdownMenuItem>
						)}
						<DropdownMenuItem onClick={() => void downloadPdf(q)}>
							<FileDown className="h-4 w-4 mr-2" />
							Download PDF
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => void openEditDialog(q)}>
							<Pencil className="h-4 w-4 mr-2" />
							Edit seller
						</DropdownMenuItem>
						{q.estimateUrl && (
							<DropdownMenuItem asChild>
								<a href={q.estimateUrl} target="_blank" rel="noreferrer">
									<ExternalLink className="h-4 w-4 mr-2" />
									Open in Zoho
								</a>
							</DropdownMenuItem>
						)}
						<DropdownMenuSeparator />
						<DropdownMenuItem
							className="text-destructive focus:text-destructive"
							onClick={() => void doDelete(q)}>
							<Trash2 className="h-4 w-4 mr-2" />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			),
		},
	];

	return (
		<AdminLayout>
			{/* No "Add" button on purpose: quotes are generated in the pricing tool
			    (separate app), never created by hand here. */}
			<PageHeader
				title="Quotes"
				description="Consignment quotes from the pricing tool"
				searchValue={search}
				onSearchChange={setSearch}
				searchPlaceholder="Search quotes..."
				onRefresh={() => void reload()}
				refreshing={loading}
			/>

			<div className="p-6 space-y-4">
				{(loading || error) && (
					<div className="text-sm text-muted-foreground">
						{loading ? "Loading quotes..." : ""}
						{error ? ` ${error}` : ""}
					</div>
				)}

				<FilterBar
					filters={[
						{
							key: "linked",
							label: "Linked",
							value: filters.linked,
							options: [
								{ value: "unlinked", label: "Not linked" },
								{ value: "linked", label: "Linked" },
							],
						},
						{
							key: "status",
							label: "Status",
							value: filters.status,
							options: [
								{ value: "pending", label: "Pending" },
								{ value: "accepted", label: "Accepted" },
								{ value: "declined", label: "Declined" },
								{ value: "expired", label: "Expired" },
							],
						},
					]}
					onFilterChange={handleFilterChange}
					onClearAll={() => setFilters({})}
				/>

				<DataTable
					data={filtered}
					columns={columns}
					keyExtractor={(q) => q._id}
					loading={loading}
					emptyMessage={
						filters.linked === "unlinked"
							? "No unlinked quotes — every quote is attached to an item."
							: "No quotes match these filters."
					}
				/>
			</div>

			<Dialog open={linkOpen} onOpenChange={setLinkOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<FileSignature className="h-4 w-4" />
							Link {linkTarget?.estimateNumber}
						</DialogTitle>
						<DialogDescription>
							{linkTarget?.bagName || "This quote"} · KD {kwd(linkTarget?.listingPrice)} listing ·
							payout {kwd(linkTarget?.sellerPayout)}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-3">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								autoFocus
								className="pl-10 bg-muted/50"
								placeholder="Search items by name or brand..."
								value={itemQuery}
								onChange={(e) => void searchItems(e.target.value)}
							/>
						</div>

						<div className="max-h-64 overflow-y-auto rounded-lg border">
							{itemSearching && <p className="p-3 text-sm text-muted-foreground">Searching...</p>}
							{!itemSearching && itemQuery.trim().length < 2 && (
								<p className="p-3 text-sm text-muted-foreground">
									Type at least 2 characters to search items.
								</p>
							)}
							{!itemSearching && itemQuery.trim().length >= 2 && itemResults.length === 0 && (
								<p className="p-3 text-sm text-muted-foreground">No matching items.</p>
							)}
							{itemResults.map((item) => (
								<button
									key={item._id}
									type="button"
									disabled={linking}
									onClick={() => void doLink(item)}
									className="flex w-full items-center justify-between border-b p-3 text-left last:border-b-0 hover:bg-muted/50 disabled:opacity-50">
									<span>
										<span className="font-medium text-foreground">{item.itemName ?? "—"}</span>
										<span className="block text-sm text-muted-foreground">
											{item.brandName ?? ""}
										</span>
									</span>
									{item.itemStatus && <StatusBadge status={item.itemStatus} />}
								</button>
							))}
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => setLinkOpen(false)}>
							Cancel
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
			<Dialog open={editOpen} onOpenChange={setEditOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Pencil className="h-4 w-4" />
							Edit seller — {editTarget?.estimateNumber}
						</DialogTitle>
						<DialogDescription>
							Currently{" "}
							{asSeller(editTarget?.seller_id)?.fullName ??
								(editTarget?.contact?.name ? `walk-in: ${editTarget.contact.name}` : "unassigned")}
							. This changes the backend record only — the Zoho estimate keeps the customer it
							was created with.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-3">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								autoFocus
								className="pl-10 bg-muted/50"
								placeholder="Search sellers by name, phone or email..."
								value={sellerQuery}
								onChange={(e) => setSellerQuery(e.target.value)}
							/>
						</div>

						<div className="max-h-64 overflow-y-auto rounded-lg border">
							{filteredSellers.length === 0 && (
								<p className="p-3 text-sm text-muted-foreground">No matching sellers.</p>
							)}
							{filteredSellers.map((sel) => (
								<button
									key={sel._id}
									type="button"
									disabled={savingSeller}
									onClick={() => void assignSeller(sel._id, sel.fullName ?? sel._id)}
									className="flex w-full flex-col items-start border-b p-3 text-left last:border-b-0 hover:bg-muted/50 disabled:opacity-50">
									<span className="font-medium text-foreground">{sel.fullName ?? "(no name)"}</span>
									<span className="text-sm text-muted-foreground">
										{[sel.phoneNumber, sel.emailAddress].filter(Boolean).join(" · ") || "—"}
									</span>
								</button>
							))}
						</div>

						{/* Clearing the seller is a real state, not an error: a walk-in
						    quoted before they were onboarded. */}
						<Button
							variant="outline"
							className="w-full"
							disabled={savingSeller}
							onClick={() => void assignSeller(null, "walk-in (no seller)")}>
							<UserX className="h-4 w-4 mr-2" />
							Clear seller (mark as walk-in)
						</Button>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => setEditOpen(false)}>
							Cancel
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</AdminLayout>
	);
}

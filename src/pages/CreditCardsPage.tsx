import { useCallback, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, Column } from "@/components/common/DataTable";
import { DetailPanel } from "@/components/common/DetailPanel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CreditCard } from "@/types/models";
import { CreditCard as CardIcon } from "lucide-react";
import { restApi } from "@/lib/rest-client";
import { useResourceList } from "@/hooks/use-resource-list";

export default function CreditCardsPage() {
	const [search, setSearch] = useState("");
	const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null);
	const [showForm, setShowForm] = useState(false);
	const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [bulkLoading, setBulkLoading] = useState(false);
	const loadCards = useCallback(() => restApi.creditcards.getAll(), []);
	const { data: cards, loading, error, reload } = useResourceList(loadCards);

	const maskCard = (cardNumber: string) => {
		if (!cardNumber) {
			return "—";
		}
		const last4 = cardNumber.slice(-4);
		return `•••• •••• •••• ${last4}`;
	};

	const filteredCards = useMemo(() => {
		const list = Array.isArray(cards) ? cards : [];
		const query = search.toLowerCase();
		return list.filter((card) => {
			return (
				search === "" ||
				(card.holderName ?? "").toLowerCase().includes(query) ||
				(card.cardNumber ?? "").toLowerCase().includes(query)
			);
		});
	}, [cards, search]);

	const allFilteredIds = filteredCards.map((c) => c._id);
	const allSelected =
		allFilteredIds.length > 0 &&
		allFilteredIds.every((id) => selectedIds.includes(id));

	const columns: Column<CreditCard>[] = [
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
			render: (card) => (
				<Checkbox
					checked={selectedIds.includes(card._id)}
					onCheckedChange={(v) => {
						setSelectedIds((prev) =>
							v ? [...prev, card._id] : prev.filter((id) => id !== card._id),
						);
					}}
				/>
			),
		},
		{
			key: "cardNumber",
			header: "Card",
			render: (card) => (
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
						<CardIcon className="h-5 w-5 text-primary" />
					</div>
					<div>
						<p className="font-medium text-foreground">
							{maskCard(card.cardNumber)}
						</p>
						<p className="text-sm text-muted-foreground">{card.holderName}</p>
					</div>
				</div>
			),
		},
		{
			key: "expiryDate",
			header: "Expiry",
			render: (card) => (
				<span className="text-muted-foreground">{card.expiryDate}</span>
			),
		},
	];

	const handleBulkDelete = async () => {
		if (!selectedIds.length) return;
		setBulkLoading(true);
		try {
			await Promise.all(selectedIds.map((id) => restApi.creditcards.delete(id)));
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
			await restApi.creditcards.delete(id);
			await reload();
		} catch (err) {
			console.error("Failed to delete credit card", err);
		}
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		const payload = {
			cardNumber: String(formData.get("cardNumber") || ""),
			expiryDate: String(formData.get("expiryDate") || ""),
			holderName: String(formData.get("holderName") || ""),
		};

		try {
			if (editingCard) {
				await restApi.creditcards.update(editingCard._id, payload);
			} else {
				await restApi.creditcards.create(payload);
			}
			await reload();
			setShowForm(false);
			setEditingCard(null);
		} catch (err) {
			console.error("Failed to save credit card", err);
		}
	};

	return (
		<AdminLayout>
			<PageHeader
				title="Credit Cards"
				description="Manage saved payment methods"
				searchValue={search}
				onSearchChange={setSearch}
				searchPlaceholder="Search cards..."
				onAdd={() => {
					setEditingCard(null);
					setShowForm(true);
				}}
				addLabel="Create Credit Card"
			/>

			<div className="p-6 space-y-4">
				{(loading || error) && (
					<div className="text-sm text-muted-foreground">
						{loading ? "Loading credit cards..." : ""}
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
					data={filteredCards}
					columns={columns}
					keyExtractor={(card) => card._id}
					onView={(card) => setSelectedCard(card)}
					onEdit={(card) => {
						setEditingCard(card);
						setShowForm(true);
					}}
					onDelete={(card) => void handleDelete(card._id)}
				/>
			</div>

			<DetailPanel
				open={!!selectedCard}
				onClose={() => setSelectedCard(null)}
				title="Credit Card Details"
				description={selectedCard?.holderName}>
				{selectedCard && (
					<div className="space-y-4">
						<div className="flex justify-between">
							<span className="text-muted-foreground">Card Number</span>
							<span className="font-mono text-sm">
								{selectedCard.cardNumber}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted-foreground">Expiry</span>
							<span className="font-mono text-sm">
								{selectedCard.expiryDate}
							</span>
						</div>
						<Button
							variant="outline"
							className="w-full"
							onClick={() => {
								setEditingCard(selectedCard);
								setShowForm(true);
								setSelectedCard(null);
							}}>
							Edit Card
						</Button>
					</div>
				)}
			</DetailPanel>

			<DetailPanel
				open={showForm}
				onClose={() => {
					setShowForm(false);
					setEditingCard(null);
				}}
				title={editingCard ? "Edit Credit Card" : "Create Credit Card"}
				type="dialog"
				size="md">
				<form className="space-y-4" onSubmit={handleSubmit}>
					<div className="space-y-2">
						<Label htmlFor="cardNumber">Card Number</Label>
						<Input
							id="cardNumber"
							name="cardNumber"
							defaultValue={editingCard?.cardNumber}
							placeholder="4111111111111111"
						/>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="expiryDate">Expiry date</Label>
							<Input
								id="expiryDate"
								name="expiryDate"
								type="month"
								className="h-10"
								defaultValue={
									editingCard?.expiryDate?.match(/^\d{4}-\d{2}$/)
										? editingCard.expiryDate
										: editingCard?.expiryDate?.match(/^\d{1,2}\/\d{2}$/)
											? (() => {
													const [mm, yy] = editingCard.expiryDate.split("/");
													return `20${yy.padStart(2, "0")}-${mm.padStart(2, "0")}`;
												})()
											: ""
								}
								placeholder="Select month"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="holderName">Holder Name</Label>
							<Input
								id="holderName"
								name="holderName"
								defaultValue={editingCard?.holderName}
								placeholder="John Doe"
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
								setEditingCard(null);
							}}>
							Cancel
						</Button>
						<Button type="submit" className="flex-1">
							{editingCard ? "Save Changes" : "Create Card"}
						</Button>
					</div>
				</form>
			</DetailPanel>
		</AdminLayout>
	);
}

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
import type { Review } from "@/types/models";
import { Star, MessageSquare, User } from "lucide-react";
import { restApi } from "@/lib/rest-client";
import { getEnumOptions, getEnumValues } from "@/lib/enums";
import { useResourceList } from "@/hooks/use-resource-list";

export default function ReviewsPage() {
	const [search, setSearch] = useState("");
	const [selectedReview, setSelectedReview] = useState<Review | null>(null);
	const [showForm, setShowForm] = useState(false);
	const [editingReview, setEditingReview] = useState<Review | null>(null);
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [bulkLoading, setBulkLoading] = useState(false);
	const loadReviews = useCallback(() => restApi.reviews.getAll(), []);
	const loadReviewStars = useCallback(
		() => restApi.enums.getByCategory("reviewStars"),
		[],
	);
	const {
		data: reviews,
		loading,
		error,
		reload,
	} = useResourceList(loadReviews);
	const { data: reviewStars } = useResourceList(loadReviewStars);
	const reviewStarValues = getEnumValues("reviewStars", reviewStars);
	const reviewStarOptions = getEnumOptions("reviewStars", reviewStarValues);

	const renderStars = (rating: number) => {
		return (
			<div className="flex items-center gap-0.5">
				{[1, 2, 3, 4, 5].map((star) => (
					<Star
						key={star}
						className={`h-4 w-4 ${star <= rating ? "text-warning fill-warning" : "text-muted-foreground"}`}
					/>
				))}
			</div>
		);
	};

	const safeReviews = Array.isArray(reviews) ? reviews : [];
	const filteredReviews = useMemo(() => {
		if (!search.trim()) return safeReviews;
		const q = search.toLowerCase();
		return safeReviews.filter((review) =>
			(review.description ?? "").toLowerCase().includes(q),
		);
	}, [safeReviews, search]);

	const allFilteredIds = filteredReviews.map((r) => r._id);
	const allSelected =
		allFilteredIds.length > 0 &&
		allFilteredIds.every((id) => selectedIds.includes(id));

	const columns: Column<Review>[] = [
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
			render: (review) => (
				<Checkbox
					checked={selectedIds.includes(review._id)}
					onCheckedChange={(v) => {
						setSelectedIds((prev) =>
							v ? [...prev, review._id] : prev.filter((id) => id !== review._id),
						);
					}}
				/>
			),
		},
		{
			key: "rating",
			header: "Rating",
			render: (review) => renderStars(review.rating),
		},
		{
			key: "content",
			header: "Review",
			render: (review) => (
				<div className="max-w-[300px]">
					<p className="text-sm text-muted-foreground truncate">
						{review.description}
					</p>
				</div>
			),
		},
		{
			key: "type",
			header: "Type",
			render: (review) => (
				<span className="text-sm text-muted-foreground">
					{review.sellerId ? "Seller" : "User"}
				</span>
			),
		},
	];

	const handleBulkDelete = async () => {
		if (!selectedIds.length) return;
		setBulkLoading(true);
		try {
			await Promise.all(selectedIds.map((id) => restApi.reviews.delete(id)));
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
			await restApi.reviews.delete(id);
			await reload();
		} catch (err) {
			console.error("Failed to delete review", err);
		}
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!editingReview) {
			return;
		}
		const formData = new FormData(event.currentTarget);
		const payload = {
			userId: String(formData.get("userId") || ""),
			sellerId: String(formData.get("sellerId") || ""),
			rating: Number(formData.get("rating") || 0),
			description: String(formData.get("description") || ""),
		};

		try {
			await restApi.reviews.update(editingReview._id, payload);
			await reload();
			setShowForm(false);
			setEditingReview(null);
		} catch (err) {
			console.error("Failed to update review", err);
		}
	};

	return (
		<AdminLayout>
			<PageHeader
				title="Reviews"
				description="Moderate and manage customer reviews"
				searchValue={search}
				onSearchChange={setSearch}
				searchPlaceholder="Search reviews..."
			/>

			<div className="p-6 space-y-4">
				{(loading || error) && (
					<div className="text-sm text-muted-foreground">
						{loading ? "Loading reviews..." : ""}
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
					data={filteredReviews}
					columns={columns}
					keyExtractor={(review) => review._id}
					onView={(review) => setSelectedReview(review)}
					onEdit={(review) => {
						setEditingReview(review);
						setShowForm(true);
					}}
					onDelete={(review) => {
						void handleDelete(review._id);
					}}
				/>
			</div>

			{/* View Review Panel */}
			<DetailPanel
				open={!!selectedReview}
				onClose={() => setSelectedReview(null)}
				title="Review Details">
				{selectedReview && (
					<div className="space-y-6">
						<div className="flex items-center justify-between">
							{renderStars(selectedReview.rating)}
						</div>
						<p className="text-muted-foreground">
							{selectedReview.description}
						</p>
						<div className="p-4 bg-muted/30 rounded-lg space-y-2">
							<div className="flex items-center gap-2 text-sm">
								<User className="h-4 w-4 text-muted-foreground" />
								<span className="text-muted-foreground">User ID:</span>
								<span className="font-mono">{selectedReview.userId}</span>
							</div>
							<div className="flex items-center gap-2 text-sm">
								<MessageSquare className="h-4 w-4 text-muted-foreground" />
								<span className="text-muted-foreground">Seller ID:</span>
								<span className="font-mono">{selectedReview.sellerId}</span>
							</div>
						</div>
					</div>
				)}
			</DetailPanel>

			{/* Edit Review Form */}
			<DetailPanel
				open={showForm}
				onClose={() => {
					setShowForm(false);
					setEditingReview(null);
				}}
				title="Edit Review"
				type="dialog"
				size="md">
				<form className="space-y-4" onSubmit={handleSubmit}>
					<div className="space-y-2">
						<Label htmlFor="userId">User ID</Label>
						<Input
							id="userId"
							name="userId"
							defaultValue={editingReview?.userId}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="sellerId">Seller ID</Label>
						<Input
							id="sellerId"
							name="sellerId"
							defaultValue={editingReview?.sellerId}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="rating">Rating</Label>
						<Select
							defaultValue={String(editingReview?.rating ?? "")}
							onValueChange={(value) => {
								const field = document.querySelector<HTMLInputElement>(
									'input[name="rating"]',
								);
								if (field) {
									field.value = value;
								}
							}}>
							<SelectTrigger>
								<SelectValue placeholder="Select rating" />
							</SelectTrigger>
							<SelectContent>
								{reviewStarOptions.map(({ value, label }) => (
									<SelectItem key={value} value={value}>
										{label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<input
							type="hidden"
							name="rating"
							defaultValue={String(
								editingReview?.rating ?? reviewStarValues[0] ?? "",
							)}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Input
							id="description"
							name="description"
							defaultValue={editingReview?.description}
						/>
					</div>
					<div className="flex gap-3 pt-4">
						<Button
							type="button"
							variant="outline"
							className="flex-1"
							onClick={() => {
								setShowForm(false);
								setEditingReview(null);
							}}>
							Cancel
						</Button>
						<Button type="submit" className="flex-1">
							Update
						</Button>
					</div>
				</form>
			</DetailPanel>
		</AdminLayout>
	);
}

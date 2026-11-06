import { useCallback, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, Column } from "@/components/common/DataTable";
import { FilterBar } from "@/components/common/FilterBar";
import { Camera, MessageCircle } from "lucide-react";
import type { EstimatorSubmission } from "@/types/models";
import { restApi } from "@/lib/rest-client";
import { useResourceList } from "@/hooks/use-resource-list";

const kwd = (n: number | undefined) =>
	typeof n === "number" ? n.toLocaleString(undefined, { minimumFractionDigits: 3 }) : "—";

const conditionLabel: Record<string, string> = {
	"like-new": "Like new",
	"gently-used": "Gently used",
	"fair-worn": "Fair / worn",
};

interface SubmissionFilters {
	accepted?: string;
	usedPhotoAI?: string;
	contacted?: string;
}

export default function EstimatorSubmissionsPage() {
	const [search, setSearch] = useState("");
	const [filters, setFilters] = useState<SubmissionFilters>({});

	// The list is small and read-only; fetch once and filter client-side so the
	// search box and dropdowns stay instant.
	const load = useCallback(() => restApi.estimatorSubmissions.getAll({ limit: 1000 }), []);
	const { data: subs, loading, error, reload } = useResourceList<EstimatorSubmission>(load);

	const handleFilterChange = (key: string, value: string | undefined) => {
		setFilters((prev) => ({ ...prev, [key]: value }));
	};

	const filtered = useMemo(() => {
		const list = Array.isArray(subs) ? subs : [];
		const term = search.trim().toLowerCase();
		return list.filter((s) => {
			if (filters.accepted === "accepted" && s.accept !== true) return false;
			if (filters.accepted === "declined" && s.accept !== false) return false;
			if (filters.usedPhotoAI === "yes" && !s.usedPhotoAI) return false;
			if (filters.usedPhotoAI === "no" && s.usedPhotoAI) return false;
			if (filters.contacted === "yes" && !s.contactedWhatsApp) return false;
			if (filters.contacted === "no" && s.contactedWhatsApp) return false;
			if (!term) return true;
			return Boolean(
				s.brand?.toLowerCase().includes(term) ||
					s.model?.toLowerCase().includes(term) ||
					s.color?.toLowerCase().includes(term) ||
					s.material?.toLowerCase().includes(term),
			);
		});
	}, [subs, search, filters]);

	// Headline counters — the "how many people used it" answer at a glance.
	const stats = useMemo(() => {
		const list = Array.isArray(subs) ? subs : [];
		const accepted = list.filter((s) => s.accept === true).length;
		const contacted = list.filter((s) => s.contactedWhatsApp).length;
		return { total: list.length, accepted, declined: list.length - accepted, contacted };
	}, [subs]);

	const columns: Column<EstimatorSubmission>[] = [
		{
			key: "brand",
			header: "Bag",
			render: (s) => (
				<div>
					<p className="font-medium text-foreground">
						{[s.brand, s.model].filter(Boolean).join(" ") || "—"}
					</p>
					<p className="text-sm text-muted-foreground">
						{[s.size, s.color, s.material].filter(Boolean).join(" · ") || "—"}
					</p>
				</div>
			),
		},
		{
			key: "originalPrice",
			header: "Seller input",
			render: (s) => (
				<div>
					<p className="text-foreground">
						{s.originalPrice != null ? `KD ${kwd(s.originalPrice)} retail` : "—"}
					</p>
					<p className="text-sm text-muted-foreground">
						{[s.condition ? conditionLabel[s.condition] ?? s.condition : null, s.yearPurchased]
							.filter(Boolean)
							.join(" · ") || "—"}
					</p>
				</div>
			),
		},
		{
			key: "listingPrice",
			header: "Estimate",
			render: (s) => (
				<div>
					<p className="font-medium text-foreground">KD {kwd(s.listingPrice)}</p>
					<p className="text-sm text-muted-foreground">Payout {kwd(s.sellerPayout)}</p>
				</div>
			),
		},
		{
			key: "accept",
			header: "Result",
			render: (s) =>
				s.accept === false ? (
					<span className="rounded bg-muted px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
						Below min
					</span>
				) : (
					<span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-emerald-700">
						Might qualify
					</span>
				),
		},
		{
			key: "meta",
			header: "Via",
			render: (s) => (
				<div className="flex items-center gap-2">
					{s.locale && (
						<span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase">
							{s.locale}
						</span>
					)}
					{s.usedPhotoAI && (
						<span
							className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"
							title="Used the AI photo auto-fill">
							<Camera className="h-3 w-3" /> AI
						</span>
					)}
					{s.contactedWhatsApp && (
						<span
							className="inline-flex items-center gap-1 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700"
							title="Clicked through to WhatsApp after the estimate">
							<MessageCircle className="h-3 w-3" /> Messaged
						</span>
					)}
				</div>
			),
		},
		{
			key: "createdAt",
			header: "When",
			render: (s) => new Date(s.createdAt).toLocaleString(),
		},
	];

	return (
		<AdminLayout>
			<PageHeader
				title="Estimator Submissions"
				description="Bags visitors self-priced on the website estimator"
				searchValue={search}
				onSearchChange={setSearch}
				searchPlaceholder="Search by brand, model, colour..."
				onRefresh={() => void reload()}
				refreshing={loading}
			/>

			<div className="p-6 space-y-4">
				<div className="flex flex-wrap gap-4">
					<div className="rounded-lg border bg-card px-4 py-3">
						<p className="text-2xl font-semibold text-foreground">{stats.total}</p>
						<p className="text-xs text-muted-foreground uppercase tracking-wide">Total uses</p>
					</div>
					<div className="rounded-lg border bg-card px-4 py-3">
						<p className="text-2xl font-semibold text-emerald-600">{stats.accepted}</p>
						<p className="text-xs text-muted-foreground uppercase tracking-wide">Might qualify</p>
					</div>
					<div className="rounded-lg border bg-card px-4 py-3">
						<p className="text-2xl font-semibold text-muted-foreground">{stats.declined}</p>
						<p className="text-xs text-muted-foreground uppercase tracking-wide">Below min</p>
					</div>
					<div className="rounded-lg border bg-card px-4 py-3">
						<p className="text-2xl font-semibold text-green-600">{stats.contacted}</p>
						<p className="text-xs text-muted-foreground uppercase tracking-wide">Messaged on WhatsApp</p>
					</div>
				</div>

				{(loading || error) && (
					<div className="text-sm text-muted-foreground">
						{loading ? "Loading submissions..." : ""}
						{error ? ` ${error}` : ""}
					</div>
				)}

				<FilterBar
					filters={[
						{
							key: "accepted",
							label: "Result",
							value: filters.accepted,
							options: [
								{ value: "accepted", label: "Might qualify" },
								{ value: "declined", label: "Below min" },
							],
						},
						{
							key: "usedPhotoAI",
							label: "Photo AI",
							value: filters.usedPhotoAI,
							options: [
								{ value: "yes", label: "Used AI" },
								{ value: "no", label: "Manual" },
							],
						},
						{
							key: "contacted",
							label: "WhatsApp",
							value: filters.contacted,
							options: [
								{ value: "yes", label: "Messaged" },
								{ value: "no", label: "No message" },
							],
						},
					]}
					onFilterChange={handleFilterChange}
					onClearAll={() => setFilters({})}
				/>

				<DataTable
					data={filtered}
					columns={columns}
					keyExtractor={(s) => s._id}
					loading={loading}
					emptyMessage="No estimator submissions yet."
				/>
			</div>
		</AdminLayout>
	);
}

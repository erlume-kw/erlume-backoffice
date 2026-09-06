import { useCallback, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, Column } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Mail } from "lucide-react";
import type { NewsletterSubscriber } from "@/types/models";
import { restApi } from "@/lib/rest-client";
import { useResourceList } from "@/hooks/use-resource-list";

export default function NewsletterPage() {
	const [search, setSearch] = useState("");
	const [includeInactive, setIncludeInactive] = useState(false);

	const loadSubscribers = useCallback(
		() => restApi.newsletter.getAll(includeInactive),
		[includeInactive],
	);
	const { data: subscribers, loading, error, reload } = useResourceList(loadSubscribers);

	const handleDelete = async (id: string) => {
		try {
			await restApi.newsletter.delete(id);
			await reload();
		} catch (err) {
			console.error("Failed to delete subscriber", err);
		}
	};

	const filtered = useMemo(() => {
		const list = Array.isArray(subscribers) ? subscribers : [];
		return list.filter(
			(s) =>
				search === "" ||
				s.email.toLowerCase().includes(search.toLowerCase()),
		);
	}, [subscribers, search]);

	const handleExport = () => {
		const list = Array.isArray(subscribers) ? subscribers : [];
		const active = includeInactive ? list : list.filter((s) => s.isActive);
		const csv = [
			"email,subscribedAt,isActive",
			...active.map(
				(s) =>
					`${s.email},${new Date(s.subscribedAt).toLocaleDateString()},${s.isActive}`,
			),
		].join("\n");
		const blob = new Blob([csv], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const columns: Column<NewsletterSubscriber>[] = [
		{
			key: "email",
			header: "Email",
			render: (s) => (
				<div className="flex items-center gap-2">
					<div className="p-2 rounded-lg bg-primary/10">
						<Mail className="h-4 w-4 text-primary" />
					</div>
					<span className="font-medium text-foreground">{s.email}</span>
				</div>
			),
		},
		{
			key: "subscribedAt",
			header: "Subscribed",
			render: (s) => (
				<span className="text-muted-foreground text-sm">
					{new Date(s.subscribedAt).toLocaleDateString()}
				</span>
			),
		},
		{
			key: "isActive",
			header: "Status",
			render: (s) => (
				<span
					className={`text-sm font-medium ${
						s.isDeleted
							? "text-destructive"
							: s.isActive
								? "text-success"
								: "text-muted-foreground"
					}`}>
					{s.isDeleted ? "Deleted" : s.isActive ? "Subscribed" : "Unsubscribed"}
				</span>
			),
		},
	];

	return (
		<AdminLayout>
			<PageHeader
				title="Newsletter"
				description="Manage email subscribers"
				searchValue={search}
				onSearchChange={setSearch}
				searchPlaceholder="Search emails..."
				onRefresh={reload}
				refreshing={loading}
			/>

			<div className="p-6">
				{/* Toolbar */}
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-2">
						<Switch
							id="includeInactive"
							checked={includeInactive}
							onCheckedChange={(v) => {
								setIncludeInactive(v);
								// reload is triggered by the useCallback dependency changing
								void reload();
							}}
						/>
						<Label htmlFor="includeInactive" className="text-sm cursor-pointer">
							Show unsubscribed
						</Label>
					</div>
					<div className="flex items-center gap-2">
						<span className="text-sm text-muted-foreground">
							{filtered.length} subscriber{filtered.length !== 1 ? "s" : ""}
						</span>
						<Button variant="outline" size="sm" onClick={handleExport}>
							Export CSV
						</Button>
					</div>
				</div>

				{(loading || error) && (
					<div className="text-sm text-muted-foreground mb-3">
						{loading ? "Loading subscribers..." : ""}
						{error ? ` ${error}` : ""}
					</div>
				)}

				<DataTable
					data={filtered}
					columns={columns}
					keyExtractor={(s) => s._id}
					onDelete={(s) => {
						void handleDelete(s._id);
					}}
				/>
			</div>
		</AdminLayout>
	);
}

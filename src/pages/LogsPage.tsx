import { useCallback, useMemo, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, Column } from "@/components/common/DataTable";
import { DetailPanel } from "@/components/common/DetailPanel";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { User as UserIcon, Clock, Database, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { restApi } from "@/lib/rest-client";
import { useResourceList } from "@/hooks/use-resource-list";
import type { AuditLog } from "@/types/models";

// Most-recent-first, capped batch — matches how every other list page in this
// backoffice works (fetch once, filter/search client-side). A "load more" /
// true server pagination is a natural follow-up once log volume warrants it.
const FETCH_LIMIT = 300;

const ACTION_STYLES: Record<string, string> = {
	create: "bg-success/20 text-success",
	update: "bg-primary/10 text-primary",
	delete: "bg-destructive/20 text-destructive",
};

function ActionBadge({ action }: { action: string }) {
	return (
		<span className={cn("status-badge", ACTION_STYLES[action] ?? "bg-muted text-muted-foreground")}>
			{action}
		</span>
	);
}

function formatDateTime(iso: string): string {
	return new Date(iso).toLocaleString(undefined, {
		dateStyle: "medium",
		timeStyle: "short",
	});
}

function formatValue(value: unknown) {
	if (value === undefined || value === null || value === "") {
		return <span className="text-muted-foreground">—</span>;
	}
	if (typeof value === "boolean") return value ? "Yes" : "No";
	if (Array.isArray(value)) {
		if (value.length === 0) return <span className="text-muted-foreground">—</span>;
		if (value.every((v) => v === null || typeof v !== "object")) {
			return <span className="break-words">{value.join(", ")}</span>;
		}
		return (
			<pre className="max-w-[280px] whitespace-pre-wrap break-all text-xs text-foreground">
				{JSON.stringify(value, null, 2)}
			</pre>
		);
	}
	if (typeof value === "object") {
		return (
			<pre className="max-w-[280px] whitespace-pre-wrap break-all text-xs text-foreground">
				{JSON.stringify(value, null, 2)}
			</pre>
		);
	}
	return <span className="break-words">{String(value)}</span>;
}

/** Field/value table for a create or delete entry — the record's whole shape,
 *  since there's only one side (no "before" for create, no "after" for delete). */
function SnapshotTable({ record }: { record: Record<string, unknown> }) {
	const entries = Object.entries(record).filter(([key]) => key !== "_id" && key !== "createdAt" && key !== "updatedAt");
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className="w-40">Field</TableHead>
					<TableHead>Value</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{entries.map(([key, value]) => (
					<TableRow key={key}>
						<TableCell className="align-top font-medium">{key}</TableCell>
						<TableCell className="align-top">{formatValue(value)}</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

/** Field/before/after table for an update entry — only the fields that
 *  actually changed, which is the part an admin came here to see. */
function ChangedFieldsTable({ log }: { log: AuditLog }) {
	const fields = log.changedFields ?? [];
	if (fields.length === 0) {
		return <p className="text-sm text-muted-foreground">No field-level changes recorded.</p>;
	}
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className="w-32">Field</TableHead>
					<TableHead>Before</TableHead>
					<TableHead>After</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{fields.map((field) => (
					<TableRow key={field}>
						<TableCell className="align-top font-medium">{field}</TableCell>
						<TableCell className="align-top">{formatValue(log.before?.[field])}</TableCell>
						<TableCell className="align-top">{formatValue(log.after?.[field])}</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

export default function LogsPage() {
	const [search, setSearch] = useState("");
	const [modelFilter, setModelFilter] = useState<string>("all");
	const [actionFilter, setActionFilter] = useState<string>("all");
	const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

	const loadLogs = useCallback(() => restApi.auditLogs.getAll({ limit: FETCH_LIMIT }), []);
	const { data: logs, loading, error, reload } = useResourceList(loadLogs);

	const availableModels = useMemo(
		() => Array.from(new Set(logs.map((l) => l.modelName))).sort(),
		[logs],
	);

	const filteredLogs = useMemo(() => {
		const q = search.trim().toLowerCase();
		return logs.filter((log) => {
			if (modelFilter !== "all" && log.modelName !== modelFilter) return false;
			if (actionFilter !== "all" && log.action !== actionFilter) return false;
			if (!q) return true;
			return (
				(log.userEmail ?? "").toLowerCase().includes(q) ||
				(log.resourceLabel ?? "").toLowerCase().includes(q) ||
				log.modelName.toLowerCase().includes(q) ||
				log.resourceId.toLowerCase().includes(q)
			);
		});
	}, [logs, search, modelFilter, actionFilter]);

	const columns: Column<AuditLog>[] = [
		{
			key: "modelName",
			header: "Model",
			render: (log) => (
				<div>
					<p className="font-medium text-foreground">{log.modelName}</p>
					{log.resourceLabel && (
						<p className="text-sm text-muted-foreground truncate max-w-[220px]">{log.resourceLabel}</p>
					)}
				</div>
			),
		},
		{
			key: "action",
			header: "Action",
			render: (log) => <ActionBadge action={log.action} />,
		},
		{
			key: "userEmail",
			header: "Changed By",
			render: (log) => (
				<span className={log.userEmail ? "text-foreground" : "text-muted-foreground italic"}>
					{log.userEmail ?? "System"}
				</span>
			),
		},
		{
			key: "createdAt",
			header: "When",
			render: (log) => <span className="text-muted-foreground whitespace-nowrap">{formatDateTime(log.createdAt)}</span>,
		},
	];

	return (
		<AdminLayout>
			<PageHeader
				title="Logs"
				description="Audit trail of every change made across the backoffice"
				searchValue={search}
				onSearchChange={setSearch}
				searchPlaceholder="Search by person, model, or record..."
				onRefresh={reload}
				refreshing={loading}>
				<Select value={modelFilter} onValueChange={setModelFilter}>
					<SelectTrigger className="w-40 bg-muted/50">
						<SelectValue placeholder="All models" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All models</SelectItem>
						{availableModels.map((m) => (
							<SelectItem key={m} value={m}>
								{m}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select value={actionFilter} onValueChange={setActionFilter}>
					<SelectTrigger className="w-36 bg-muted/50">
						<SelectValue placeholder="All actions" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All actions</SelectItem>
						<SelectItem value="create">Create</SelectItem>
						<SelectItem value="update">Update</SelectItem>
						<SelectItem value="delete">Delete</SelectItem>
					</SelectContent>
				</Select>
			</PageHeader>

			<div className="p-6">
				{(loading || error) && (
					<div className="text-sm text-muted-foreground mb-3">
						{loading ? "Loading logs..." : ""}
						{error ? ` ${error}` : ""}
					</div>
				)}
				<DataTable
					data={filteredLogs}
					columns={columns}
					keyExtractor={(log) => log._id}
					onRowClick={(log) => setSelectedLog(log)}
					emptyMessage="No changes logged yet"
				/>
			</div>

			<DetailPanel
				open={!!selectedLog}
				onClose={() => setSelectedLog(null)}
				title={selectedLog ? `${selectedLog.modelName} ${selectedLog.action}d` : "Change details"}
				description={selectedLog?.resourceLabel ?? selectedLog?.resourceId}
				type="dialog"
				size="lg">
				{selectedLog && (
					<div className="space-y-6">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<ActionBadge action={selectedLog.action} />
								<span className="font-medium text-foreground">{selectedLog.modelName}</span>
							</div>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<UserIcon className="h-4 w-4 shrink-0" />
								<span className={selectedLog.userEmail ? "text-foreground" : "italic"}>
									{selectedLog.userEmail ?? "System"}
								</span>
							</div>
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<Clock className="h-4 w-4 shrink-0" />
								<span>{formatDateTime(selectedLog.createdAt)}</span>
							</div>
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<Hash className="h-4 w-4 shrink-0" />
								<span className="font-mono text-xs">{selectedLog.resourceId}</span>
							</div>
						</div>

						<div className="space-y-2">
							<div className="flex items-center gap-2 text-sm font-medium text-foreground">
								<Database className="h-4 w-4" />
								{selectedLog.action === "update"
									? "What changed"
									: selectedLog.action === "create"
										? "Created with"
										: "Final state before deletion"}
							</div>
							<div className="rounded-lg border border-border/60 overflow-x-auto">
								{selectedLog.action === "update" ? (
									<ChangedFieldsTable log={selectedLog} />
								) : (
									<SnapshotTable record={(selectedLog.action === "create" ? selectedLog.after : selectedLog.before) ?? {}} />
								)}
							</div>
						</div>

						{selectedLog.action === "update" && (selectedLog.before || selectedLog.after) && (
							<Accordion type="single" collapsible>
								<AccordionItem value="full-record">
									<AccordionTrigger className="text-sm text-muted-foreground">
										Show full record (before / after)
									</AccordionTrigger>
									<AccordionContent>
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
											<div>
												<p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Before</p>
												<pre className="text-xs whitespace-pre-wrap break-all bg-muted/30 rounded-lg p-3 max-h-80 overflow-y-auto">
													{JSON.stringify(selectedLog.before ?? {}, null, 2)}
												</pre>
											</div>
											<div>
												<p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">After</p>
												<pre className="text-xs whitespace-pre-wrap break-all bg-muted/30 rounded-lg p-3 max-h-80 overflow-y-auto">
													{JSON.stringify(selectedLog.after ?? {}, null, 2)}
												</pre>
											</div>
										</div>
									</AccordionContent>
								</AccordionItem>
							</Accordion>
						)}
					</div>
				)}
			</DetailPanel>
		</AdminLayout>
	);
}

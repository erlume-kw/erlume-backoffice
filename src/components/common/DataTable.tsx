import { ReactNode, isValidElement } from "react";
import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	MoreHorizontal,
	Eye,
	Edit,
	Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface Column<T> {
	key: keyof T | string;
	header: string | ReactNode;
	render?: (item: T) => ReactNode;
	sortable?: boolean;
	className?: string;
}

interface DataTableProps<T> {
	data: T[];
	columns: Column<T>[];
	keyExtractor: (item: T) => string;
	onView?: (item: T) => void;
	onEdit?: (item: T) => void;
	onDelete?: (item: T) => void;
	loading?: boolean;
	page?: number;
	totalPages?: number;
	onPageChange?: (page: number) => void;
	emptyMessage?: string;
}

export function DataTable<T>({
	data,
	columns,
	keyExtractor,
	onView,
	onEdit,
	onDelete,
	loading,
	page = 1,
	totalPages = 1,
	onPageChange,
	emptyMessage = "No data found",
}: DataTableProps<T>) {
	const hasActions = onView || onEdit || onDelete;

	const renderCell = (item: T, column: Column<T>) => {
		if (column.render) {
			const rendered = column.render(item);
			if (
				rendered &&
				typeof rendered === "object" &&
				!Array.isArray(rendered) &&
				!isValidElement(rendered)
			) {
				return JSON.stringify(rendered);
			}
			return rendered;
		}
		const value = (item as Record<string, unknown>)[column.key as string];
		return String(value ?? "—");
	};

	if (loading) {
		return (
			<div className="glass-card overflow-hidden">
				<div className="animate-pulse">
					<div className="h-12 bg-muted/30" />
					{[...Array(5)].map((_, i) => (
						<div
							key={i}
							className="h-16 border-t border-border/50 flex items-center px-4">
							<div className="h-4 bg-muted/50 rounded w-full" />
						</div>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="glass-card overflow-hidden animate-fade-in">
			<div className="overflow-x-auto">
				<table className="data-table">
					<thead>
						<tr>
							{columns.map((column) => (
								<th key={String(column.key)} className={column.className}>
									{column.header}
								</th>
							))}
							{hasActions && <th className="w-12">Actions</th>}
						</tr>
					</thead>
					<tbody>
						{data.length === 0 ? (
							<tr>
								<td
									colSpan={columns.length + (hasActions ? 1 : 0)}
									className="text-center py-12">
									<p className="text-muted-foreground">{emptyMessage}</p>
								</td>
							</tr>
						) : (
							data.map((item) => (
								<tr key={keyExtractor(item)}>
									{columns.map((column) => (
										<td key={String(column.key)} className={column.className}>
											{renderCell(item, column)}
										</td>
									))}
									{hasActions && (
										<td>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8">
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													{onView && (
														<DropdownMenuItem onClick={() => onView(item)}>
															<Eye className="h-4 w-4 mr-2" />
															View
														</DropdownMenuItem>
													)}
													{onEdit && (
														<DropdownMenuItem onClick={() => onEdit(item)}>
															<Edit className="h-4 w-4 mr-2" />
															Edit
														</DropdownMenuItem>
													)}
													{onDelete && (
														<DropdownMenuItem
															onClick={() => onDelete(item)}
															className="text-destructive">
															<Trash2 className="h-4 w-4 mr-2" />
															Delete
														</DropdownMenuItem>
													)}
												</DropdownMenuContent>
											</DropdownMenu>
										</td>
									)}
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{totalPages > 1 && (
				<div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
					<p className="text-sm text-muted-foreground">
						Page {page} of {totalPages}
					</p>
					<div className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8"
							onClick={() => onPageChange?.(1)}
							disabled={page === 1}>
							<ChevronsLeft className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8"
							onClick={() => onPageChange?.(page - 1)}
							disabled={page === 1}>
							<ChevronLeft className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8"
							onClick={() => onPageChange?.(page + 1)}
							disabled={page === totalPages}>
							<ChevronRight className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8"
							onClick={() => onPageChange?.(totalPages)}
							disabled={page === totalPages}>
							<ChevronsRight className="h-4 w-4" />
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}

export default DataTable;

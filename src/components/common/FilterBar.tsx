import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface FilterOption {
	value: string;
	label: string;
}

interface FilterBarProps {
	filters: {
		key: string;
		label: string;
		options: FilterOption[];
		value?: string;
	}[];
	onFilterChange: (key: string, value: string | undefined) => void;
	onClearAll?: () => void;
}

export function FilterBar({
	filters,
	onFilterChange,
	onClearAll,
}: FilterBarProps) {
	const hasActiveFilters = filters.some((f) => f.value);

	return (
		<div className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 rounded-lg">
			{filters.map((filter) => (
				<div key={filter.key} className="flex items-center gap-2">
					<span className="text-sm text-muted-foreground">{filter.label}:</span>
					<Select
						value={
							filter.value === ""
								? "__empty__"
								: filter.value && filter.value !== ""
								? filter.value
								: "all"
						}
						onValueChange={(value) =>
							onFilterChange(
								filter.key,
								value === "all"
									? undefined
									: value === "__empty__"
									? ""
									: value,
							)
						}>
						<SelectTrigger className="w-40 h-9 bg-background">
							<SelectValue placeholder="All" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All</SelectItem>
							{(Array.isArray(filter.options) ? filter.options : []).map(
								(option) => {
									const optionValue =
										option.value === "" ? "__empty__" : option.value;
									return (
										<SelectItem
											key={
												optionValue === "__empty__"
													? "__empty__"
													: String(option.value) || option.label || "opt"
											}
											value={optionValue}>
											{option.label}
										</SelectItem>
									);
								},
							)}
						</SelectContent>
					</Select>
				</div>
			))}
			{hasActiveFilters && onClearAll && (
				<Button
					variant="ghost"
					size="sm"
					onClick={onClearAll}
					className="text-muted-foreground">
					<X className="h-4 w-4 mr-1" />
					Clear all
				</Button>
			)}
		</div>
	);
}

export default FilterBar;

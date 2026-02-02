import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEFAULT_PLACEHOLDER = "Select date";
const DEFAULT_DATETIME_PLACEHOLDER = "Select date and time";

export interface DatePickerProps {
	value?: Date | null;
	onChange?: (date: Date | undefined) => void;
	placeholder?: string;
	className?: string;
	disabled?: boolean;
	id?: string;
}

export function DatePicker({
	value,
	onChange,
	placeholder = DEFAULT_PLACEHOLDER,
	className,
	disabled,
	id,
}: DatePickerProps) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					id={id}
					type="button"
					variant="outline"
					disabled={disabled}
					className={cn(
						"h-10 w-full justify-start text-left font-normal",
						className,
					)}>
					<CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
					{value ? format(value, "PPP") : placeholder}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="single"
					selected={value ?? undefined}
					onSelect={onChange}
					initialFocus
				/>
			</PopoverContent>
		</Popover>
	);
}

function padTwo(n: number) {
	return String(n).padStart(2, "0");
}

export interface DateTimePickerProps {
	value?: Date | null;
	onChange?: (date: Date | undefined) => void;
	placeholder?: string;
	className?: string;
	disabled?: boolean;
	id?: string;
}

export function DateTimePicker({
	value,
	onChange,
	placeholder = DEFAULT_DATETIME_PLACEHOLDER,
	className,
	disabled,
	id,
}: DateTimePickerProps) {
	const [open, setOpen] = React.useState(false);
	const dateOnly = value ? new Date(value.getFullYear(), value.getMonth(), value.getDate()) : undefined;
	const timeValue = value
		? `${padTwo(value.getHours())}:${padTwo(value.getMinutes())}`
		: "00:00";

	const handleDateSelect = (d: Date | undefined) => {
		if (!d) {
			onChange?.(undefined);
			return;
		}
		const prev = value ?? new Date();
		const next = new Date(d);
		next.setHours(prev.getHours(), prev.getMinutes(), 0, 0);
		onChange?.(next);
	};

	const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const v = e.target.value;
		if (!v) return;
		const [h, m] = v.split(":").map(Number);
		const base = value ?? new Date();
		const next = new Date(base);
		next.setHours(isNaN(h) ? 0 : h, isNaN(m) ? 0 : m, 0, 0);
		onChange?.(next);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					id={id}
					type="button"
					variant="outline"
					disabled={disabled}
					className={cn(
						"h-10 w-full justify-start text-left font-normal",
						className,
					)}>
					<CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
					{value ? format(value, "PPP p") : placeholder}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<div className="p-3 space-y-3">
					<Calendar
						mode="single"
						selected={dateOnly}
						onSelect={handleDateSelect}
						initialFocus
					/>
					<div className="space-y-2 border-t pt-3">
						<Label className="text-xs">Time</Label>
						<Input
							type="time"
							value={timeValue}
							onChange={handleTimeChange}
							className="h-9"
						/>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}

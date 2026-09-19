import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { onApiWarning } from "@/lib/rest-client";

interface Notice {
	title: string;
	message: string;
}

interface NoticeContextValue {
	/** Show the standard compact warning popup. */
	notify: (notice: Notice) => void;
}

const NoticeContext = createContext<NoticeContextValue | null>(null);

/**
 * The one warning popup for the whole backoffice. It shows anything the API flags as a
 * `warning` on a successful response (e.g. a cancelled order whose refund failed) and
 * whatever a page passes to `useNotice().notify` (e.g. a refused delete).
 */
export function NoticeProvider({ children }: { children: ReactNode }) {
	const [notice, setNotice] = useState<Notice | null>(null);

	const notify = useCallback((next: Notice) => setNotice(next), []);
	useEffect(
		() => onApiWarning((message, title) => setNotice({ title: title ?? "Heads up", message })),
		[],
	);
	const value = useMemo(() => ({ notify }), [notify]);

	return (
		<NoticeContext.Provider value={value}>
			{children}
			<AlertDialog
				open={notice !== null}
				onOpenChange={(open) => {
					if (!open) setNotice(null);
				}}>
				<AlertDialogContent className="max-w-sm gap-3 p-5">
					<div className="flex items-start gap-3">
						<AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
						<div className="space-y-1.5">
							<AlertDialogTitle className="text-base">{notice?.title}</AlertDialogTitle>
							<AlertDialogDescription className="text-[13px] leading-snug">
								{notice?.message}
							</AlertDialogDescription>
						</div>
					</div>
					<AlertDialogFooter className="sm:justify-end">
						<AlertDialogAction className="h-8 px-4 text-sm" onClick={() => setNotice(null)}>
							OK
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</NoticeContext.Provider>
	);
}

export function useNotice(): NoticeContextValue {
	const ctx = useContext(NoticeContext);
	if (!ctx) throw new Error("useNotice must be used within NoticeProvider");
	return ctx;
}

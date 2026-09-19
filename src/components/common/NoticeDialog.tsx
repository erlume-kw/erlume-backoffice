import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
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

interface ConfirmOptions {
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	/** Red confirm button, for deletes / cancellations. */
	destructive?: boolean;
}

interface NoticeContextValue {
	/** Show the standard compact warning popup. */
	notify: (notice: Notice) => void;
	/** Ask for confirmation in the same styled popup; resolves true only if confirmed. */
	confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const NoticeContext = createContext<NoticeContextValue | null>(null);

/**
 * The one popup style for the whole backoffice (replaces the browser's alert/confirm).
 * It shows anything the API flags as a `warning` on a successful response (e.g. a
 * cancelled order whose refund failed), whatever a page passes to `useNotice().notify`
 * (e.g. a refused delete), and confirmations via `useNotice().confirm`.
 */
export function NoticeProvider({ children }: { children: ReactNode }) {
	const [notice, setNotice] = useState<Notice | null>(null);

	const notify = useCallback((next: Notice) => setNotice(next), []);
	useEffect(
		() => onApiWarning((message, title) => setNotice({ title: title ?? "Heads up", message })),
		[],
	);

	const [pending, setPending] = useState<ConfirmOptions | null>(null);
	const resolveRef = useRef<((ok: boolean) => void) | null>(null);
	const settle = useCallback((ok: boolean) => {
		resolveRef.current?.(ok);
		resolveRef.current = null;
		setPending(null);
	}, []);
	const confirm = useCallback(
		(options: ConfirmOptions) =>
			new Promise<boolean>((resolve) => {
				resolveRef.current?.(false); // a newer question replaces an unanswered one
				resolveRef.current = resolve;
				setPending(options);
			}),
		[],
	);

	const value = useMemo(() => ({ notify, confirm }), [notify, confirm]);

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
							<AlertDialogDescription className="whitespace-pre-line text-[13px] leading-snug">
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
			<AlertDialog
				open={pending !== null}
				onOpenChange={(open) => {
					if (!open) settle(false);
				}}>
				<AlertDialogContent className="max-w-sm gap-3 p-5">
					<div className="flex items-start gap-3">
						{pending?.destructive ? (
							<AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
						) : (
							<HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
						)}
						<div className="space-y-1.5">
							<AlertDialogTitle className="text-base">{pending?.title}</AlertDialogTitle>
							<AlertDialogDescription className="whitespace-pre-line text-[13px] leading-snug">
								{pending?.message}
							</AlertDialogDescription>
						</div>
					</div>
					<AlertDialogFooter className="flex-row justify-end gap-2 sm:space-x-0">
						<AlertDialogCancel className="mt-0 h-8 px-4 text-sm" onClick={() => settle(false)}>
							{pending?.cancelText ?? "Cancel"}
						</AlertDialogCancel>
						<AlertDialogAction
							className={
								"h-8 px-4 text-sm" +
								(pending?.destructive ? " bg-destructive text-destructive-foreground hover:bg-destructive/90" : "")
							}
							onClick={() => settle(true)}>
							{pending?.confirmText ?? "OK"}
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

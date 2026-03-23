import { useCallback, useEffect, useRef, useState } from "react";
import { formatApiError } from "@/lib/error-utils";

export function useResourceList<T>(loadFn: () => Promise<T[]>) {
	const [data, setData] = useState<T[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const requestId = useRef(0);

	const reload = useCallback(async () => {
		const currentId = ++requestId.current;
		setLoading(true);
		setError(null);

		try {
			const result = await loadFn();
			if (requestId.current !== currentId) {
				return;
			}
			if (Array.isArray(result)) {
				setData(result);
			} else if (result && typeof result === "object") {
				const obj = result as Record<string, unknown>;
				const maybeArray =
					obj.data ??
					obj.items ??
					obj.transactions ??
					obj.orders ??
					obj.sales ??
					obj.incomes ??
					obj.expenses ??
					obj.users ??
					obj.sellers ??
					obj.discountcodes ??
					Object.values(obj).find((v) => Array.isArray(v));
				setData(Array.isArray(maybeArray) ? (maybeArray as T[]) : []);
			} else {
				setData([]);
			}
		} catch (err) {
			if (requestId.current !== currentId) {
				return;
			}
			setError(formatApiError(err) || "Failed to load data");
			setData([]);
		} finally {
			if (requestId.current === currentId) {
				setLoading(false);
			}
		}
	}, [loadFn]);

	useEffect(() => {
		void reload();
		return () => {
			requestId.current += 1;
		};
	}, [reload]);

	return { data, setData, loading, error, reload };
}

import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import logoUrl from "../../erlume_Icon_1_Transparent_green.png";

export default function LoginPage() {
	const { login } = useAuth();
	const navigate = useNavigate();
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const form = event.currentTarget;
		const email = (form.elements.namedItem("email") as HTMLInputElement).value;
		const password = (form.elements.namedItem("password") as HTMLInputElement).value;
		setLoading(true);
		setError("");
		try {
			await login(email, password);
			navigate("/");
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : "Login failed");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-warm-gradient flex items-center justify-center p-6">
			<Card className="w-full max-w-md shadow-lg border-border/60">
				<CardHeader className="items-center text-center">
					<div className="flex items-center justify-center gap-2">
						<img
							src={logoUrl}
							alt="Erlume logo"
							className="h-10 w-10 object-contain"
						/>
						<span className="text-base font-semibold text-foreground tracking-wide">
							Erlume Backoffice
						</span>
					</div>
					<CardTitle className="text-2xl mt-4">Admin Login</CardTitle>
					<CardDescription>
						Sign in with your admin credentials to continue.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form className="space-y-4" onSubmit={handleSubmit}>
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								name="email"
								type="email"
								placeholder="admin@erlume.com"
								required
								disabled={loading}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								name="password"
								type="password"
								placeholder="Enter your password"
								required
								disabled={loading}
							/>
						</div>
						{error && (
							<p className="text-sm text-destructive">{error}</p>
						)}
						<Button type="submit" className="w-full" disabled={loading}>
							{loading ? "Signing in…" : "Sign in"}
						</Button>
						<p className="text-xs text-muted-foreground text-center">
							Contact your system administrator if you need access.
						</p>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}

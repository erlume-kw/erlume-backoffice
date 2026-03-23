import { FormEvent } from "react";
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
import logoUrl from "../../erlume_Icon_1_Transparent_green.png";

export default function LoginPage() {
	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
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
								type="email"
								placeholder="admin@erlume.com"
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								placeholder="Enter your password"
								required
							/>
						</div>
						<Button type="submit" className="w-full">
							Sign in
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

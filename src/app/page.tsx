import { Button } from "@/components/ui/button";

export default function Home() {
	return (
		<div className="flex min-h-screen w-full flex-col items-center justify-center bg-neutral-100 dark:bg-gray-900">
			<main className="flex min-h-screen w-full max-w-3xl flex-col ">
				<p>Home</p>
				<Button className="w-sm">Test Button</Button>
			</main>
		</div>
	);
}

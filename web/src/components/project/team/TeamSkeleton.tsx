export function TeamSkeleton() {
	const teamRowSkeleton = (key: string, isLast: boolean) => (
		<div
			key={key}
			className={`grid grid-cols-[2fr_1fr_1fr_48px_80px] gap-4 items-center px-4 py-3 ${
				!isLast ? "border-b border-gray-100" : ""
			}`}
		>
			<div className="flex items-center gap-2.5 min-w-0">
				<div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
				<div className="space-y-1.5 min-w-0">
					<div className="h-3 w-28 rounded bg-gray-200" />
					<div className="h-2.5 w-36 rounded bg-gray-100" />
				</div>
			</div>
			<div className="h-3 w-20 rounded bg-gray-200" />
			<div className="flex items-center gap-1.5">
				<div className="w-2 h-2 rounded-full bg-gray-200" />
				<div className="h-2.5 w-12 rounded bg-gray-200" />
			</div>
			<div className="flex justify-center">
				<div className="h-7 w-7 rounded-lg bg-gray-100" />
			</div>
			<div className="flex justify-end gap-1">
				<div className="h-7 w-7 rounded-lg bg-gray-100" />
				<div className="h-7 w-7 rounded-lg bg-gray-100" />
			</div>
		</div>
	);

	return (
		<div className="h-full overflow-y-auto bg-gray-50/40">
			<div className="px-6 py-6 w-full max-w-6xl animate-pulse space-y-8">
				<div className="inline-flex items-center gap-1 bg-gray-100 rounded-full p-1">
					<div className="h-8 w-20 rounded-full bg-gray-300" />
					<div className="h-8 w-36 rounded-full bg-gray-200" />
					<div className="h-8 w-36 rounded-full bg-gray-200" />
				</div>

				<div className="flex items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<div className="h-10 w-56 rounded-lg border border-gray-200 bg-gray-100" />
						<div className="h-10 w-28 rounded-lg border border-gray-200 bg-gray-100" />
					</div>
					<div className="h-10 w-40 rounded-md bg-gray-200" />
				</div>

				<div>
					<div className="h-3 w-52 rounded bg-gray-200 mb-3" />
					<div className="grid grid-cols-[2fr_1fr_1fr_48px_80px] gap-4 items-center px-4 mb-2">
						<div className="h-2.5 w-14 rounded bg-gray-200" />
						<div className="h-2.5 w-10 rounded bg-gray-200" />
						<div className="h-2.5 w-12 rounded bg-gray-200" />
						<div className="h-2.5 w-8 rounded bg-gray-200 justify-self-center" />
						<div className="h-2.5 w-12 rounded bg-gray-200 justify-self-end" />
					</div>
					<div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
						{teamRowSkeleton("principal-0", false)}
						{teamRowSkeleton("principal-1", true)}
					</div>
				</div>

				<div>
					<div className="h-3 w-16 rounded bg-gray-200 mb-3" />
					<div className="grid grid-cols-[2fr_1fr_1fr_48px_80px] gap-4 items-center px-4 mb-2">
						<div className="h-2.5 w-14 rounded bg-gray-200" />
						<div className="h-2.5 w-10 rounded bg-gray-200" />
						<div className="h-2.5 w-12 rounded bg-gray-200" />
						<div className="h-2.5 w-8 rounded bg-gray-200 justify-self-center" />
						<div className="h-2.5 w-12 rounded bg-gray-200 justify-self-end" />
					</div>
					<div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
						{teamRowSkeleton("member-0", false)}
						{teamRowSkeleton("member-1", false)}
						{teamRowSkeleton("member-2", true)}
					</div>
				</div>

				<div>
					<div className="h-3 w-24 rounded bg-gray-200 mb-3" />
					<div className="bg-white border border-gray-100 rounded-lg p-4 flex items-center justify-between shadow-sm">
						<div className="h-3.5 w-24 rounded bg-gray-200" />
						<div className="h-8 w-36 rounded-full bg-gray-100" />
					</div>
				</div>
			</div>
		</div>
	);
}

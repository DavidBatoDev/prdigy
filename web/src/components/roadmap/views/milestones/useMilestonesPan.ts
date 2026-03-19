import {
	type RefObject,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { isInteractivePanTarget } from "./utils";

interface UseMilestonesPanParams {
	timelineScrollRef: RefObject<HTMLDivElement | null>;
	verticalScrollRef: RefObject<HTMLDivElement | null>;
}

export function useMilestonesPan({
	timelineScrollRef,
	verticalScrollRef,
}: UseMilestonesPanParams) {
	const [isPanningTimeline, setIsPanningTimeline] = useState(false);
	const panStateRef = useRef<{
		startX: number;
		startY: number;
		startScrollLeft: number;
		startScrollTop: number;
	} | null>(null);

	useEffect(() => {
		if (!isPanningTimeline) return;

		const handleMouseMove = (event: MouseEvent) => {
			const panState = panStateRef.current;
			const timelineEl = timelineScrollRef.current;
			const verticalEl = verticalScrollRef.current;
			if (!panState || !timelineEl || !verticalEl) return;

			const dx = event.clientX - panState.startX;
			const dy = event.clientY - panState.startY;
			timelineEl.scrollLeft = panState.startScrollLeft - dx;
			verticalEl.scrollTop = panState.startScrollTop - dy;
		};

		const stopPanning = () => {
			panStateRef.current = null;
			setIsPanningTimeline(false);
		};

		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", stopPanning);
		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", stopPanning);
		};
	}, [isPanningTimeline, timelineScrollRef, verticalScrollRef]);

	const handleTimelineMouseDown = useCallback(
		(event: MouseEvent) => {
			if (event.button !== 0) return;
			if (isInteractivePanTarget(event.target)) return;

			const timelineEl = timelineScrollRef.current;
			const verticalEl = verticalScrollRef.current;
			if (!timelineEl || !verticalEl) return;

			panStateRef.current = {
				startX: event.clientX,
				startY: event.clientY,
				startScrollLeft: timelineEl.scrollLeft,
				startScrollTop: verticalEl.scrollTop,
			};
			setIsPanningTimeline(true);
			event.preventDefault();
		},
		[timelineScrollRef, verticalScrollRef],
	);

	useEffect(() => {
		const timelineElement = timelineScrollRef.current;
		if (!timelineElement) return;

		timelineElement.addEventListener("mousedown", handleTimelineMouseDown);
		return () => {
			timelineElement.removeEventListener("mousedown", handleTimelineMouseDown);
		};
	}, [timelineScrollRef, handleTimelineMouseDown]);

	return {
		isPanningTimeline,
	};
}

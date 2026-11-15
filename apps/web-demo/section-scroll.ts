/** Section stops supplement native snapping; links, keyboard and touch remain native. */
export function setupSectionScrolling() {
	const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-scroll-section]'));
	const footer = document.querySelector<HTMLElement>('#page-footer');
	let direction = 0,
		impulse = 0,
		previous = 0,
		settlingUntil = 0;
	const scrollRoom = (target: Element, delta: number, section: HTMLElement) => {
		for (let node: Element | null = target; node && node !== section; node = node.parentElement) {
			if (!(node instanceof HTMLElement) || !/(auto|scroll)/.test(getComputedStyle(node).overflowY))
				continue;
			if (
				delta > 0 ? node.scrollTop + node.clientHeight < node.scrollHeight - 1 : node.scrollTop > 1
			)
				return true;
		}
		return false;
	};
	const onWheel = (event: WheelEvent) => {
		if (
			!event.cancelable ||
			event.defaultPrevented ||
			event.ctrlKey ||
			event.metaKey ||
			event.shiftKey ||
			!event.deltaY ||
			Math.abs(event.deltaX) >= Math.abs(event.deltaY)
		)
			return;
		const target = event.target instanceof Element ? event.target : null;
		if (
			!target ||
			document.querySelector('dialog[open]') ||
			target.closest('input, textarea, select, [contenteditable]')
		)
			return;
		const now = performance.now();
		if (now < settlingUntil) {
			event.preventDefault();
			return;
		}
		const index = sections.findIndex((section) => {
			const bounds = section.getBoundingClientRect();
			return Math.abs(bounds.top) < 3 && bounds.height <= innerHeight + 4;
		});
		if (index < 0) {
			impulse = 0;
			return;
		}
		const delta =
			event.deltaY *
			(event.deltaMode === WheelEvent.DOM_DELTA_LINE
				? 20
				: event.deltaMode === WheelEvent.DOM_DELTA_PAGE
					? innerHeight
					: 1);
		const nextDirection = Math.sign(delta);
		if (nextDirection !== direction || now - previous > 220) impulse = 0;
		direction = nextDirection;
		previous = now;
		impulse += Math.abs(delta);
		const threshold = Math.max(360, Math.min(560, innerHeight * 0.55));
		const strong = Math.abs(delta) >= threshold || impulse >= threshold * 1.8;
		const next = sections[index + direction] ?? (direction > 0 ? footer : null);
		if (strong && next) {
			event.preventDefault();
			impulse = 0;
			const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
			settlingUntil = reduced ? 0 : now + 450;
			const bounds = next.getBoundingClientRect();
			const top = scrollY + (next === footer ? bounds.bottom - innerHeight : bounds.top);
			window.scrollTo({ top, behavior: reduced ? 'instant' : 'smooth' });
		} else if (!scrollRoom(target, delta, sections[index])) {
			event.preventDefault();
		}
	};
	window.addEventListener('wheel', onWheel, { passive: false });
	return () => window.removeEventListener('wheel', onWheel);
}

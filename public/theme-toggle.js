(() => {
	const storageKey = 'theme-preference';
	const root = document.documentElement;
	const toggleBtn = document.getElementById('theme-toggle-btn');
	const menu = document.getElementById('theme-menu');
	const menuItems = Array.from(document.querySelectorAll('.theme-menu-item[data-theme-value]'));

	const supportsSystem = typeof window.matchMedia === 'function';
	const mediaQuery = supportsSystem
		? window.matchMedia('(prefers-color-scheme: dark)')
		: null;

	const getSavedMode = () => {
		try {
			const stored = localStorage.getItem(storageKey);
			if (stored === 'light' || stored === 'dark' || stored === 'system') {
				return stored;
			}
		} catch {
			// Ignore storage errors and use default mode.
		}
		return 'system';
	};

	const resolveMode = (mode) => {
		if (mode !== 'system') {
			return mode;
		}

		if (!mediaQuery) {
			return 'dark';
		}

		return mediaQuery.matches ? 'dark' : 'light';
	};

	const applyMode = (mode, persist = true) => {
		const resolved = resolveMode(mode);

		root.classList.remove('light', 'dark');
		root.classList.add(resolved);
		root.setAttribute('data-theme-mode', mode);
		root.setAttribute('data-theme-resolved', resolved);

		if (persist) {
			try {
				localStorage.setItem(storageKey, mode);
			} catch {
				// Ignore storage errors.
			}
		}

		if (toggleBtn) {
			toggleBtn.setAttribute('title', `Theme: ${mode} (${resolved})`);
			toggleBtn.setAttribute('aria-label', `Theme menu. Current: ${mode}`);
			toggleBtn.classList.toggle('active-icon', mode !== 'system');
		}

		menuItems.forEach((item) => {
			item.classList.toggle('active', item.getAttribute('data-theme-value') === mode);
		});
	};

	const currentMode = getSavedMode();
	applyMode(currentMode, false);

	if (mediaQuery) {
		mediaQuery.addEventListener('change', () => {
			if (root.getAttribute('data-theme-mode') === 'system') {
				applyMode('system', false);
			}
		});
	}

	if (!toggleBtn || !menu) {
		return;
	}

	const closeMenu = () => {
		menu.hidden = true;
		toggleBtn.setAttribute('aria-expanded', 'false');
	};

	const openMenu = () => {
		menu.hidden = false;
		toggleBtn.setAttribute('aria-expanded', 'true');
	};

	const toggleMenu = () => {
		if (menu.hidden) {
			openMenu();
		} else {
			closeMenu();
		}
	};

	toggleBtn.addEventListener('click', (event) => {
		event.stopPropagation();
		toggleMenu();
	});

	toggleBtn.addEventListener('keydown', (event) => {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			toggleMenu();
		}

		if (event.key === 'Escape') {
			closeMenu();
		}
	});

	menuItems.forEach((item) => {
		item.addEventListener('click', (event) => {
			event.stopPropagation();
			const mode = item.getAttribute('data-theme-value');
			if (!mode) return;
			closeMenu();
			applyMode(mode, true);
		});
	});

	document.addEventListener('click', (event) => {
		const clickTarget = event.target;
		if (!(clickTarget instanceof Node)) {
			closeMenu();
			return;
		}

		if (!menu.contains(clickTarget) && clickTarget !== toggleBtn) {
			closeMenu();
		}
	});

	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape') {
			closeMenu();
		}
	});
})();

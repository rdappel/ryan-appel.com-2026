const normalize = value => value.trim().toLowerCase()

const escapeHtml = value => value
	.replaceAll('&', '&amp;')
	.replaceAll('<', '&lt;')
	.replaceAll('>', '&gt;')
	.replaceAll('"', '&quot;')
	.replaceAll("'", '&#39;')

const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const getTerms = query => [...new Set(
	query
		.trim()
		.toLowerCase()
		.split(/\s+/)
		.filter(Boolean)
)]

const getQuery = () => {
	const params = new URLSearchParams(window.location.search)
	return params.get('q')?.trim() ?? ''
}

const updateQueryString = query => {
	const url = new URL(window.location.href)

	if (query) {
		url.searchParams.set('q', query)
	} else {
		url.searchParams.delete('q')
	}

	window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
}

const highlightText = (text, query) => {
	const terms = getTerms(query)
	if (!terms.length) return escapeHtml(text)

	const pattern = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'ig')
	const parts = text.split(pattern)

	return parts.map(part => {
		if (!part) return ''
		const normalizedPart = part.toLowerCase()
		if (!terms.includes(normalizedPart)) return escapeHtml(part)
		return `<mark class="archive-search-hit">${escapeHtml(part)}</mark>`
	}).join('')
}

const updateHighlights = (post, query) => {
	const fields = Array.from(post.querySelectorAll('[data-archive-field]'))

	fields.forEach(field => {
		const originalText = field.dataset.originalText ?? field.textContent ?? ''
		field.innerHTML = highlightText(originalText, query)
	})
}

const applyArchiveSearch = ({ posts, emptyState }, query) => {
	const normalizedQuery = normalize(query)
	const visiblePosts = posts.filter(post => {
		const haystack = post.dataset.search ?? ''
		const matches = !normalizedQuery || haystack.includes(normalizedQuery)

		post.hidden = !matches
		updateHighlights(post, query)
		return matches
	})

	if (emptyState) {
		emptyState.hidden = visiblePosts.length !== 0
	}
}

const isTypingTarget = target => {
	if (!(target instanceof HTMLElement)) return false
	if (target.isContentEditable) return true

	const tagName = target.tagName.toLowerCase()
	return tagName === 'input' || tagName === 'textarea' || tagName === 'select'
}

const initSearchShortcut = input => {
	document.addEventListener('keydown', event => {
		if (event.key !== '/') return
		if (event.ctrlKey || event.metaKey || event.altKey) return
		if (isTypingTarget(event.target)) return

		event.preventDefault()
		input.focus()
		input.select()
	})
}

const initArchiveSearch = input => {
	const posts = Array.from(document.querySelectorAll('[data-archive-post]'))
	const emptyState = document.querySelector('[data-archive-empty]')
	if (!posts.length) return false

	const initialQuery = getQuery()
	input.value = initialQuery
	applyArchiveSearch({ posts, emptyState }, initialQuery)

	input.addEventListener('input', event => {
		const query = event.target.value.trim()
		applyArchiveSearch({ posts, emptyState }, query)
		updateQueryString(query)
	})

	input.addEventListener('keydown', event => {
		if (event.key !== 'Escape') return
		if (!input.value) return

		input.value = ''
		applyArchiveSearch({ posts, emptyState }, '')
		updateQueryString('')
	})

	return true
}

const initGlobalArchiveNavigation = input => {
	input.addEventListener('keydown', event => {
		if (event.key !== 'Enter') return

		const query = input.value.trim()
		if (!query) return

		window.location.assign(`/archive/?q=${encodeURIComponent(query)}`)
	})
}

const initSearch = () => {
	const input = document.querySelector('.search-input')
	if (!(input instanceof HTMLInputElement)) return
	initSearchShortcut(input)
	if (initArchiveSearch(input)) return
	initGlobalArchiveNavigation(input)
}

initSearch()

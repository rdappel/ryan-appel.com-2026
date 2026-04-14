(() => {
	const pad2 = num => String(num).padStart(2, '0')

	const utcTimeText = () => {
		const now = new Date()
		const hh = pad2(now.getUTCHours())
		const mm = pad2(now.getUTCMinutes())
		const ss = pad2(now.getUTCSeconds())
		return `${hh}:${mm}:${ss} UTC`
	}

	const updateUtcClocks = () => {
		const clocks = document.querySelectorAll('.bottombar-time')
		if (!clocks.length) return

		const text = utcTimeText()
		clocks.forEach(el => {
			el.textContent = text
		})
	}

	updateUtcClocks()
	setInterval(updateUtcClocks, 1000)
})()

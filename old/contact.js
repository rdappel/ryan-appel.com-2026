(() => {
	const form = document.getElementById('contact-form')
	const progressBar = document.getElementById('contact-progress-bar')

	if (!form || !progressBar) return

	const replayProgressAnimation = () => {
		progressBar.style.animation = 'none'
		void progressBar.offsetHeight
		progressBar.style.animation = 'contactSlide 1.9s linear 1 forwards'
	}

	form.addEventListener('submit', event => {
		event.preventDefault()
		replayProgressAnimation()
	})
})()

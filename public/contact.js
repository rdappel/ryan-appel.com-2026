(function () {
	var form = document.getElementById('contact-form');
	var progressBar = document.getElementById('contact-progress-bar');

	if (!form || !progressBar) {
		return;
	}

	function replayProgressAnimation() {
		progressBar.style.animation = 'none';
		progressBar.offsetHeight;
		progressBar.style.animation = 'contactSlide 1.9s linear 1 forwards';
	}

	form.addEventListener('submit', function (event) {
		event.preventDefault();
		replayProgressAnimation();
	});
})();
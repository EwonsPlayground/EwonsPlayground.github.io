(function(){
	const initMain = function() {
		// Modal Functionality
		const openModalButtons = document.querySelectorAll(".js-open-modal-button");

		// Modal Open / Close Functionality
		openModalButtons.forEach(openButton => {
			const modal = document.querySelector('.' + openButton.dataset.modal);

			if (modal !== null) {
				let closing = false;

				const openModal = function() {
					modal.classList.add('show');
				}

				const closeModal = function() {
					if (!closing) {
						modal.addEventListener("animationend", function() {
							closing = false;
							modal.classList.remove('show');
							modal.classList.remove('hide');
							const formConfrimation = modal.querySelector('.js-form-confirmation');

							if (formConfrimation && formConfrimation.classList.contains('show')) {
								formConfrimation.classList.remove('show');
							}
						}, {once: true});

						closing = true;
						modal.classList.add('hide');
					}
				}

				openButton.addEventListener("click", openModal);
				modal.querySelector('.js-close-modal-button').addEventListener("click", closeModal);
				modal.querySelector('.js-close-modal-wrapper').addEventListener("click", closeModal);
			}
		});


		// Site Settings Form Functionality
		const siteSettingsForm = document.querySelector('.js-site-settings-form');
		const formConfirmation = siteSettingsForm.querySelector('.js-form-confirmation');

		const saveSiteSettings = function(e) {
			e.preventDefault();

			const apiKey = siteSettingsForm.querySelector("#settings-api-key").value;
			
			if (apiKey) {
				localStorage.setItem("api_key", apiKey);
			}

			formConfirmation.classList.add('show');
		}

		siteSettingsForm.addEventListener('submit', saveSiteSettings);

		// Check Local Storage and Set Fields
		// API Key
		if (localStorage.getItem("api_key")) {
			siteSettingsForm.querySelector("#settings-api-key").value = localStorage.getItem("api_key");
		}
	}


	// Initialize the main script once the DOM is ready
	document.addEventListener('DOMContentLoaded', function () {
    initMain();
	});
})()

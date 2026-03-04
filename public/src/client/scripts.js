'use strict';

define('forum/scripts', ['forum/alerts', 'api', 'hooks'], function (alerts, api, hooks) {
	const Scripts = {};

	Scripts.init = function () {
		Scripts.initUploadForm();
		Scripts.initManagePage();
		Scripts.initListPage();
		Scripts.initDetailPage();
	};

	Scripts.initUploadForm = function () {
		const form = document.getElementById('script-upload-form');
		if (!form) {
			return;
		}

		const fileInput = document.getElementById('script-file');
		const contentInput = document.getElementById('script-content');
		const errorAlert = document.getElementById('upload-error');
		const successAlert = document.getElementById('upload-success');
		const submitBtn = document.getElementById('upload-submit');

		if (fileInput && contentInput) {
			fileInput.addEventListener('change', function (e) {
				const file = e.target.files[0];
				if (file) {
					const reader = new FileReader();
					reader.onload = function (event) {
						contentInput.value = event.target.result;
					};
					reader.onerror = function () {
						showError('[[scripts:error.uploadFailed]]');
					};
					reader.readAsText(file);
				}
			});
		}

		form.addEventListener('submit', async function (e) {
			e.preventDefault();

			hideAlerts();

			const title = document.getElementById('script-title').value.trim();
			const description = document.getElementById('script-description').value.trim();
			const content = contentInput ? contentInput.value.trim() : '';
			const visibility = document.getElementById('script-visibility').value;

			if (!title) {
				showError('[[scripts:error.titleRequired]]');
				return;
			}
			if (!description) {
				showError('[[scripts:error.descriptionRequired]]');
				return;
			}
			if (content) {
				try {
					JSON.parse(content);
				} catch (err) {
					showError('[[scripts:error.invalidJson]]');
					return;
				}
			}

			submitBtn.disabled = true;
			submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

			try {
				const result = await api.post('/scripts', {
					title,
					description,
					content,
					visibility,
				});

				showSuccess('[[scripts:success.uploaded]]');
				setTimeout(function () {
					window.location.href = '/scripts/manage';
				}, 1500);
			} catch (err) {
				showError(err.message || '[[scripts:error.uploadFailed]]');
				submitBtn.disabled = false;
				submitBtn.innerHTML = '[[scripts:form.submit]]';
			}
		});

		function showError(msg) {
			if (errorAlert) {
				errorAlert.textContent = msg;
				errorAlert.classList.remove('hidden');
			}
			if (successAlert) {
				successAlert.classList.add('hidden');
			}
		}

		function showSuccess(msg) {
			if (successAlert) {
				successAlert.textContent = msg;
				successAlert.classList.remove('hidden');
			}
			if (errorAlert) {
				errorAlert.classList.add('hidden');
			}
		}

		function hideAlerts() {
			if (errorAlert) {
				errorAlert.classList.add('hidden');
			}
			if (successAlert) {
				successAlert.classList.add('hidden');
			}
		}
	};

	Scripts.initManagePage = function () {
		const editModal = document.getElementById('edit-script-modal');
		if (!editModal) {
			return;
		}

		const errorAlert = document.getElementById('manage-error');

		document.querySelectorAll('[data-action="edit"]').forEach(function (btn) {
			btn.addEventListener('click', async function () {
				const sid = this.getAttribute('data-sid');
				try {
					const script = await api.get('/scripts/' + sid);
					document.getElementById('edit-sid').value = script.sid;
					document.getElementById('edit-title').value = script.title;
					document.getElementById('edit-description').value = script.description;
					document.getElementById('edit-content').value = script.content || '';
					document.getElementById('edit-visibility').value = script.visibility || 'private';

					const modal = new bootstrap.Modal(editModal);
					modal.show();
				} catch (err) {
					showError(err.message);
				}
			});
		});

		document.querySelectorAll('[data-action="delete"]').forEach(function (btn) {
			btn.addEventListener('click', async function () {
				const sid = this.getAttribute('data-sid');
				try {
					await api.del('/scripts/' + sid);
					const card = document.querySelector('.script-card[data-sid="' + sid + '"]');
					if (card) {
						card.remove();
					}
					const remaining = document.querySelectorAll('.script-card');
					if (remaining.length === 0) {
						window.location.reload();
					}
				} catch (err) {
					showError(err.message);
				}
			});
		});

		const saveBtn = document.getElementById('save-script-btn');
		if (saveBtn) {
			saveBtn.addEventListener('click', async function () {
				const sid = document.getElementById('edit-sid').value;
				const title = document.getElementById('edit-title').value.trim();
				const description = document.getElementById('edit-description').value.trim();
				const content = document.getElementById('edit-content').value.trim();
				const visibility = document.getElementById('edit-visibility').value;

				if (!title || !description) {
					showError('[[scripts:error.titleRequired]] / [[scripts:error.descriptionRequired]]');
					return;
				}

				if (content) {
					try {
						JSON.parse(content);
					} catch (err) {
						showError('[[scripts:error.invalidJson]]');
						return;
					}
				}

				try {
					await api.put('/scripts/' + sid, {
						title,
						description,
						content,
						visibility,
					});
					const modal = bootstrap.Modal.getInstance(editModal);
					modal.hide();
					window.location.reload();
				} catch (err) {
					showError(err.message);
				}
			});
		}

		function showError(msg) {
			if (errorAlert) {
				errorAlert.textContent = msg;
				errorAlert.classList.remove('hidden');
			}
		}
	};

	Scripts.initListPage = function () {
		if (!ajaxify.data.template || !ajaxify.data.template.name) {
			return;
		}
		const templateName = ajaxify.data.template.name;
		if (templateName !== 'scripts') {
			return;
		}

		const searchInput = document.getElementById('search-input');
		const sortSelect = document.getElementById('scripts-sort');

		if (searchInput) {
			searchInput.addEventListener('keypress', function (e) {
				if (e.key === 'Enter') {
					e.preventDefault();
					const q = searchInput.value.trim();
					const currentUrl = new URL(window.location.href);
					if (q) {
						currentUrl.searchParams.set('q', q);
					} else {
						currentUrl.searchParams.delete('q');
					}
					currentUrl.searchParams.set('page', '1');
					ajaxify.go(currentUrl.pathname + currentUrl.search);
				}
			});
		}

		if (sortSelect) {
			sortSelect.addEventListener('change', function () {
				const sort = sortSelect.value;
				const currentUrl = new URL(window.location.href);
				currentUrl.searchParams.set('sort', sort);
				currentUrl.searchParams.set('page', '1');
				ajaxify.go(currentUrl.pathname + currentUrl.search);
			});
		}
	};

	Scripts.initDetailPage = function () {
		if (!ajaxify.data.template || !ajaxify.data.template.name) {
			return;
		}
		const templateName = ajaxify.data.template.name;
		if (templateName !== 'script') {
			return;
		}

		const likeBtn = document.querySelector('[data-action="like"]');
		const favoriteBtn = document.querySelector('[data-action="favorite"]');
		const downloadBtn = document.querySelector('[data-action="download"]');

		if (likeBtn) {
			likeBtn.addEventListener('click', async function () {
				const sid = ajaxify.data.script.sid;
				const isLiked = likeBtn.classList.contains('liked');

				try {
					if (isLiked) {
						await api.del(`/scripts/${sid}/like`);
						likeBtn.classList.remove('liked');
						const countEl = likeBtn.querySelector('.count');
						if (countEl) {
							countEl.textContent = parseInt(countEl.textContent, 10) - 1;
						}
					} else {
						await api.post(`/scripts/${sid}/like`);
						likeBtn.classList.add('liked');
						const countEl = likeBtn.querySelector('.count');
						if (countEl) {
							countEl.textContent = parseInt(countEl.textContent, 10) + 1;
						}
					}
				} catch (err) {
					alerts.error(err.message);
				}
			});
		}

		if (favoriteBtn) {
			favoriteBtn.addEventListener('click', async function () {
				const sid = ajaxify.data.script.sid;
				const isFavorited = favoriteBtn.classList.contains('favorited');

				try {
					if (isFavorited) {
						await api.del(`/scripts/${sid}/favorite`);
						favoriteBtn.classList.remove('favorited');
						const countEl = favoriteBtn.querySelector('.count');
						if (countEl) {
							countEl.textContent = parseInt(countEl.textContent, 10) - 1;
						}
					} else {
						await api.post(`/scripts/${sid}/favorite`);
						favoriteBtn.classList.add('favorited');
						const countEl = favoriteBtn.querySelector('.count');
						if (countEl) {
							countEl.textContent = parseInt(countEl.textContent, 10) + 1;
						}
					}
				} catch (err) {
					alerts.error(err.message);
				}
			});
		}

		if (downloadBtn) {
			downloadBtn.addEventListener('click', async function () {
				const sid = ajaxify.data.script.sid;

				try {
					const result = await api.post(`/scripts/${sid}/download`);
					if (result.content) {
						const blob = new Blob([result.content], { type: 'application/json' });
						const url = URL.createObjectURL(blob);
						const a = document.createElement('a');
						a.href = url;
						a.download = `${ajaxify.data.script.title || 'script'}.json`;
						document.body.appendChild(a);
						a.click();
						document.body.removeChild(a);
						URL.revokeObjectURL(url);

						const countEl = downloadBtn.querySelector('.count');
						if (countEl && result.downloads !== undefined) {
							countEl.textContent = result.downloads;
						}
					}
				} catch (err) {
					alerts.error(err.message);
				}
			});
		}
	};

	return Scripts;
});

<div class="row">
	<div class="col-12">
		<div class="d-flex justify-content-between align-items-center mb-4">
			<h1 class="fs-3">[[scripts:manage-title]]</h1>
			<a href="/scripts/upload" class="btn btn-primary">[[scripts:upload]]</a>
		</div>

		{{{ if scripts.length }}}
		<div class="scripts-list">
			{{{ each scripts }}}
			<div class="card mb-3 script-card" data-sid="{./sid}">
				<div class="card-body">
					<div class="d-flex justify-content-between align-items-start">
						<div class="script-info flex-grow-1">
							<h5 class="card-title">
								<a href="/scripts/{./sid}">{./title}</a>
								<span class="badge bg-{./visibility === 'public' ? 'success' : 'secondary'} ms-2">{./visibility}</span>
								<span class="badge bg-{./status === 'active' ? 'success' : (./status === 'unavailable' ? 'warning' : 'danger')} ms-1">{./status}</span>
							</h5>
							<p class="card-text text-muted">{./description}</p>
							<div class="script-meta text-muted small">
								<span>[[scripts:stats.likes]]</span>: {./likes} &nbsp;
								<span>[[scripts:stats.favorites]]</span>: {./favorites} &nbsp;
								<span>[[scripts:stats.downloads]]</span>: {./downloads}
							</div>
						</div>
						<div class="script-actions ms-3">
							<button class="btn btn-sm btn-outline-primary me-1" data-action="edit" data-sid="{./sid}">[[scripts:edit]]</button>
							<button class="btn btn-sm btn-outline-danger" data-action="delete" data-sid="{./sid}">[[scripts:delete]]</button>
						</div>
					</div>
				</div>
			</div>
			{{{ end }}}
		</div>

		{{{ if pagination.pages.length }}}
		<nav aria-label="Scripts pagination">
			<ul class="pagination justify-content-center">
				{{{ each pagination.pages }}}
				<li class="page-item{{{ if ./active }}} active{{{ end }}}">
					<a class="page-link" href="{{{ if ./url }}}{./url}{{{ else }}}?page={./number}{{{ end }}}">{./number}</a>
				</li>
				{{{ end }}}
			</ul>
		</nav>
		{{{ end }}}

		{{{ else }}}
		<div class="alert alert-info">
			<p class="mb-0">[[scripts:noScriptsMine]]</p>
			<p class="mb-0 text-muted">[[scripts:noScriptsMineDescription]]</p>
		</div>
		{{{ end }}}
	</div>
</div>

<!-- Edit Modal -->
<div class="modal fade" id="edit-script-modal" tabindex="-1" aria-labelledby="edit-script-modal-label" aria-hidden="true">
	<div class="modal-dialog modal-lg">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title" id="edit-script-modal-label">[[scripts:edit]]</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			</div>
			<div class="modal-body">
				<form id="edit-script-form">
					<input type="hidden" name="sid" id="edit-sid" value="" />
					<div class="mb-3">
						<label for="edit-title" class="form-label">[[scripts:form.title]]</label>
						<input type="text" class="form-control" id="edit-title" name="title" required />
					</div>
					<div class="mb-3">
						<label for="edit-description" class="form-label">[[scripts:form.description]]</label>
						<textarea class="form-control" id="edit-description" name="description" rows="3" required></textarea>
					</div>
					<div class="mb-3">
						<label for="edit-content" class="form-label">[[scripts:form.content]]</label>
						<textarea class="form-control font-monospace" id="edit-content" name="content" rows="10"></textarea>
					</div>
					<div class="mb-3">
						<label for="edit-visibility" class="form-label">[[scripts:form.visibility]]</label>
						<select class="form-select" id="edit-visibility" name="visibility">
							<option value="public">[[scripts:form.visibility.public]]</option>
							<option value="private">[[scripts:form.visibility.private]]</option>
						</select>
					</div>
				</form>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">[[modules:bootbox.cancel]]</button>
				<button type="button" class="btn btn-primary" id="save-script-btn">[[scripts:form.update]]</button>
			</div>
		</div>
	</div>
</div>

<div class="alert alert-danger hidden" id="manage-error" role="alert"></div>

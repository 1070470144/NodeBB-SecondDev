<div class="row">
	<div class="col-12 col-sm-8 offset-sm-2">
		<h1 class="text-center fs-5">[[scripts:upload-title]]</h1>

		<form id="script-upload-form" role="form" method="post" enctype="multipart/form-data">
			<input type="hidden" name="csrf_token" value="{config.csrf_token}" />

			<div class="mb-3">
				<label for="script-title" class="form-label">[[scripts:form.title]]</label>
				<input type="text" class="form-control" id="script-title" name="title" placeholder="[[scripts:form.titlePlaceholder]]" required />
			</div>

			<div class="mb-3">
				<label for="script-description" class="form-label">[[scripts:form.description]]</label>
				<textarea class="form-control" id="script-description" name="description" rows="3" placeholder="[[scripts:form.descriptionPlaceholder]]" required></textarea>
			</div>

			<div class="mb-3">
				<label for="script-file" class="form-label">[[scripts:form.file]]</label>
				<input type="file" class="form-control" id="script-file" name="file" accept=".json,application/json" />
				<div class="form-text">[[scripts:form.fileHelp]]</div>
			</div>

			<div class="mb-3">
				<label for="script-content" class="form-label">[[scripts:form.content]]</label>
				<textarea class="form-control font-monospace" id="script-content" name="content" rows="10" placeholder="[[scripts:form.contentPlaceholder]]"></textarea>
				<div class="form-text">[[scripts:form.contentHelp]]</div>
			</div>

			<div class="mb-3">
				<label for="script-visibility" class="form-label">[[scripts:form.visibility]]</label>
				<select class="form-select" id="script-visibility" name="visibility">
					<option value="public" {{#if scriptsConfig.defaultVisibility}}{{#ifeq scriptsConfig.defaultVisibility "public"}}selected{{/ifeq}}{{/if}}>[[scripts:form.visibility.public]]</option>
					<option value="private" {{#if scriptsConfig.defaultVisibility}}{{#ifeq scriptsConfig.defaultVisibility "private"}}selected{{/ifeq}}{{/if}}>[[scripts:form.visibility.private]]</option>
				</select>
			</div>

			<div class="alert alert-danger hidden" id="upload-error" role="alert"></div>
			<div class="alert alert-success hidden" id="upload-success" role="alert"></div>

			<div class="d-grid gap-2">
				<button type="submit" class="btn btn-primary" id="upload-submit">[[scripts:form.submit]]</button>
				<a href="/scripts/manage" class="btn btn-outline-secondary">[[modules:bootbox.cancel]]</a>
			</div>
		</form>
	</div>
</div>

'use strict';

const db = require('../database');
const scripts = require('../scripts');
const interactions = require('../scripts/interactions');
const moderation = require('../scripts/moderation');
const user = require('../user');
const privileges = require('../privileges');

const api = module.exports;

api.create = async function (caller, data) {
	if (!caller.uid) {
		throw new Error('[[error:not-logged-in]]');
	}
	if (!data.title || !data.title.trim()) {
		throw new Error('[[error:invalid-data]]');
	}
	if (!data.description || !data.description.trim()) {
		throw new Error('[[error:invalid-data]]');
	}

	const script = await scripts.create({
		uid: caller.uid,
		title: data.title,
		description: data.description,
		content: data.content,
		visibility: data.visibility,
	});

	return script;
};

api.update = async function (caller, { sid, ...data }) {
	if (!caller.uid) {
		throw new Error('[[error:not-logged-in]]');
	}

	const script = await scripts.getById(sid);
	if (!script) {
		throw new Error('[[error:not-found]]');
	}

	const canEdit = await scripts.canEdit(script, caller.uid);
	if (!canEdit) {
		throw new Error('[[error:no-privileges]]');
	}

	const updated = await scripts.update(sid, data);
	return updated;
};

api.remove = async function (caller, { sid }) {
	if (!caller.uid) {
		throw new Error('[[error:not-logged-in]]');
	}

	const script = await scripts.getById(sid);
	if (!script) {
		throw new Error('[[error:not-found]]');
	}

	const canEdit = await scripts.canEdit(script, caller.uid);
	if (!canEdit) {
		throw new Error('[[error:no-privileges]]');
	}

	await scripts.remove(sid, true);
	return { ok: true };
};

api.get = async function (caller, { sid }) {
	const script = await scripts.getById(sid);
	if (!script) {
		throw new Error('[[error:not-found]]');
	}

	const canView = await scripts.canView(script, caller.uid);
	if (!canView) {
		throw new Error('[[error:no-privileges]]');
	}

	const result = { ...script };
	if (!canView) {
		delete result.content;
	}

	if (caller.uid) {
		const interaction = await interactions.getLikeStatus(sid, caller.uid);
		result.liked = interaction.liked;
		result.favorited = interaction.favorited;
		result.hasDownloaded = interaction.hasDownloaded;
	}

	return result;
};

api.list = async function (caller, data) {
	const { page = 1, sort = 'recent', q } = data;
	const result = await scripts.listPublic({ page, sort, q });

	const scriptsWithInteraction = await Promise.all(result.scripts.map(async (script) => {
		const scriptData = { ...script };
		if (caller.uid) {
			const interaction = await interactions.getLikeStatus(script.sid, caller.uid);
			scriptData.liked = interaction.liked;
			scriptData.favorited = interaction.favorited;
			scriptData.hasDownloaded = interaction.hasDownloaded;
		}
		return scriptData;
	}));

	return {
		items: scriptsWithInteraction,
		page: result.page,
		pageCount: result.pageCount,
		total: result.total,
	};
};

api.listManage = async function (caller, data) {
	if (!caller.uid) {
		throw new Error('[[error:not-logged-in]]');
	}

	const { page = 1 } = data;
	const result = await scripts.listByOwner(caller.uid, { page, includeDeleted: false });
	return {
		items: result.scripts,
		page: result.page,
		pageCount: result.pageCount,
		total: result.total,
	};
};

api.like = async function (caller, { sid }) {
	if (!caller.uid) {
		throw new Error('[[error:not-logged-in]]');
	}

	const script = await scripts.getById(sid, { checkDeleted: true });
	if (!script) {
		throw new Error('[[error:not-found]]');
	}

	const canView = await scripts.canView(script, caller.uid);
	if (!canView) {
		throw new Error('[[error:no-privileges]]');
	}

	return await interactions.like(sid, caller.uid);
};

api.unlike = async function (caller, { sid }) {
	if (!caller.uid) {
		throw new Error('[[error:not-logged-in]]');
	}

	return await interactions.unlike(sid, caller.uid);
};

api.favorite = async function (caller, { sid }) {
	if (!caller.uid) {
		throw new Error('[[error:not-logged-in]]');
	}

	const script = await scripts.getById(sid, { checkDeleted: true });
	if (!script) {
		throw new Error('[[error:not-found]]');
	}

	const canView = await scripts.canView(script, caller.uid);
	if (!canView) {
		throw new Error('[[error:no-privileges]]');
	}

	return await interactions.favorite(sid, caller.uid);
};

api.unfavorite = async function (caller, { sid }) {
	if (!caller.uid) {
		throw new Error('[[error:not-logged-in]]');
	}

	return await interactions.unfavorite(sid, caller.uid);
};

api.listFavorites = async function (caller, data) {
	if (!caller.uid) {
		throw new Error('[[error:not-logged-in]]');
	}

	const { page = 1 } = data;
	const result = await scripts.listByFavorites(caller.uid, { page });

	return {
		items: result.scripts,
		page: result.page,
		pageCount: result.pageCount,
		total: result.total,
	};
};

api.download = async function (caller, { sid }) {
	const script = await scripts.getById(sid);
	if (!script) {
		throw new Error('[[error:not-found]]');
	}

	const canView = await scripts.canView(script, caller.uid);
	if (!canView) {
		throw new Error('[[error:no-privileges]]');
	}

	const result = await interactions.download(sid, caller ? caller.uid : null);
	return {
		content: result.content,
		downloads: result.downloads,
	};
};

api.listAdmin = async function (caller, data) {
	const isAdmin = await user.isAdminOrMod(caller.uid);
	if (!isAdmin) {
		throw new Error('[[error:no-privileges]]');
	}

	const { page = 1, q, uid, status, visibility } = data;

	let allSids = await db.getSortedSetRange('uid:0:scripts', 0, -1);
	if (!allSids || !allSids.length) {
		allSids = [];
	}

	const scripts = await scripts.getMultipleByIds(allSids);

	let filtered = scripts.filter(Boolean);

	if (q && q.trim()) {
		const query = q.toLowerCase().trim();
		filtered = filtered.filter(s =>
			s.title.toLowerCase().includes(query) ||
			s.description.toLowerCase().includes(query)
		);
	}

	if (uid) {
		filtered = filtered.filter(s => s.uid === uid);
	}

	if (status) {
		filtered = filtered.filter(s => s.status === status);
	}

	if (visibility) {
		filtered = filtered.filter(s => s.visibility === visibility);
	}

	const limit = 20;
	const start = (page - 1) * limit;
	const end = start + limit;
	const paged = filtered.slice(start, end);

	return {
		items: paged,
		page,
		pageCount: Math.ceil(filtered.length / limit),
		total: filtered.length,
	};
};

api.moderate = async function (caller, { sid, action, reason }) {
	const isAdmin = await user.isAdminOrMod(caller.uid);
	if (!isAdmin) {
		throw new Error('[[error:no-privileges]]');
	}

	return await moderation.moderate(sid, action, reason, caller.uid);
};

api.getAdminConfig = async function (caller) {
	const isAdmin = await user.isAdminOrMod(caller.uid);
	if (!isAdmin) {
		throw new Error('[[error:no-privileges]]');
	}

	return {
		scriptsTabVisibility: await scripts.getTabVisibility(),
		defaultScriptVisibility: await scripts.getDefaultVisibility(),
	};
};api.updateAdminConfig = async function (caller, data) {
	const isAdmin = await user.isAdminOrMod(caller.uid);
	if (!isAdmin) {
		throw new Error('[[error:no-privileges]]');
	}

	if (data.scriptsTabVisibility !== undefined) {
		await scripts.setConfig('scriptsTabVisibility', data.scriptsTabVisibility);
	}

	if (data.defaultScriptVisibility !== undefined) {
		await scripts.setConfig('defaultScriptVisibility', data.defaultScriptVisibility);
	}

	return { ok: true };
};

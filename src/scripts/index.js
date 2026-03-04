'use strict';

const _ = require('lodash');
const validator = require('validator');

const db = require('../database');
const plugins = require('../plugins');
const meta = require('../meta');

const Scripts = module.exports;

Scripts.PREFIX = {
	SCRIPT: 'script',
	USER_SCRIPTS: 'uid',
	PUBLIC_RECENT: 'scripts:public:recent',
	PUBLIC_HOT: 'scripts:public:hot',
	PUBLIC_DOWNLOADS: 'scripts:public:downloads',
	MODERATION: 'scripts:moderation:recent',
};

Scripts.STATUS = {
	ACTIVE: 'active',
	UNAVAILABLE: 'unavailable',
	DELETED: 'deleted',
};

Scripts.VISIBILITY = {
	PRIVATE: 'private',
	PUBLIC: 'public',
};

Scripts.SORT = {
	RECENT: 'recent',
	HOT: 'hot',
	DOWNLOADS: 'downloads',
};

const MAX_JSON_SIZE = 1024 * 1024;

async function generateSid() {
	const count = await db.incrObjectField('global', 'scriptCount');
	return `script_${Date.now()}_${count}`;
}

Scripts.create = async function (data) {
	const { uid, title, description, content, visibility } = data;
	const now = Date.now();

	if (!title || !title.trim()) {
		throw new Error('[[error:invalid-data]]');
	}
	if (!description || !description.trim()) {
		throw new Error('[[error:invalid-data]]');
	}

	let parsedContent;
	if (typeof content === 'string') {
		if (content.length > MAX_JSON_SIZE) {
			throw new Error('[[error:file-too-large]]');
		}
		try {
			parsedContent = JSON.parse(content);
			parsedContent = JSON.stringify(parsedContent);
		} catch (e) {
			throw new Error('[[error:invalid-json]]');
		}
	} else {
		parsedContent = '{}';
	}

	const defaultVisibility = await Scripts.getDefaultVisibility();
	const sid = await generateSid();
	const script = {
		sid,
		uid,
		title: title.trim(),
		description: description.trim(),
		content: parsedContent,
		visibility: visibility || defaultVisibility,
		status: Scripts.STATUS.ACTIVE,
		createdAt: now,
		updatedAt: now,
		downloads: 0,
		likes: 0,
		favorites: 0,
	};

	await db.setObject(Scripts.PREFIX.SCRIPT + `:${sid}`, script);
	await db.sortedSetAdd(`uid:${uid}:scripts`, now, sid);

	if (script.visibility === Scripts.VISIBILITY.PUBLIC) {
		await addToPublicLists(script);
	}

	const result = await plugins.hooks.fire('filter:script.create', { script });
	return result.script;
};

async function addToPublicLists(script) {
	await db.sortedSetAdd(Scripts.PREFIX.PUBLIC_RECENT, script.createdAt, script.sid);
	await db.sortedSetAdd(Scripts.PREFIX.PUBLIC_HOT, 0, script.sid);
	await db.sortedSetAdd(Scripts.PREFIX.PUBLIC_DOWNLOADS, 0, script.sid);
}

async function removeFromPublicLists(sid) {
	await db.sortedSetRemove(Scripts.PREFIX.PUBLIC_RECENT, sid);
	await db.sortedSetRemove(Scripts.PREFIX.PUBLIC_HOT, sid);
	await db.sortedSetRemove(Scripts.PREFIX.PUBLIC_DOWNLOADS, sid);
}

Scripts.update = async function (sid, data) {
	const script = await Scripts.getById(sid, { checkDeleted: true });
	if (!script) {
		throw new Error('[[error:not-found]]');
	}

	const updateData = {};
	if (data.title !== undefined) {
		if (!data.title || !data.title.trim()) {
			throw new Error('[[error:invalid-data]]');
		}
		updateData.title = data.title.trim();
	}
	if (data.description !== undefined) {
		if (!data.description || !data.description.trim()) {
			throw new Error('[[error:invalid-data]]');
		}
		updateData.description = data.description.trim();
	}
	if (data.content !== undefined) {
		if (typeof data.content === 'string') {
			if (data.content.length > MAX_JSON_SIZE) {
				throw new Error('[[error:file-too-large]]');
			}
			try {
				const parsed = JSON.parse(data.content);
				updateData.content = JSON.stringify(parsed);
			} catch (e) {
				throw new Error('[[error:invalid-json]]');
			}
		}
	}
	if (data.visibility !== undefined) {
		const oldVisibility = script.visibility;
		updateData.visibility = data.visibility;
		if (oldVisibility !== data.visibility && script.status === Scripts.STATUS.ACTIVE) {
			if (data.visibility === Scripts.VISIBILITY.PUBLIC) {
				await addToPublicLists(script);
			} else if (oldVisibility === Scripts.VISIBILITY.PUBLIC) {
				await removeFromPublicLists(sid);
			}
		}
	}

	updateData.updatedAt = Date.now();
	await db.setObject(Scripts.PREFIX.SCRIPT + `:${sid}`, updateData);

	if (data.visibility !== undefined && data.visibility !== script.visibility) {
		if (data.visibility === Scripts.VISIBILITY.PUBLIC) {
			await db.sortedSetAdd(`uid:${script.uid}:scripts`, updateData.updatedAt, sid);
		}
	}

	const updated = await Scripts.getById(sid);
	const result = await plugins.hooks.fire('filter:script.update', { script: updated });
	return result.script;
};

Scripts.remove = async function (sid, soft) {
	const script = await Scripts.getById(sid);
	if (!script) {
		return;
	}

	if (soft) {
		await Scripts.update(sid, { status: Scripts.STATUS.DELETED });
		await removeFromPublicLists(sid);
		await db.sortedSetRemove(`uid:${script.uid}:scripts`, sid);
	} else {
		await db.deleteObject(Scripts.PREFIX.SCRIPT + `:${sid}`);
		await removeFromPublicLists(sid);
		await db.sortedSetRemove(`uid:${script.uid}:scripts`, sid);
		await db.delete(`sid:${sid}:likes`);
		await db.delete(`sid:${sid}:favorites`);
		await db.delete(`sid:${sid}:downloads`);
		await db.delete(`sid:${sid}:moderation`);
	}

	await plugins.hooks.fire('action:script.delete', { sid, uid: script.uid, soft });
};

Scripts.getById = async function (sid, options) {
	const script = await db.getObject(Scripts.PREFIX.SCRIPT + `:${sid}`);
	if (!script) {
		return null;
	}
	const { checkDeleted, checkVisibility } = options || {};
	if (checkDeleted && script.status === Scripts.STATUS.DELETED) {
		return null;
	}
	if (checkVisibility && script.visibility === Scripts.VISIBILITY.PRIVATE) {
		return null;
	}
	return script;
};

Scripts.getByIdSilly = async function (sid) {
	return Scripts.getById(sid);
};

Scripts.getMultipleByIds = async function (sids) {
	if (!Array.isArray(sids) || !sids.length) {
		return [];
	}
	const scripts = await db.getObjects(sids.map(sid => Scripts.PREFIX.SCRIPT + `:${sid}`));
	return scripts.filter(Boolean);
};

Scripts.listPublic = async function (data) {
	const { page = 1, limit = 20, sort = Scripts.SORT.RECENT, q } = data;
	const start = (page - 1) * limit;
	const end = start + limit - 1;

	let setKey = Scripts.PREFIX.PUBLIC_RECENT;
	if (sort === Scripts.SORT.HOT) {
		setKey = Scripts.PREFIX.PUBLIC_HOT;
	} else if (sort === Scripts.SORT.DOWNLOADS) {
		setKey = Scripts.PREFIX.PUBLIC_DOWNLOADS;
	}

	let sids;
	if (q && q.trim()) {
		const query = q.toLowerCase().trim();
		const allSids = await db.getSortedSetRange(setKey, 0, -1);
		const scripts = await Scripts.getMultipleByIds(allSids);
		const filtered = scripts.filter(s => s &&
			s.status === Scripts.STATUS.ACTIVE &&
			s.visibility === Scripts.VISIBILITY.PUBLIC &&
			(s.title.toLowerCase().includes(query) || s.description.toLowerCase().includes(query))
		);
		sids = filtered.slice(start, end + 1).map(s => s.sid);
	} else {
		sids = await db.getSortedSetRange(setKey, start, end);
	}

	const scripts = await Scripts.getMultipleByIds(sids);
	const filtered = scripts.filter(s => s &&
		s.status === Scripts.STATUS.ACTIVE &&
		s.visibility === Scripts.VISIBILITY.PUBLIC
	);

	const total = await db.sortedSetCard(setKey);

	return {
		scripts: filtered,
		page,
		pageCount: Math.ceil(total / limit),
		total,
	};
};

Scripts.listByOwner = async function (uid, options = {}) {
	const { page = 1, limit = 20, includeDeleted = false } = options;
	const start = (page - 1) * limit;
	const end = start + limit - 1;

	let sids = await db.getSortedSetRange(`uid:${uid}:scripts`, start, end);
	if (!includeDeleted) {
		const scripts = await Scripts.getMultipleByIds(sids);
		sids = scripts.filter(s => s && s.status !== Scripts.STATUS.DELETED).map(s => s.sid);
	}

	const scripts = await Scripts.getMultipleByIds(sids);
	const total = await db.sortedSetCard(`uid:${uid}:scripts`);

	return {
		scripts: scripts.filter(Boolean),
		page,
		pageCount: Math.ceil(total / limit),
		total,
	};
};

Scripts.listByFavorites = async function (uid, options = {}) {
	const { page = 1, limit = 20 } = options;
	const start = (page - 1) * limit;
	const end = start + limit - 1;

	const sids = await db.getSortedSetRange(`uid:${uid}:favorites`, start, end);
	const scripts = await Scripts.getMultipleByIds(sids);
	const total = await db.sortedSetCard(`uid:${uid}:favorites`);

	return {
		scripts: scripts.filter(Boolean),
		page,
		pageCount: Math.ceil(total / limit),
		total,
	};
};

Scripts.canView = async function (script, uid) {
	if (script.status === Scripts.STATUS.DELETED) {
		return false;
	}
	if (script.visibility === Scripts.VISIBILITY.PUBLIC) {
		if (script.status === Scripts.STATUS.ACTIVE) {
			return true;
		}
		if (uid) {
			const isAdmin = await require('../user').isAdminOrMod(uid);
			if (isAdmin) {
				return true;
			}
		}
		return false;
	}
	if (!uid) {
		return false;
	}
	if (script.uid === uid) {
		return true;
	}
	const isAdmin = await require('../user').isAdminOrMod(uid);
	return isAdmin;
};

Scripts.canEdit = async function (script, uid) {
	if (!uid) {
		return false;
	}
	if (script.uid === uid) {
		return true;
	}
	const isAdmin = await require('../user').isAdminOrMod(uid);
	return isAdmin;
};

Scripts.canModerate = async function (uid) {
	if (!uid) {
		return false;
	}
	return await require('../user').isAdminOrMod(uid);
};

Scripts.getDefaultVisibility = async function () {
	const value = meta.config.get('defaultScriptVisibility');
	return value || Scripts.VISIBILITY.PUBLIC;
};

Scripts.getTabVisibility = async function () {
	const value = meta.config.get('scriptsTabVisibility');
	return value || 'public';
};

Scripts.setConfig = async function (key, value) {
	await meta.config.set(key, value);
};

Scripts.getConfig = async function (key) {
	return meta.config.get(key);
};

Scripts.search = async function (query) {
	const allSids = await db.getSortedSetRange(Scripts.PREFIX.PUBLIC_RECENT, 0, -1);
	const scripts = await Scripts.getMultipleByIds(allSids);
	const q = query.toLowerCase().trim();
	return scripts.filter(s => s &&
		s.status === Scripts.STATUS.ACTIVE &&
		s.visibility === Scripts.VISIBILITY.PUBLIC &&
		(s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))
	);
};

Scripts.updateHotScore = async function (sid) {
	const script = await Scripts.getById(sid);
	if (!script || script.visibility !== Scripts.VISIBILITY.PUBLIC || script.status !== Scripts.STATUS.ACTIVE) {
		return;
	}
	const hotScore = (script.likes || 0) + (script.favorites || 0);
	await db.sortedSetAdd(Scripts.PREFIX.PUBLIC_HOT, hotScore, sid);
};

Scripts.updateDownloadScore = async function (sid) {
	const script = await Scripts.getById(sid);
	if (!script || script.visibility !== Scripts.VISIBILITY.PUBLIC || script.status !== Scripts.STATUS.ACTIVE) {
		return;
	}
	await db.sortedSetAdd(Scripts.PREFIX.PUBLIC_DOWNLOADS, script.downloads || 0, sid);
};

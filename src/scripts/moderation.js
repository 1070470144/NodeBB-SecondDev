'use strict';

const db = require('../database');
const scripts = require('./index');

const Moderation = module.exports;

Moderation.PREFIX = {
	MODERATION: 'script:{sid}:moderation',
};

Moderation.ACTIONS = {
	DISABLE: 'disable',
	ENABLE: 'enable',
	DELETE: 'delete',
	RESTORE: 'restore',
};

Moderation.moderate = async function (sid, action, reason, operatorUid) {
	const script = await scripts.getById(sid);
	if (!script) {
		throw new Error('[[error:not-found]]');
	}

	const now = Date.now();
	const moderationId = `${now}_${operatorUid}`;

	const moderationRecord = {
		id: moderationId,
		sid,
		action,
		reason: reason || '',
		operatorUid,
		createdAt: now,
	};

	const modKey = Moderation.PREFIX.MODERATION.replace('{sid}', sid);
	await db.sortedSetAdd(modKey, now, moderationId);
	await db.setObject(`script:${sid}:mod:${moderationId}`, moderationRecord);
	await db.sortedSetAdd(scripts.PREFIX.MODERATION, now, moderationId);

	switch (action) {
		case Moderation.ACTIONS.DISABLE:
			await scripts.update(sid, { status: scripts.STATUS.UNAVAILABLE });
			break;
		case Moderation.ACTIONS.ENABLE:
			await scripts.update(sid, { status: scripts.STATUS.ACTIVE });
			break;
		case Moderation.ACTIONS.DELETE:
			await scripts.update(sid, { status: scripts.STATUS.DELETED });
			break;
		case Moderation.ACTIONS.RESTORE:
			await scripts.update(sid, { status: scripts.STATUS.ACTIVE });
			break;
	}

	await scripts.updateHotScore(sid);

	await plugins.hooks.fire('action:script.moderate', {
		sid,
		action,
		reason,
		operatorUid,
	});

	return { ok: true, status: (await scripts.getById(sid)).status };
};

Moderation.getRecentActions = async function (options = {}) {
	const { limit = 20, start = 0 } = options;
	const end = start + limit - 1;

	const moderationIds = await db.getSortedSetRange(scripts.PREFIX.MODERATION, start, end);
	const records = [];

	for (const modId of moderationIds) {
		const record = await db.getObject(`script:${modId.split('_')[1]}:mod:${modId}`);
		if (record) {
			records.push(record);
		}
	}

	return records;
};

Moderation.getScriptModerationHistory = async function (sid) {
	const modKey = Moderation.PREFIX.MODERATION.replace('{sid}', sid);
	const moderationIds = await db.getSortedSetRange(modKey, 0, -1);
	const records = [];

	for (const modId of moderationIds) {
		const record = await db.getObject(`script:${sid}:mod:${modId}`);
		if (record) {
			records.push(record);
		}
	}

	return records;
};

const plugins = require('../plugins');

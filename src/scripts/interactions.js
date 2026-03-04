'use strict';

const db = require('../database');
const scripts = require('./index');

const Interactions = module.exports;

Interactions.PREFIX = {
	LIKES: 'sid:{sid}:likes',
	FAVORITES: 'sid:{sid}:favorites',
	DOWNLOADS: 'sid:{sid}:downloads',
};

Interactions.hasLiked = async function (sid, uid) {
	if (!uid) {
		return false;
	}
	return await db.isSetMember(Interactions.PREFIX.LIKES.replace('{sid}', sid), uid);
};

Interactions.hasFavorited = async function (sid, uid) {
	if (!uid) {
		return false;
	}
	return await db.isSetMember(Interactions.PREFIX.FAVORITES.replace('{sid}', sid), uid);
};

Interactions.hasDownloaded = async function (sid, uid) {
	if (!uid) {
		return false;
	}
	return await db.isSetMember(Interactions.PREFIX.DOWNLOADS.replace('{sid}', sid), uid);
};

Interactions.like = async function (sid, uid) {
	const script = await scripts.getById(sid, { checkDeleted: true });
	if (!script) {
		throw new Error('[[error:not-found]]');
	}

	const hasLiked = await Interactions.hasLiked(sid, uid);
	if (hasLiked) {
		return { liked: false, likes: script.likes };
	}

	const key = Interactions.PREFIX.LIKES.replace('{sid}', sid);
	await db.setAdd(key, uid);
	await db.incrObjectField(scripts.PREFIX.SCRIPT + `:${sid}`, 'likes');

	const newCount = await db.getObjectField(scripts.PREFIX.SCRIPT + `:${sid}`, 'likes');
	await scripts.updateHotScore(sid);

	const result = await db.isSetMember(key, uid);
	return { liked: result, likes: newCount };
};

Interactions.unlike = async function (sid, uid) {
	const script = await scripts.getById(sid);
	if (!script) {
		throw new Error('[[error:not-found]]');
	}

	const hasLiked = await Interactions.hasLiked(sid, uid);
	if (!hasLiked) {
		return { liked: true, likes: script.likes };
	}

	const key = Interactions.PREFIX.LIKES.replace('{sid}', sid);
	await db.setRemove(key, uid);
	await db.decrObjectField(scripts.PREFIX.SCRIPT + `:${sid}`, 'likes');

	const newCount = await db.getObjectField(scripts.PREFIX.SCRIPT + `:${sid}`, 'likes');
	await scripts.updateHotScore(sid);

	const result = await db.isSetMember(key, uid);
	return { liked: result, likes: newCount };
};

Interactions.favorite = async function (sid, uid) {
	const script = await scripts.getById(sid, { checkDeleted: true });
	if (!script) {
		throw new Error('[[error:not-found]]');
	}

	const hasFavorited = await Interactions.hasFavorited(sid, uid);
	if (hasFavorited) {
		return { favorited: false, favorites: script.favorites };
	}

	const key = Interactions.PREFIX.FAVORITES.replace('{sid}', sid);
	await db.setAdd(key, uid);
	await db.incrObjectField(scripts.PREFIX.SCRIPT + `:${sid}`, 'favorites');

	const userFavKey = `uid:${uid}:favorites`;
	await db.sortedSetAdd(userFavKey, Date.now(), sid);

	const newCount = await db.getObjectField(scripts.PREFIX.SCRIPT + `:${sid}`, 'favorites');
	await scripts.updateHotScore(sid);

	const result = await db.isSetMember(key, uid);
	return { favorited: result, favorites: newCount };
};

Interactions.unfavorite = async function (sid, uid) {
	const script = await scripts.getById(sid);
	if (!script) {
		throw new Error('[[error:not-found]]');
	}

	const hasFavorited = await Interactions.hasFavorited(sid, uid);
	if (!hasFavorited) {
		return { favorited: true, favorites: script.favorites };
	}

	const key = Interactions.PREFIX.FAVORITES.replace('{sid}', sid);
	await db.setRemove(key, uid);
	await db.decrObjectField(scripts.PREFIX.SCRIPT + `:${sid}`, 'favorites');

	const userFavKey = `uid:${uid}:favorites`;
	await db.sortedSetRemove(userFavKey, sid);

	const newCount = await db.getObjectField(scripts.PREFIX.SCRIPT + `:${sid}`, 'favorites');
	await scripts.updateHotScore(sid);

	const result = await db.isSetMember(key, uid);
	return { favorited: result, favorites: newCount };
};

Interactions.download = async function (sid, uid) {
	const script = await scripts.getById(sid);
	if (!script) {
		throw new Error('[[error:not-found]]');
	}

	if (script.status !== scripts.STATUS.ACTIVE) {
		throw new Error('[[error:invalid-data]]');
	}

	if (!uid) {
		return {
			content: script.content,
			downloads: script.downloads,
		};
	}

	const hasDownloaded = await Interactions.hasDownloaded(sid, uid);
	if (!hasDownloaded) {
		const key = Interactions.PREFIX.DOWNLOADS.replace('{sid}', sid);
		await db.setAdd(key, uid);
		await db.incrObjectField(scripts.PREFIX.SCRIPT + `:${sid}`, 'downloads');

		await scripts.updateDownloadScore(sid);
	}

	const updatedScript = await scripts.getById(sid);
	return {
		content: script.content,
		downloads: updatedScript.downloads,
	};
};

Interactions.getLikeStatus = async function (sid, uid) {
	return {
		liked: await Interactions.hasLiked(sid, uid),
		favorited: await Interactions.hasFavorited(sid, uid),
		hasDownloaded: await Interactions.hasDownloaded(sid, uid),
	};
};

Interactions.getCounts = async function (sid) {
	const script = await scripts.getById(sid);
	return {
		likes: script ? script.likes : 0,
		favorites: script ? script.favorites : 0,
		downloads: script ? script.downloads : 0,
	};
};

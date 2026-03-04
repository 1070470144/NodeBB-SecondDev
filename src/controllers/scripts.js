'use strict';

const scripts = require('../scripts');
const interactions = require('../scripts/interactions');

const controllers = module.exports;

const helpers = require('../controllers/helpers');

controllers.upload = async function (req, res) {
	helpers.notAllowedIfNotLoggedIn(req, res);
	const scriptsConfig = {
		defaultVisibility: await scripts.getDefaultVisibility(),
	};
	res.render('scripts-upload', {
		scriptsConfig,
	});
};

controllers.manage = async function (req, res) {
	helpers.notAllowedIfNotLoggedIn(req, res);
	const uid = req.uid;
	const result = await scripts.listByOwner(uid);
	res.render('scripts-manage', {
		scripts: result.scripts,
		page: result.page,
		pageCount: result.pageCount,
		total: result.total,
	});
};

controllers.favorites = async function (req, res) {
	helpers.notAllowedIfNotLoggedIn(req, res);
	const uid = req.uid;
	const result = await scripts.listByFavorites(uid);
	res.render('scripts-favorites', {
		scripts: result.scripts,
		page: result.page,
		pageCount: result.pageCount,
		total: result.total,
	});
};

controllers.list = async function (req, res) {
	const tabVisibility = await scripts.getTabVisibility();
	const isGuest = !req.uid;

	if (tabVisibility === 'hidden' && !req.uid) {
		return helpers.notAllowed(req, res);
	}
	if (tabVisibility === 'registered' && isGuest) {
		return helpers.notAllowed(req, res);
	}

	const { page = 1, sort = 'recent', q } = req.query;
	const result = await scripts.listPublic({ page: parseInt(page, 10) || 1, sort, q });

	const scriptsWithInteraction = await Promise.all(result.scripts.map(async (script) => {
		const scriptData = { ...script };
		if (req.uid) {
			const interaction = await interactions.getLikeStatus(script.sid, req.uid);
			scriptData.liked = interaction.liked;
			scriptData.favorited = interaction.favorited;
			scriptData.hasDownloaded = interaction.hasDownloaded;
		}
		return scriptData;
	}));

	res.render('scripts', {
		scripts: scriptsWithInteraction,
		page: result.page,
		pageCount: result.pageCount,
		total: result.total,
		sort,
		q,
	});
};

controllers.detail = async function (req, res) {
	const { sid } = req.params;
	const script = await scripts.getById(sid);
	if (!script) {
		return helpers.notFound(req, res);
	}

	const canView = await scripts.canView(script, req.uid);
	if (!canView) {
		return helpers.notAllowed(req, res);
	}

	const showContent = await scripts.canView(script, req.uid);
	const scriptData = { ...script };
	if (!showContent) {
		delete scriptData.content;
	}

	if (req.uid) {
		const interaction = await interactions.getLikeStatus(sid, req.uid);
		scriptData.liked = interaction.liked;
		scriptData.favorited = interaction.favorited;
		scriptData.hasDownloaded = interaction.hasDownloaded;
	}

	res.render('script', {
		script: scriptData,
		showContent,
	});
};

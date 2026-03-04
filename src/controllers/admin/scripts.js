'use strict';

const scripts = require('../../scripts');
const scriptsApi = require('../../api/scripts');

const controllers = module.exports;

const helpers = require('../helpers');

controllers.list = async function (req, res) {
	const { page = 1, q, uid, status, visibility } = req.query;
	const result = await scriptsApi.listAdmin({
		page: parseInt(page, 10) || 1,
		q,
		uid: uid ? parseInt(uid, 10) : null,
		status,
		visibility,
	});

	res.render('admin/scripts', {
		scripts: result.scripts,
		page: result.page,
		pageCount: result.pageCount,
		total: result.total,
		q,
		uid,
		status,
		visibility,
	});
};

controllers.config = async function (req, res) {
	const tabVisibility = await scripts.getTabVisibility();
	const defaultVisibility = await scripts.getDefaultVisibility();

	res.render('admin/scripts-config', {
		tabVisibility,
		defaultVisibility,
	});
};

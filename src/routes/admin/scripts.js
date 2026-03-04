'use strict';

const helpers = require('../helpers');

// 预留：如需拆分 admin 路由，可由 src/routes/admin.js 调用本模块

module.exports = function (app, name, middleware, controllers) {
	const middlewares = [middleware.pluginHooks];

	helpers.setupAdminPageRoute(app, `/${name}/scripts`, middlewares, controllers.admin.scripts.list);
	helpers.setupAdminPageRoute(app, `/${name}/scripts/config`, middlewares, controllers.admin.scripts.config);
};


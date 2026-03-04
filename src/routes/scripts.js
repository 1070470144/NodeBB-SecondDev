'use strict';

const helpers = require('./helpers');

// 占位：具体路由挂载规则将在基础能力阶段接入到主 router

module.exports = function (app, name, middleware, controllers) {
	const middlewares = [];

	helpers.setupPageRoute(app, '/scripts', middlewares, controllers.scripts.list);
	helpers.setupPageRoute(app, '/scripts/upload', middlewares, controllers.scripts.upload);
	helpers.setupPageRoute(app, '/scripts/manage', middlewares, controllers.scripts.manage);
	helpers.setupPageRoute(app, '/scripts/favorites', middlewares, controllers.scripts.favorites);
	helpers.setupPageRoute(app, '/scripts/:sid', middlewares, controllers.scripts.detail);
};


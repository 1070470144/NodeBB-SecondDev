'use strict';

const express = require('express');

const uploadsController = require('../controllers/uploads');
const helpers = require('./helpers');

module.exports = function (app, middleware, controllers) {
	const middlewares = [middleware.autoLocale, middleware.authenticateRequest];
	const router = express.Router();
	app.use('/api', router);

	router.get('/config', [...middlewares, middleware.applyCSRF], helpers.tryRoute(controllers.api.getConfig));

	router.get('/self', [...middlewares], helpers.tryRoute(controllers.user.getCurrentUser));
	router.get('/user/uid/:uid', [...middlewares, middleware.canViewUsers], helpers.tryRoute(controllers.user.getUserByUID));
	router.get('/user/username/:username', [...middlewares, middleware.canViewUsers], helpers.tryRoute(controllers.user.getUserByUsername));
	router.get('/user/email/:email', [...middlewares, middleware.canViewUsers], helpers.tryRoute(controllers.user.getUserByEmail));

	router.get('/categories/:cid/moderators', [...middlewares], helpers.tryRoute(controllers.api.getModerators));
	router.get('/recent/posts/:term?', [...middlewares], helpers.tryRoute(controllers.posts.getRecentPosts));
	router.get('/unread/total', [...middlewares, middleware.ensureLoggedIn], helpers.tryRoute(controllers.unread.unreadTotal));
	router.get('/topic/teaser/:topic_id', [...middlewares], helpers.tryRoute(controllers.topics.teaser));
	router.get('/topic/pagination/:topic_id', [...middlewares], helpers.tryRoute(controllers.topics.pagination));

	const upload = require('../middleware/multer');

	const postMiddlewares = [
		middleware.maintenanceMode,
		upload.array('files[]', 20),
		middleware.validateFiles,
		middleware.uploads.ratelimit,
		middleware.applyCSRF,
	];

	router.post('/post/upload', postMiddlewares, helpers.tryRoute(uploadsController.uploadPost));
	router.post('/topic/thumb/upload', postMiddlewares, helpers.tryRoute(uploadsController.uploadThumb));
	router.post('/user/:userslug/uploadpicture', [
		...middlewares,
		...postMiddlewares,
		middleware.exposeUid,
		middleware.ensureLoggedIn,
		middleware.canViewUsers,
		middleware.checkAccountPermissions,
	], helpers.tryRoute(controllers.accounts.edit.uploadPicture));

	const scriptsAPI = require('../api/scripts');
	router.get('/scripts', [...middlewares], helpers.tryRoute(scriptsAPI.list));
	router.get('/scripts/favorites', [...middlewares, middleware.ensureLoggedIn], helpers.tryRoute(scriptsAPI.listFavorites));
	router.get('/scripts/manage', [...middlewares, middleware.ensureLoggedIn], helpers.tryRoute(scriptsAPI.listManage));
	router.get('/scripts/:sid', [...middlewares], helpers.tryRoute(scriptsAPI.get));
	router.post('/scripts', [...middlewares, middleware.ensureLoggedIn, middleware.applyCSRF], helpers.tryRoute(scriptsAPI.create));
	router.put('/scripts/:sid', [...middlewares, middleware.ensureLoggedIn, middleware.applyCSRF], helpers.tryRoute(scriptsAPI.update));
	router.delete('/scripts/:sid', [...middlewares, middleware.ensureLoggedIn, middleware.applyCSRF], helpers.tryRoute(scriptsAPI.remove));
	router.post('/scripts/:sid/like', [...middlewares, middleware.ensureLoggedIn, middleware.applyCSRF], helpers.tryRoute(scriptsAPI.like));
	router.delete('/scripts/:sid/like', [...middlewares, middleware.ensureLoggedIn, middleware.applyCSRF], helpers.tryRoute(scriptsAPI.unlike));
	router.post('/scripts/:sid/favorite', [...middlewares, middleware.ensureLoggedIn, middleware.applyCSRF], helpers.tryRoute(scriptsAPI.favorite));
	router.delete('/scripts/:sid/favorite', [...middlewares, middleware.ensureLoggedIn, middleware.applyCSRF], helpers.tryRoute(scriptsAPI.unfavorite));
	router.post('/scripts/:sid/download', [...middlewares], helpers.tryRoute(scriptsAPI.download));

	router.get('/admin/scripts', [...middlewares, middleware.ensureLoggedIn], helpers.tryRoute(scriptsAPI.listAdmin));
	router.post('/admin/scripts/:sid/moderate', [...middlewares, middleware.ensureLoggedIn, middleware.applyCSRF], helpers.tryRoute(scriptsAPI.moderate));
	router.get('/admin/scripts/config', [...middlewares, middleware.ensureLoggedIn], helpers.tryRoute(scriptsAPI.getAdminConfig));
	router.put('/admin/scripts/config', [...middlewares, middleware.ensureLoggedIn, middleware.applyCSRF], helpers.tryRoute(scriptsAPI.updateAdminConfig));
};

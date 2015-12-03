'use strict';

var _ = require('arrowjs')._,
    Promise = require('arrowjs').Promise;

module.exports = function (controller, component, app) {
    controller.index = function (req, res) {
        var data = [];
        var selected_version_id = 0;

        var conditions = {is_current: true};

        if (req.params.version) {
            conditions = {alias: req.params.version};
        }

        // Get selected version
        Promise.all([
            // Get all versions
            app.models.version.findAll({
                order: 'id ASC'
            }),

            // Get selected version
            app.models.version.find({
                attributes: ['id', 'name', 'alias'],
                where: [conditions]
            })
        ]).then(function (result) {
            res.locals.versions = result[0];
            res.locals.version = result[1];

            selected_version_id = result[1].id;

            // Get sections of current version
            return app.models.section.findAll({
                attributes: ['id', 'title', 'alias'],
                where: {
                    version_id: selected_version_id
                },
                order: 'ordering ASC'
            });
        }).then(function (sections) {
            var promises = [];
            sections.forEach(function (section, i) {
                // Get apis of sections
                promises.push(app.models.api.findAll({
                    attributes: ['id', 'title', 'alias'],
                    where: {
                        section_id: section.id,
                        published: 1
                    }
                }).then(function (apis) {
                    section.apis = apis;
                    data[i] = section;
                }));
            });

            return Promise.all(promises);
        }).then(function () {
            // Get selected section
            return app.models.section.find({
                where: {
                    alias: req.params.section,
                    version_id: selected_version_id
                }
            });
        }).then(function (section) {
            // Get selected api
            return app.models.api.find({
                where: {
                    alias: req.params.api,
                    section_id: section.id
                }
            });
        }).then(function (api) {
            if (api) {
                res.frontend.render('index', {
                    title: api.title,
                    data: data,
                    api: api
                });
            } else {
                // Redirect to 404 if doc not exist
                res.render404(req, res);
            }
        }).catch(function (error) {
            console.log(error);
            res.redirect('/');
        });
    };

    controller.defaultIndex = function (req, res) {
        var data = [];

        var conditions = {is_current: true};
        if (req.params.version) {
            conditions = {alias: req.params.version, published: 1};
        }

        Promise.all([
            // Get all published versions
            app.models.version.findAll({
                where: {
                    published: 1
                },
                order: 'id ASC'
            }),

            // Get selected version
            app.models.version.find({
                attributes: ['id', 'name', 'alias'],
                where: [conditions]
            })
        ]).then(function (result) {
            res.locals.versions = result[0];
            res.locals.version = result[1];

            // Get sections of current version
            return app.models.section.findAll({
                attributes: ['id', 'title', 'alias'],
                where: {
                    version_id: result[1].id
                },
                order: 'ordering ASC'
            });
        }).then(function (sections) {
            var promises = [];

            sections.forEach(function (section, i) {
                // Get apis of sections
                promises.push(app.models.api.findAll({
                    attributes: ['id', 'title', 'alias'],
                    where: {
                        section_id: section.id,
                        published: 1
                    }
                }).then(function (apis) {
                    section.apis = apis;
                    data[i] = section;
                }));
            });

            return Promise.all(promises);
        }).then(function () {
            res.frontend.render('default', {
                title: "Documentation",
                data: data
            });
        }).catch(function (error) {
            console.log(error);
            res.frontend.render('_404');
        });
    };
}
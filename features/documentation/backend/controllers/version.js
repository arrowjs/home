'use strict';

var slug = require('slug');
slug.defaults.modes['pretty'] = {
    replacement: '-',
    symbols: true,
    remove: null,
    charmap: slug.charmap,
    multicharmap: slug.multicharmap
};

var Promise = require('arrowjs').Promise;
let route = 'documentation';

var breadcrumb =
    [
        {
            title: 'Home',
            icon: 'fa fa-dashboard',
            href: '/admin/'
        },
        {
            title: 'Documentation',
            href: '/admin/documentation/'
        },
        {
            title: 'All Versions',
            href: '/admin/documentation/version/'
        }
    ];
module.exports = function (controller,component,app) {
    controller.index = function (req, res) {
        // Create breadcrumb
        //res.locals.breadcrumb = __.createBreadcrumb(breadcrumb);

        // Add buttons
        //res.locals.createButton = __acl.addButton(req, route, 'version_create', '/admin/documentation/versions/create/');
        //res.locals.deleteButton = __acl.addButton(req, route, 'version_delete');

        // Get current page and default sorting
        var page = req.params.page || 1;
        var column = req.params.sort || 'id';
        var order = req.params.order || 'desc';
        //res.locals.root_link = '/admin/documentation/versions/page/' + page + '/sort';

        // Create filter
        var filter = __.createFilter(req, res, route, '/admin/documentation/versions', column, order, [
            {
                column: "id",
                width: '1%',
                header: "",
                type: 'checkbox'
            },
            {
                column: "name",
                width: '25%',
                header: "Name",
                link: '/admin/documentation/versions/edit/{id}',
                acl: 'documentation.version_edit',
                filter: {
                    data_type: 'string'
                }
            },
            {
                column: "alias",
                width: '25%',
                header: "Slug",
                filter: {
                    data_type: 'string'
                }
            },
            {
                column: "description",
                width: '25%',
                header: "Description",
                filter: {
                    data_type: 'string'
                }
            },
            {
                column: "published",
                width: '10%',
                header: "Status",
                type: 'custom',
                alias: {
                    "1": "Publish",
                    "0": "Unpublish"
                },
                filter: {
                    model: 'version',
                    type: 'select',
                    filter_key: 'published',
                    data_source: [
                        {
                            name: "Publish",
                            value: '1'
                        },
                        {
                            name: "Unpublish",
                            value: '0'
                        }
                    ],
                    display_key: 'name',
                    value_key: 'value'
                }
            },
            {
                column: "is_current",
                width: '10%',
                header: "Current Version",
                type: 'custom',
                alias: {
                    "1": '<div class="text-center"><i class="fa fa-check-circle" style="color:green; font-size: 18px;"></i></div>',
                    "0": ""
                },
                filter: {
                    data_type: 'string'
                }
            }
        ]);

        // Find all versions
        __models.version.findAndCountAll({
            where: filter.values,
            order: column + " " + order,
            limit: __config.pagination.number_item,
            offset: (page - 1) * __config.pagination.number_item
        }).then(function (results) {
            var totalPage = Math.ceil(results.count / __config.pagination.number_item);

            // Render view
            res.render(req, res, 'version/index', {
                title: "All Versions",
                totalPage: totalPage,
                items: results.rows,
                currentPage: page
            });
        }).catch(function (error) {
            req.flash.error('Name: ' + error.name + '<br />' + 'Message: ' + error.message);

            // Render view
            res.render(req, res, 'version/index', {
                title: "All Versions",
                totalPage: 1,
                items: null,
                currentPage: 1
            });
        });
    };

    controller.create = function (req, res) {
        res.locals.breadcrumb = __.createBreadcrumb(breadcrumb, {title: 'Create Version'});
        res.locals.saveButton = __acl.addButton(req, route, 'version_create');
        res.locals.backButton = "/admin/documentation/versions/";

        // Render view
        res.render(req, res, 'version/new');
    };

    controller.saveCreate = function (req, res) {
        // Get post data
        var data = req.body;

        if (data.published == 0 && data.is_current == 1) {
            req.flash.error('Cannot unpublish current version');

            res.locals.breadcrumb = __.createBreadcrumb(breadcrumb, {title: 'Create Version'});
            res.locals.saveButton = __acl.addButton(req, route, 'version_create');
            res.locals.backButton = "/admin/documentation/versions/";

            return res.render(req, res, 'version/new', {
                version: data
            });
        }

        // Set author
        data.created_at = new Date().getTime();
        data.created_by = req.user.id;

        // Generate alias
        if (data.alias == '') {
            data.alias = slug(data.name.toLowerCase());
        } else {
            data.alias = slug(data.alias.toLowerCase());
        }

        var new_version_id = 0;

        var prom = Promise.all([
            // Find current version
            __models.version.find({
                where: {
                    is_current: true
                }
            }),

            // Create version
            __models.version.create(data)
        ]).then(function (result) {
            // Get id of created version
            new_version_id = result[1].id;

            // Reset current version if is_current was selected
            if (data.is_current == 1) {
                __models.sequelize.query("UPDATE version SET is_current = false WHERE id != " + new_version_id);
            }

            // If this is first version
            if (result[0] == null) {
                req.flash.success("Add new version successfully");

                // Redirect to edit page
                res.redirect('/admin/documentation/versions/edit/' + new_version_id);

                return prom.cancel();
            } else {
                // If this is not the first version, find sections of current version to clone
                return __models.section.findAll({
                    where: {
                        version_id: result[0].id
                    },
                    order: 'ordering ASC'
                });
            }
        }).then(function (sections) {
            var promises = [];

            // Clone sections
            sections.forEach(function (value, index) {
                var data = {
                    title: value.title,
                    alias: value.alias,
                    description: value.description,
                    ordering: value.ordering,
                    published: value.published,
                    version_id: new_version_id,
                    created_by: req.user.id
                };
                promises.push(__models.section.create(data));

                // Find apis of clone sections to clone
                promises.push(__models.api.findAll({
                    where: {
                        section_id: value.id
                    }
                }));
            });

            return Promise.all(promises);
        }).then(function (result) {
            // Clone apis
            var section_id = 0;
            var promises = [];
            result.forEach(function (val, i) {
                if (!Array.isArray(result[i])) {
                    section_id = val.id;
                } else {
                    val.forEach(function (value, index) {
                        var data = {
                            title: value.title,
                            alias: value.alias,
                            markdown: value.markdown,
                            html: value.html,
                            published: value.published,
                            ordering: value.ordering,
                            published_at: value.published_at,
                            section_id: section_id,
                            created_by: req.user.id
                        };
                        promises.push(__models.api.create(data));
                    });
                }
            });

            return Promise.all(promises);
        }).then(function () {
            req.flash.success("Add new version successfully");

            // Redirect to edit page
            res.redirect('/admin/documentation/versions/edit/' + new_version_id);
        }).catch(function (error) {
            if (error.name == 'SequelizeUniqueConstraintError') {
                req.flash.error('Duplicate Version Name');
            } else {
                req.flash.error('Name: ' + error.name + '<br />' + 'Message: ' + error.message);
            }

            // Re-render create page
            res.locals.breadcrumb = __.createBreadcrumb(breadcrumb, {title: 'Create Version'});
            res.locals.saveButton = __acl.addButton(req, route, 'version_create');
            res.locals.backButton = "/admin/documentation/versions/";
            res.render(req, res, 'version/new', {
                version: data
            });
        });
    };

    controller.edit = function (req, res) {
        // Create breadcrumb
        res.locals.breadcrumb = __.createBreadcrumb(breadcrumb, {title: 'Update Version'});

        // Add buttons
        res.locals.saveButton = __acl.addButton(req, route, 'version_edit');
        res.locals.backButton = "/admin/documentation/versions/";

        // Find version by id
        app.models.version.findById(req.params.cid).then(function (version) {
            // Render view
            res.render(req, res, 'version/new', {
                version: version
            });
        }).catch(function (error) {
            req.flash.error('Name: ' + error.name + '<br />' + 'Message: ' + error.message);

            // Redirect to index page if has error
            res.redirect('/admin/documentation/versions/');
        });
    };

    controller.saveEdit = function (req, res) {
        // Get post data
        var data = req.body;

        if (data.published == 0 && data.is_current == 1) {
            req.flash.error('Cannot unpublish current version');

            res.locals.breadcrumb = __.createBreadcrumb(breadcrumb, {title: 'Update Version'});
            res.locals.saveButton = __acl.addButton(req, route, 'version_edit');
            res.locals.backButton = "/admin/documentation/versions/";

            return res.render(req, res, 'version/new', {
                version: data
            });
        }

        // Find version by id
        app.models.version.findById(req.params.cid).then(function (version) {
            // Save Editor
            data.modified_at = new Date().getTime();
            data.modified_by = req.user.id;

            // Generate alias
            if (data.alias == '') {
                data.alias = slug(data.name.toLowerCase());
            } else {
                data.alias = slug(data.alias.toLowerCase());
            }

            // Update version
            return version.updateAttributes(data);
        }).then(function (version) {
            // Reset current version if is_current was selected
            if (version.is_current == 1) {
                app.models.sequelize.query("UPDATE version SET is_current = false WHERE id != " + version.id);
            }

            req.flash.success("Update version successfully");

            // Redirect to edit page
            res.redirect('/admin/documentation/versions/edit/' + version.id);
        }).catch(function (error) {
            if (error.name == 'SequelizeUniqueConstraintError') {
                req.flash.error('Duplicate Version alias');
            } else {
                req.flash.error('Name: ' + error.name + '<br />' + 'Message: ' + error.message);
            }

            // Re-render edit page if has error
            res.render(req, res, 'version/new', {
                version: data
            });
        });
    };

    controller.deleteRecord = function (req, res) {
        // Delete record by array of ids
        app.models.version.destroy({
            where: {
                id: {
                    "in": req.body.ids.split(',')
                }
            }
        }).then(function () {
            req.flash.success("Delete version(s) successfully");
            res.sendStatus(204);
        }).catch(function (error) {
            if (error.name == 'SequelizeForeignKeyConstraintError') {
                req.flash.error('Cannot delete version has already in use');
                res.sendStatus(200);
            } else {
                req.flash.error('Name: ' + error.name + '<br />' + 'Message: ' + error.message);
                res.sendStatus(200);
            }
        });
    };

    controller.arrange = function (req, res) {
        // Create breadcrumb
        res.locals.breadcrumb = __.createBreadcrumb(breadcrumb);

        // Set conditions with selected version
        var conditions = 'version.is_current = true';
        var version_id = req.params.version;
        if (version_id) {
            conditions = 'version.id = ' + version_id;
            res.locals.selected_version = version_id;
        }

        var data = [];

        Promise.all([
            // Find all versions
            app.models.version.findAll({
                attributes: ['id', 'name'],
                order: 'is_current DESC, id DESC',
                raw: true
            }),

            // Find name of current version
            app.models.version.find({
                attributes: ['name'],
                where: {
                    is_current: true
                }
            }),

            // Find all sections by selected version
            app.models.section.findAll({
                include: [app.models.version],
                attributes: ['id', 'title'],
                where: [conditions],
                order: 'ordering ASC',
                raw: true
            })
        ]).then(function (result) {
            // Set view variable
            res.locals.versions = result[0];
            res.locals.current_version = result[1];

            // Find apis by sections
            var promises = [];
            result[2].forEach(function (section, i) {
                promises.push(app.models.api.findAll({
                    attributes: ['id', 'title', 'ordering'],
                    where: {
                        section_id: section.id,
                        published: 1
                    },
                    order: 'ordering ASC',
                    raw: true
                }).then(function (apis) {
                    section.apis = apis;
                    data[i] = section;
                }));
            });

            return Promise.all(promises);
        }).then(function () {
            // Render view
            res.render(req, res, 'version/arrange', {
                title: "Arrange Docs",
                data: data
            });
        }).catch(function (error) {
            req.flash.error('Name: ' + error.name + '<br />' + 'Message: ' + error.message);

            // Render view if has error
            res.render(req, res, 'version/arrange', {
                title: "Arrange Docs",
                items: null
            });
        });
    };

    controller.saveArrange = function (req, res) {
        // Get post data
        var data = req.body.data_json;

        if (data != "") {
            var promises = [];

            JSON.parse(data).forEach(function (value, index) {
                // Sort section
                promises.push(app.models.section.findById(parseInt(value[0])).then(function (section) {
                    var s = {
                        ordering: parseInt(index) + 1
                    };
                    return section.updateAttributes(s);
                }));

                value[1].forEach(function (val, i) {
                    // Sort api
                    promises.push(app.models.api.findById(parseInt(val)).then(function (api) {
                        var a = {
                            ordering: parseInt(i) + 1,
                            section_id: value[0]
                        };
                        return api.updateAttributes(a);
                    }));
                });
            });

            Promise.all(promises).then(function (results) {
                let response = {
                    type: 'success',
                    message: 'Modify docs successfully'
                };
                res.json(response);
            }).catch(function (error) {
                let response = {
                    type: 'error',
                    error: err.stack
                };
                res.json(response);
            });
        }
    };
}


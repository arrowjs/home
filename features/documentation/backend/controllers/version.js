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

    let itemOfPage = app.getConfig('pagination').numberItem || 10;
    let isAllow = ArrowHelper.isAllow;
    let adminPrefix = '/'+app.getConfig('admin_prefix');
    controller.versionIndex = function (req, res) {
        // Create breadcrumb
        res.locals.breadcrumb = ArrowHelper.createBreadcrumb(breadcrumb);

        // Add buttons
        let toolbar = new ArrowHelper.Toolbar();
        toolbar.addRefreshButton(adminPrefix+'/documentation/versions');
        toolbar.addSearchButton(isAllow(req, 'version_index'));
        toolbar.addCreateButton(isAllow(req, 'version_create'),'/admin/documentation/versions/create/');
        toolbar.addDeleteButton(isAllow(req, 'version_delete'));

        // Get current page and default sorting
        var page = req.params.page || 1;

        // Store search data to session
        let session_search = {};
        if (req.session.search) {
            session_search = req.session.search;
        }
        session_search[route + '_version_list'] = req.url;
        req.session.search = session_search;

        // Create filter
        var table = [
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
        ];
        /*
        * createFilter to render table data and send some params to views
        * totalPage, currentPage ,currentColumn, currentOrder ...
        * */
        let filter = ArrowHelper.createFilter(req, res, table, {
            rootLink: adminPrefix+'/documentation/versions/page/$page/sort',
            limit: itemOfPage
        });
        // Find all versions
        app.models.version.findAndCountAll({
            where: filter.conditions,
            order: filter.order,
            limit: itemOfPage,
            offset: (page - 1) * itemOfPage
        }).then(function (results) {
            var totalPage = Math.ceil(results.count /itemOfPage);
            // Render view
            res.backend.render('version/index', {
                title: "All Versions",
                totalPage: totalPage,
                items: results.rows,
                toolbar: toolbar.render(),

            });
        }).catch(function (error) {
            req.flash.error('Name: ' + error.name + '<br />' + 'Message: ' + error.message);
            // Render view
            res.backend.render('version/index', {
                title: "All Versions",
                totalPage: 1,
                items: null,
                toolbar: toolbar.render(),
            });
        });
    };

    controller.versionCreate = function (req, res) {
        // Add buttons
        let toolbar = new ArrowHelper.Toolbar();
        toolbar.addBackButton(adminPrefix+"/documentation/versions/");
        toolbar.addSaveButton(isAllow(req, 'version_create'));
        // Render view
        res.backend.render('version/new',{
            title : 'Create Version',
            toolbar : toolbar.render()
        });
    };

    controller.versionSaveCreate = function (req, res,next) {
        // Get post data
        var data = req.body;

        if (data.published == 0 && data.is_current == 1) {
            req.flash.error('Cannot unpublish current version');

            res.locals.breadcrumb = ArrowHelper.createBreadcrumb(breadcrumb, {title: 'Create Version'});
            // Add buttons
            let toolbar = new ArrowHelper.Toolbar();
            toolbar.addBackButton(adminPrefix+"/documentation/versions/");
            toolbar.addSaveButton(isAllow(req, 'version_create'));

            return res.backend.render('version/new', {
                version: data,
                toolbar : toolbar
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

        let new_version_id = 0;

        var prom = Promise.all([
            // Find current version
            app.models.version.find({where: {is_current: true}}),
            // Create version
            app.models.version.create(data)
            ])
            .then(function (result) {
                // Get id of created version
                new_version_id = result[1].id;
                // Reset current version if is_current was selected
                if (data.is_current == 1) {
                    return app.models.rawQuery("UPDATE version SET is_current = false WHERE id != " + new_version_id);
                }
                // If this is first version
                if (result[0] == null) {

                    //req.flash.success("Add new version successfully");
                    // Redirect to edit page
                    //res.redirect(adminPrefix+'/documentation/versions/edit/' + new_version_id);
                    return prom.cancel();
                } else {
                    // If this is not the first version, find sections of current version to clone
                    return app.models.section.findAll({
                        where: {
                            version_id: result[0].id
                        },
                        order: 'ordering ASC'
                    });
                }
            })
            .then(function (sections) {
                var promises = [];
                // Clone sections
                if(sections)
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
                    promises.push(app.models.section.create(data));
                    // Find apis of clone sections to clone
                    promises.push(app.models.api.findAll({
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
                if(result)
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
                            promises.push(app.models.api.create(data));
                        });
                    }
                });
                return Promise.all(promises);
            }).then(function () {
                req.flash.success("Add new version successfully");
                // Redirect to edit page
                res.redirect(adminPrefix+'/documentation/versions/edit/' + new_version_id);
            }).catch(function (err) {
                let messageError ='' ;
                if(err.name == 'SequelizeValidationError'){
                    err.errors.map(function (e) {
                        if(e)
                            messageError += e.message+'<br />';
                    })
                }else if (err.name == 'SequelizeUniqueConstraintError'){
                    messageError = "Duplicate Version Name";
                }else{
                    messageError = err.message;
                }
                req.flash.error(messageError);
                res.locals.version = data;
                next();
            });
    };

    controller.versionEdit = function (req, res) {
        // Create breadcrumb
        res.locals.breadcrumb = ArrowHelper.createBreadcrumb(breadcrumb, {title: 'Update Version'});
        // Add buttons
        let toolbar = new ArrowHelper.Toolbar();
        toolbar.addBackButton(adminPrefix+"/documentation/versions/");
        toolbar.addSaveButton(isAllow(req, 'version_edit'));

        // Find version by id
        app.models.version.findById(req.params.cid).then(function (version) {
            // Render view
            res.backend.render('version/new', {
                version: version,
                toolbar : toolbar.render()
            });
        }).catch(function (error) {
            req.flash.error('Name: ' + error.name + '<br />' + 'Message: ' + error.message);
            // Redirect to index page if has error
            res.redirect(adminPrefix+'/documentation/versions/');
        });
    };

    controller.versionSaveEdit = function (req, res) {
        // Get post data
        var data = req.body;

        res.locals.breadcrumb = ArrowHelper.createBreadcrumb(breadcrumb, {title: 'Update Version'});
        // Add buttons
        let toolbar = new ArrowHelper.Toolbar();
        toolbar.addBackButton(adminPrefix+"/documentation/versions/");
        toolbar.addSaveButton(isAllow(req, 'version_edit'));

        if (data.published == 0 && data.is_current == 1) {
            req.flash.error('Cannot unpublish current version');
            return res.backend.render('version/new', {
                version: data,
                toolbar : toolbar.render()
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
                app.models.rawQuery("UPDATE version SET is_current = false WHERE id != " + version.id);
            }
            req.flash.success("Update version successfully");
            // Redirect to edit page
            res.redirect(adminPrefix+'/documentation/versions/edit/' + version.id);
        }).catch(function (err) {
            let messageError ='' ;
            if(err.name == 'SequelizeValidationError'){
                err.errors.map(function (e) {
                    if(e)
                        messageError += e.message+'<br />';
                })
            }else if (err.name == 'SequelizeUniqueConstraintError'){
                messageError = "Duplicate Version Name";
            }else{
                messageError = err.message;
            }
            req.flash.error(messageError);
            // Re-render edit page if has error
            res.backend.render('version/new', {
                version: data,
                toolbar : toolbar.render()
            });
        });
    };

    controller.versionDeleteRecord = function (req, res) {
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

    controller.versionArrange = function (req, res) {
        // Create breadcrumb
        res.locals.breadcrumb = ArrowHelper.createBreadcrumb(breadcrumb);

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
            res.backend.render('version/arrange', {
                title: "Arrange Docs",
                data: data
            });
        }).catch(function (error) {
            req.flash.error('Name: ' + error.name + '<br />' + 'Message: ' + error.message);

            // Render view if has error
            res.backend.render('version/arrange', {
                title: "Arrange Docs",
                items: null
            });
        });
    };

    controller.versionSaveArrange = function (req, res) {
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


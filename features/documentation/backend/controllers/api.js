'use strict';

let slug = require('slug');
let Promise = require('arrowjs').Promise;
let route = 'documentation';

let breadcrumb =
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
            title: 'All API documents',
            href: '/admin/documentation/apis/'
        }
    ];


module.exports = function (controller, component, app) {

    let itemOfPage = app.getConfig('pagination').numberItem || 10;
    let isAllow = ArrowHelper.isAllow;
    let adminPrefix = '/'+app.getConfig('admin_prefix');
    controller.apiIndex = function (req, res) {
        // Create breadcrumb
        res.locals.breadcrumb = ArrowHelper.createBreadcrumb(breadcrumb);

        // Add buttons and check authorities
        let toolbar = new ArrowHelper.Toolbar();
        toolbar.addRefreshButton(adminPrefix+'/documentation/apis');
        toolbar.addSearchButton(isAllow(req, 'api_index'));
        toolbar.addCreateButton(isAllow(req, 'api_create'),'/admin/documentation/apis/create');
        toolbar.addDeleteButton(isAllow(req, 'api_delete'));

        // Get current page and default sorting
        var page = req.params.page || 1;

        // Create filter
        let table = [
            {
                column: "id",
                width: '1%',
                header: "",
                type: 'checkbox'
            },
            {
                column: "title",
                width: '25%',
                header: "Title",
                link: '/admin/documentation/apis/edit/{id}',
                acl: 'documentation.api_edit',
                filter: {
                    model: 'api',
                    data_type: 'string'
                }
            },
            {
                column: "section.title",
                width: '25%',
                header: "Section",
                filter: {
                    data_type: 'string'
                }
            },
            {
                column: "section.version.name",
                width: '10%',
                header: "Version",
                filter: {
                    data_type: 'string'
                }
            },
            {
                column: "user.display_name",
                width: '15%',
                header: "Author",
                filter: {
                    data_type: 'string'
                }
            },
            {
                column: "modified_at",
                type: 'datetime',
                width: '10%',
                header: "Modified Date",
                filter: {
                    model: 'api',
                    type: 'datetime'
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
                    model: 'api',
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
            }
        ];

        let filter = ArrowHelper.createFilter(req, res, table, {
            rootLink: '/admin/documentation/apis/page/$page/sort',
            limit: itemOfPage
        });

        app.models.api.findAndCountAll({
            include: [
                {
                    model: app.models.user,
                    attributes: ['display_name'],
                    where: ['1 = 1']
                },
                {
                    include: [
                        {
                            model: app.models.version,
                            attributes: ['name'],
                            where: ['1 = 1']
                        }
                    ],
                    model: app.models.section,
                    attributes: ['title'],
                    where: ['1 = 1']
                }
            ],
            where: filter.conditions,
            order: filter.order,
            limit: itemOfPage,
            offset: (page - 1) * itemOfPage
        }).then(function (results) {
            var totalPage = Math.ceil(results.count / itemOfPage);
            res.backend.render('api/index', {
                title: 'All APIs document',
                totalPage: totalPage,
                items: results.rows,
                currentPage: page,
                toolbar : toolbar.render()
            });
        }).catch(function (error) {
            req.flash.error('Name: ' + error.name + '<br />' + 'Message: ' + error.message);
            res.backend.render('api/index', {
                title: 'All APIs document',
                totalPage: 1,
                items: null,
                currentPage: 1,
                toolbar : toolbar.render()
            });
        });
    };

    controller.apiCreate = function (req, res) {
        res.locals.breadcrumb = ArrowHelper.createBreadcrumb(breadcrumb, {title: 'New API document'});

        let toolbar = new ArrowHelper.Toolbar();
        toolbar.addBackButton('/admin/documentation/apis');
        toolbar.addSaveButton(isAllow(req, 'api_create'));
        toolbar.addDeleteButton(isAllow(req, 'api_delete'));

        app.models.section.findAll({
            include: [
                {
                    model: app.models.version,
                    attributes: ['name']
                }
            ],
            order: 'version_id DESC, ordering ASC'
        }).then(function (sections) {
            res.backend.render('api/new', {
                title: 'Add New API',
                sections: sections,
                toolbar : toolbar.render()
            });
        }).catch(function (error) {
            req.flash.error('Name: ' + error.name + '<br />' + 'Message: ' + error.message);
            // Render view
            res.backend.render('api/new', {
                title: 'Add New API',
                sections: null,
                toolbar : toolbar.render()
            });
        });
    };

    controller.apiSaveCreate = function (req, res) {
        var data = req.body;

        // Generate alias
        if (data.alias == '') {
            data.alias = slug(data.title.toLowerCase());
        } else {
            data.alias = slug(data.alias.toLowerCase());
        }

        // Save author
        data.created_by = req.user.id;

        app.models.api.max('ordering').then(function (max) {
            if (max) {
                data.ordering = max + 1;
            } else {
                data.ordering = 1;
            }
            // Save api
            return app.models.api.create(data);
        }).then(function (api) {
            req.flash.success('Added API document successfully');
            res.redirect('/admin/documentation/apis/edit/' + api.id);
        }).catch(function (error) {
            res.locals.breadcrumb = ArrowHelper.createBreadcrumb(breadcrumb, {title: 'New API document'});
            let toolbar = new ArrowHelper.Toolbar();
            toolbar.addBackButton('/admin/documentation/apis');
            toolbar.addSaveButton(isAllow(req, 'api_create'));
            toolbar.addDeleteButton(isAllow(req, 'api_delete'));

            if (error.name == 'SequelizeUniqueConstraintError') {
                req.flash.error('API alias was duplicated');
            } else {
                req.flash.error('Name: ' + error.name + '<br />' + 'Message: ' + error.message);
            }

            app.models.section.findAll({
                include: [
                    {
                        model: app.models.version,
                        attributes: ['name']
                    }
                ],
                order: 'version_id DESC, ordering ASC'
            }).then(function (sections) {
                res.backend.render('api/new', {
                    title: 'Add New API',
                    sections: sections,
                    api: data,
                    toolbar : toolbar.render()
                });
            });
        });
    };

    controller.apiEdit = function (req, res) {
        res.locals.breadcrumb = ArrowHelper.createBreadcrumb(breadcrumb, {title: 'Update API document'});

        let toolbar = new ArrowHelper.Toolbar();
        let api_id = 0;
        if (req.params.vid != undefined) {
            toolbar.addBackButton('/admin/documentation/versions/arrange-docs');
            api_id = req.params.vid;
        } else {
            toolbar.addBackButton('/admin/documentation/apis/');
            api_id = req.params.cid;
        }
        toolbar.addSaveButton(isAllow(req, 'api_create'));
        Promise.all(
            [
                app.models.section.findAll({
                    include: [
                        {
                            model: app.models.version,
                            attributes: ['name']
                        }
                    ],
                    order: 'ordering ASC'
                }),
                app.models.api.findById(api_id)
            ]
        ).then(function (results) {
                res.backend.render('api/new', {
                    title: 'Edit API document',
                    sections: results[0],
                    api: results[1],
                    toolbar : toolbar.render()
                });
            }).catch(function (err) {
                req.flash.error('Name: ' + err.name + '<br />' + 'Message: ' + err.message);
                res.backend.render('api/new', {
                    title: 'Edit API document',
                    sections: null,
                    api: null,
                    toolbar : toolbar.render()
                });
            });
    };

    controller.apiSaveEdit = function (req, res) {
        var data = req.body;

        let api_id = 0;
        if (req.params.vid != undefined) {
            api_id = req.params.vid;
        } else {
            api_id = req.params.cid;
        }

        app.models.api.findById(api_id).then(function (api) {
            // Generate alias
            if (data.alias == '') {
                data.alias = slug(data.title.toLowerCase());
            } else {
                data.alias = slug(data.alias.toLowerCase());
            }

            // Save editor
            data.modified_by = req.user.id;

            // Save post
            return api.updateAttributes(data);
        }).then(function (api) {
            req.flash.success('Updated API document successfully');
            if (req.params.vid != undefined) {
                res.redirect('/admin/documentation/apis/edit2/' + api.id);
            } else {
                res.redirect('/admin/documentation/apis/edit/' + api.id);
            }
        }).catch(function (err) {
            if (err.name == 'SequelizeUniqueConstraintError') {
                req.flash.error('API alias was duplicated');
            } else {
                req.flash.error('Name: ' + err.name + '<br />' + 'Message: ' + err.message);
            }

            Promise.all([
                app.models.section.findAll({
                    include: [
                        {
                            model: app.models.version,
                            attributes: ['name']
                        }
                    ],
                    order: 'ordering ASC'
                }),
                app.models.api.findById(api_id)
            ]).then(function (results) {
                res.backend.render('api/new', {
                    title: 'Edit API document',
                    sections: results[0],
                    api: data
                });
            });
        });
    };

    controller.apiDeleteRecord = function (req, res) {
        app.models.api.destroy({
            where: {
                id: {
                    'in': req.body.ids.split(',')
                }
            }
        }).then(function () {
            // Only show flash message if no param
            if (req.params.msg == undefined) {
                req.flash.success('Delete API document(s) successfully');
            }
            res.sendStatus(204);
        }).catch(function (error) {
            if (req.params.msg == undefined) {
                req.flash.error('Name: ' + error.name + '<br />' + 'Message: ' + error.message);
            }
            res.sendStatus(200);
        });
    };

    controller.apiCreateApi = function (req, res) {
        let data = {};
        data.title = req.body.api_title;
        data.alias = slug(data.title.toLowerCase());
        data.created_by = req.user.id;
        data.ordering = 0;
        data.published = 1;
        data.section_id = req.body.section_id;

        app.models.api.max('ordering').then(function (max) {
            if (max) {
                data.ordering = max + 1;
            } else {
                data.ordering = 1;
            }

            // Save api
            return app.models.api.create(data);
        }).then(function (api) {
            res.send('' + api.id);
        }).catch(function (error) {
            if (error.name == 'SequelizeUniqueConstraintError') {
                res.send('0');
            } else {
                res.send('-1');
            }
        });
    };


}
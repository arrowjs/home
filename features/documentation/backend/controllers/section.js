'use strict';

var slug = require('slug');
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
            title: 'All Sections',
            href: '/admin/documentation/sections/'
        }
    ];

module.exports = function (controller,component,app) {

    let itemOfPage = app.getConfig('pagination').numberItem || 10;
    let isAllow = ArrowHelper.isAllow;
    /*
    * List all sections
    * */
    controller.sectionIndex = function (req, res) {
        // Create breadcrumb
        res.locals.breadcrumb = ArrowHelper.createBreadcrumb(breadcrumb);
        // Add buttons and check authorities
        let toolbar = new ArrowHelper.Toolbar();
        toolbar.addCreateButton(isAllow(req, 'section_create'),'/admin/documentation/sections/create/');
        toolbar.addDeleteButton(isAllow(req, 'section_delete'));

        // Get current page and default sorting
        var page = req.params.page || 1;
        var column = req.params.sort || 'id';
        var order = req.params.order || 'desc';
        //res.locals.root_link = '/admin/documentation/sections/page/' + page + '/sort';

        // Create filter
        //var filter = __.createFilter(req, res, route, '/admin/documentation/sections', column, order, [
        let table =[
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
                link: '/admin/documentation/sections/edit/{id}',
                acl: 'documentation.section_edit',
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
                column: "version.name",
                width: '15%',
                header: "Version",
                filter: {
                    data_type: 'string'
                }
            }
        ];

        let filter = ArrowHelper.createFilter(req, res, table, {
            rootLink: '/admin/documentation/sections/page/' + page + '/sort',
            limit: itemOfPage,
            order : order,
            page : page
        });
        // Find all sections
        app.models.section.findAndCountAll({
            include: [
                {
                    model: app.models.version,
                    attributes: ['name']
                }
            ],
            where: filter.values,
            order: column + " " + order,
            limit: itemOfPage,
            offset: (page - 1) * itemOfPage
        }).then(function (results) {
            var totalPage = Math.ceil(results.count / itemOfPage);

            // Render view
            res.render( 'section/index', {
                title: "All Sections",
                totalPage: totalPage,
                items: results.rows,
                currentPage: page,
                toolbar : toolbar.render()
            });
        }).catch(function (error) {
            req.flash.error('Name: ' + error.name + '<br />' + 'Message: ' + error.message);

            // Render view if has error
            res.render( 'section/index', {
                title: "All Sections",
                totalPage: 1,
                items: null,
                currentPage: 1,
                toolbar : toolbar.render()
            });
        });
    };

    controller.sectionCreate = function (req, res) {
        // Create breadcrumb
        res.locals.breadcrumb = ArrowHelper.createBreadcrumb(breadcrumb, {title: 'New Section'});
        // Add buttons and check authorities
        let toolbar = new ArrowHelper.Toolbar();
        toolbar.addBackButton("/admin/documentation/sections/");
        toolbar.addSaveButton(isAllow(req, 'section_create'));

        // Find all versions
        app.models.version.findAll({
            order: "is_current DESC, id DESC"
        }).then(function (versions) {
            // Render view
            res.render( 'section/new', {
                versions: versions,
                toolbar : toolbar.render()
            });
        }).catch(function (error) {
            req.flash.error('Name: ' + error.name + '<br />' + 'Message: ' + error.message);

            // Render view if has error
            res.render( 'section/new', {
                versions: null,
                toolbar : toolbar.render()
            });
        });
    };

    controller.sectionSaveCreate = function (req, res) {
        // Get post data
        var data = req.body;

        // Generate alias
        if (data.alias == '') data.alias = data.title;
        data.alias = slug(data.alias.toLowerCase());

        // Get max ordering
        app.models.section.max('ordering').then(function (max) {
            if (max) {
                data.ordering = max + 1;
            } else {
                data.ordering = 1;
            }

            // Create section
            return app.models.section.create(data);
        }).then(function (section) {
            req.flash.success("Add new section successful");
            // Redirect to edit page
            res.redirect('/admin/documentation/sections/edit/' + section.id);
        }).catch(function (error) {
            if (error.name == 'SequelizeUniqueConstraintError') {
                req.flash.error('Section alias was duplicated');
            } else {
                req.flash.error('Name: ' + error.name + '<br />' + 'Message: ' + error.message);
            }
            // Re-render view if has error
            // Create breadcrumb
            res.locals.breadcrumb = ArrowHelper.createBreadcrumb(breadcrumb, {title: 'New Section'});
            // Add buttons and check authorities
            let toolbar = new ArrowHelper.Toolbar();
            toolbar.addBackButton("/admin/documentation/sections/");
            toolbar.addSaveButton(isAllow(req, 'section_create'),'/admin/documentation/sections/create/');

            app.models.version.findAll({
                order: "is_current DESC, id DESC"
            }).then(function (versions) {
                res.render( 'section/new', {
                    versions: versions,
                    section: data,
                    toolbar : toolbar.render()
                });
            });
        });
    };

    controller.sectionEdit = function (req, res) {
        // Create breadcrumb
        res.locals.breadcrumb = ArrowHelper.createBreadcrumb(breadcrumb, {title: 'Update Section'});

        // Add buttons and check authorities
        let toolbar = new ArrowHelper.Toolbar();
        toolbar.addBackButton("/admin/documentation/sections/");
        toolbar.addSaveButton(isAllow(req, 'section_create'),'/admin/documentation/sections/create/');

        Promise.all(
            [
                // Find all versions
                app.models.version.findAll({
                    order: "is_current DESC, id DESC"
                }),

                // Find section by id
                app.models.section.findById(req.params.cid)
            ]
        ).then(function (result) {
                // Render view
                res.render('section/new', {
                    versions: result[0],
                    section: result[1],
                    toolbar : toolbar.render()
                });
            }).catch(function (error) {
                req.flash.error('Name: ' + error.name + '<br />' + 'Message: ' + error.message);

                // Render view if has error
                res.render('section/new', {
                    versions: null,
                    section: null,
                    toolbar : toolbar.render()
                });
            });
    };

    controller.sectionSaveEdit = function (req, res) {
        // Get post data
        var data = req.body;

        // Find section by id
        app.models.section.findById(req.params.cid).then(function (section) {

            // Save Editor
            data.modified_by = req.user.id;

            // Generate alias
            if (data.alias == '') data.alias = data.title;
            data.alias = slug(data.alias.toLowerCase());

            // Update section
            return section.updateAttributes(data);
        }).then(function (section) {
            req.flash.success("Update section successfully");

            // Redirect to edit page
            res.redirect('/admin/documentation/sections/edit/' + section.id);
        }).catch(function (error) {
            if (error.name == 'SequelizeUniqueConstraintError') {
                req.flash.error('Duplicate Section Alias');
            } else {
                req.flash.error('Name: ' + error.name + '<br />' + 'Message: ' + error.message);
            }
            // Create breadcrumb
            res.locals.breadcrumb = ArrowHelper.createBreadcrumb(breadcrumb, {title: 'Update Section'});

            // Add buttons and check authorities
            let toolbar = new ArrowHelper.Toolbar();
            toolbar.addBackButton("/admin/documentation/sections/");
            toolbar.addSaveButton(isAllow(req, 'section_create'),'/admin/documentation/sections/create/');
            // Re-render view if has error
            app.models.version.findAll({
                order: "is_current DESC, id DESC"
            }).then(function (versions) {
                res.render('section/new', {
                    versions: versions,
                    section: data,
                    toolbar : toolbar
                });
            });
        });
    };

    controller.sectionUpdate = function (req, res) {
        let data = req.body;

        app.models.section.findById(data.pk).then(function (section) {
            let value = {
                title: data.value,
                alias: slug(data.value.toLowerCase()),
                modified_by: req.user.id
            };
            return section.updateAttributes(value);
        }).then(function () {
            res.json(null);
        }).catch(function (err) {
            let response = {
                type: 'error',
                message: 'Fail to update section. Section name can be duplicated'
            };
            res.json(response);
        });
    };

    controller.sectionDeleteRecord = function (req, res) {
        // Delete record by array of ids
        app.models.section.destroy({
            where: {
                id: {
                    "in": req.body.ids.split(',')
                }
            }
        }).then(function () {
            req.flash.success("Delete section(s) successfully");
            res.sendStatus(204);
        }).catch(function (error) {
            if (error.name == 'SequelizeForeignKeyConstraintError') {
                req.flash.error('Cannot delete section has already in use');
                res.sendStatus(200);
            } else {
                req.flash.error('Name: ' + error.name + '<br />' + 'Message: ' + error.message);
                res.sendStatus(200);
            }
        });
    };

    controller.sectionDeleteRecordTruncate = function (req, res) {
        app.models.api.destroy({
            where: {
                section_id: req.body.id
            }
        }).then(function () {
            return app.models.section.destroy({
                where: {
                    id: req.body.id
                }
            })
        }).then(function () {
            res.sendStatus(204);
        }).catch(function (error) {
            res.sendStatus(200);
        });
    };

    controller.sectionCreateSection = function (req, res) {
        let data = {};
        data.title = req.body.section_title;
        data.alias = slug(data.title.toLowerCase());
        data.ordering = 0;
        data.version_id = req.body.version_id;

        app.models.section.max('ordering').then(function (max) {
            if (max) {
                data.ordering = max + 1;
            } else {
                data.ordering = 1;
            }

            // Save section
            return app.models.section.create(data);
        }).then(function (section) {
            res.send('' + section.id);
        }).catch(function (error) {
            if (error.name == 'SequelizeUniqueConstraintError') {
                res.send('0');
            } else {
                res.send('-1');
            }
        });
    };
}


/**
 * Created by thangnv on 12/1/15.
 */
'use strict';

module.exports =  {
    title: 'Documentation',
    author: 'FreeSky Team',
    version: '0.0.1',
    description: 'Documentation',
    permissions: [
        {
            name: 'section_index',
            title: 'View All Sections'
        },
        {
            name: 'section_create',
            title: 'Create New Section'
        },
        {
            name: 'section_edit',
            title: 'Edit Section'
        },
        {
            name: 'section_delete',
            title: 'Delete Section'
        },
        {
            name: 'api_index',
            title: 'View All APIs'
        },
        {
            name: 'api_create',
            title: 'Create New API'
        },
        {
            name: 'api_edit',
            title: 'Edit API'
        },
        {
            name: 'api_delete',
            title: 'Delete API'
        },
        {
            name: 'version_index',
            title: 'View All Versions'
        },
        {
            name: 'version_create',
            title: 'Create New Version'
        },
        {
            name: 'version_edit',
            title: 'Edit Version'
        },
        {
            name: 'version_delete',
            title: 'Delete Version'
        },
        {
            name: 'arrange',
            title: 'Arrange Docs'
        }
    ],
    backend_menu: {
        title: 'Documentation',
        icon: 'fa fa-book',
        menus: [
            {
                permission: 'arrange',
                title: 'Modify Docs',
                link: '/versions/arrange-docs'
            },
            {
                permission: 'version_index',
                title: 'Versions',
                link: '/versions'
            },
            {
                permission: 'section_index',
                title: 'Sections',
                link: '/sections'
            },
            {
                permission: 'api_index',
                title: 'APIs',
                link: '/apis'
            }
        ]
    }
};


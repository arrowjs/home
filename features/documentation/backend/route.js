
'use strict';

module.exports = function (component,app) {
    let comp = component.controllers.backend;
    return {
        //api route
        '/documentation' : {
            get :{
                handler : comp.apiIndex,
                authenticate : true,
                permissions : 'api_index'
            }
        },
        '/documentation/apis' : {
            get :{
                handler : comp.apiIndex,
                authenticate : true,
                permissions : 'api_index'
            }
        },
        '/documentation/apis/create' : {
            get :{
                handler : comp.apiCreate,
                authenticate : true,
                permissions : 'api_create'
            },
            post :{
                handler : comp.apiSaveCreate,
                authenticate : true,
                permissions : 'api_create'
            }
        },
        '/documentation/apis/createapi' : {
            post :{
                handler : comp.apiCreateApi,
                authenticate : true,
                permissions : 'api_create'
            }
        },
        '/documentation/apis/edit/:cid' : {
            get :{
                handler : comp.apiEdit,
                authenticate : true,
                permissions : 'api_edit'
            },
            post :{
                handler : comp.apiSaveEdit,
                authenticate : true,
                permissions : 'api_edit'
            }
        },
        '/documentation/apis/edit2/:vid' : {
            get :{
                handler : comp.apiEdit,
                authenticate : true,
                permissions : 'api_edit'
            },
            post :{
                handler : comp.apiSaveEdit,
                authenticate : true,
                permissions : 'api_edit'
            }
        },
        '/documentation/apis/page/:page' : {
            get :{
                handler : comp.apiIndex,
                authenticate : true,
                permissions : 'api_index'
            }
        },
        '/documentation/apis/deleterecord(:msg)?' : {
            post :{
                handler : comp.apiDeleteRecord,
                authenticate : true,
                permissions : 'api_delete'
            }
        },
        '/documentation/apis/page/:page/sort/:sort/:order' : {
            get :{
                handler : comp.apiIndex,
                authenticate : true,
                permissions : 'api_index'
            }
        },
        //sections route
        '/documentation/sections' : {
            get :{
                handler : comp.sectionIndex,
                authenticate : true,
                permissions : 'section_index'
            }
        },
        '/documentation/sections/create' : {
            get :{
                handler : comp.sectionCreate,
                authenticate : true,
                permissions : 'section_create'
            },
            post :{
                handler : comp.sectionSaveCreate,
                authenticate : true,
                permissions : 'section_create'
            }
        },
        '/documentation/sections/createsection' : {
            post :{
                handler : comp.sectionCreateSection,
                authenticate : true,
                permissions : 'section_create'
            }
        },
        '/documentation/sections/edit/:cid' : {
            get :{
                handler : comp.sectionEdit,
                authenticate : true,
                permissions : 'section_edit'
            },
            post :{
                handler : comp.sectionSaveEdit,
                authenticate : true,
                permissions : 'section_edit'
            }
        },
        '/documentation/sections/update' : {
            post :{
                handler : comp.sectionUpdate,
                authenticate : true,
                permissions : 'section_edit'
            }
        },
        '/documentation/sections/deleterecord' : {
            post :{
                handler : comp.sectionDeleteRecord,
                authenticate : true,
                permissions : 'section_delete'
            }
        },
        '/documentation/sections/deleterecordtruncate' : {
            post :{
                handler : comp.sectionDeleteRecord,
                authenticate : true,
                permissions : 'section_delete'
            }
        },
    }
}


//router.route('/documentation/sections/deleterecordtruncate').post(__acl.isAllow('section_delete'), section.deleteRecordTruncate);
//router.route('/documentation/sections/page/:page').get(__acl.isAllow('section_index'), section.index);
//router.route('/documentation/sections/page/:page/sort/:sort/:order').get(__acl.isAllow('section_index'),section.index);
//
//router.route('/documentation/versions').get(__acl.isAllow('version_index'), version.index);
//router.route('/documentation/versions/create').get(__acl.isAllow('version_create'), version.create);
//router.route('/documentation/versions/create').post(__acl.isAllow('version_create'), version.saveCreate);
//router.route('/documentation/versions/edit/:cid').get(__acl.isAllow('version_edit'), version.edit);
//router.route('/documentation/versions/edit/:cid').post(__acl.isAllow('version_edit'), version.saveEdit);
//router.route('/documentation/versions/delete').post(__acl.isAllow('version_delete'), version.deleteRecord);
//router.route('/documentation/versions/arrange-docs').get(__acl.isAllow('arrange'), version.arrange);
//router.route('/documentation/versions/arrange-docs').post(__acl.isAllow('arrange'), version.saveArrange);
//router.route('/documentation/versions/arrange-docs/:version([0-9]+)').get(__acl.isAllow('arrange'), version.arrange);
//router.route('/documentation/versions/arrange-docs/:version([0-9]+)').post(__acl.isAllow('arrange'), version.saveArrange);
//router.route('/documentation/versions/page/:page').get(__acl.isAllow('version_index'), version.index);
//router.route('/documentation/versions/page/:page/sort/:sort/:order').get(__acl.isAllow('version_index'),version.index);
//
//module.exports = router;
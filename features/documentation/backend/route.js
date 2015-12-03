
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
        'apis' : {
            get :{
                handler : comp.apiIndex,
                authenticate : true,
                permissions : 'api_index'
            }
        },
        'apis/create' : {
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
        'apis/createapi' : {
            post :{
                handler : comp.apiCreateApi,
                authenticate : true,
                permissions : 'api_create'
            }
        },
        'apis/edit/:cid' : {
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
        'apis/edit2/:vid' : {
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
        'apis/page/:page' : {
            get :{
                handler : comp.apiIndex,
                authenticate : true,
                permissions : 'api_index'
            }
        },
        'apis/deleterecord(:msg)?' : {
            post :{
                handler : comp.apiDeleteRecord,
                authenticate : true,
                permissions : 'api_delete'
            }
        },
        'apis/page/:page/sort/:sort/:order' : {
            get :{
                handler : comp.apiIndex,
                authenticate : true,
                permissions : 'api_index'
            }
        },
        //sections route
        'sections' : {
            get :{
                handler : comp.sectionIndex,
                authenticate : true,
                permissions : 'section_index'
            }
        },
        'sections/create' : {
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
        'sections/createsection' : {
            post :{
                handler : comp.sectionCreateSection,
                authenticate : true,
                permissions : 'section_create'
            }
        },
        'sections/edit/:cid' : {
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
        'sections/update' : {
            post :{
                handler : comp.sectionUpdate,
                authenticate : true,
                permissions : 'section_edit'
            }
        },
        'sections/deleterecord' : {
            post :{
                handler : comp.sectionDeleteRecord,
                authenticate : true,
                permissions : 'section_delete'
            }
        },
        'sections/deleterecordtruncate' : {
            post :{
                handler : comp.sectionDeleteRecordTruncate,
                authenticate : true,
                permissions : 'section_delete'
            }
        },
        'sections/page/:page' : {
            post :{
                handler : comp.sectionIndex,
                authenticate : true,
                permissions : 'section_index'
            }
        },
        'sections/page/:page/sort/:sort/:order' : {
            get :{
                handler : comp.sectionIndex,
                authenticate : true,
                permissions : 'section_index'
            }
        },
        //version route
        'versions' : {
            get :{
                handler : comp.versionIndex,
                authenticate : true,
                permissions : 'version_index'
            }
        },
        'versions/create' : {
            get :{
                handler : comp.versionCreate,
                authenticate : true,
                permissions : 'version_create'
            },
            post :{
                handler : [comp.versionSaveCreate,comp.versionCreate],
                authenticate : true,
                permissions : 'version_create'
            }
        },
        'versions/edit/:cid' : {
            get :{
                handler : comp.versionEdit,
                authenticate : true,
                permissions : 'version_edit'
            },
            post :{
                handler : comp.versionSaveEdit,
                authenticate : true,
                permissions : 'version_edit'
            }
        },
        'versions/delete' : {
            post :{
                handler : comp.versionDeleteRecord,
                authenticate : true,
                permissions : 'version_delete'
            }
        },
        'versions/arrange-docs' : {
            get :{
                handler : comp.versionArrange,
                authenticate : true,
                permissions : 'arrange'
            },
            post :{
                handler : comp.versionSaveArrange,
                authenticate : true,
                permissions : 'arrange'
            }
        },
        'versions/arrange-docs/:version([0-9]+)' : {
            get :{
                handler : comp.versionArrange,
                authenticate : true,
                permissions : 'arrange'
            },
            post :{
                handler : comp.versionSaveArrange,
                authenticate : true,
                permissions : 'arrange'
            }
        },
        'versions/page/:page' : {
            get :{
                handler : comp.versionIndex,
                authenticate : true,
                permissions : 'version_index'
            }
        },
        'versions/page/:page/sort/:sort/:order' : {
            get :{
                handler : comp.versionIndex,
                authenticate : true,
                permissions : 'version_index'
            }
        }
    }
}
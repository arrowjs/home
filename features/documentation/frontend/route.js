/**
 * Created by thangnv on 12/3/15.
 */
'use strict';

module.exports = function (component,app) {
    let comp = component.controllers.frontend;
    return {
        '/documentation' : {
            get :{
                handler : comp.defaultIndex
            }
        },
        '/documentation/:version([a-zA-Z0-9-.]+)(/)?' : {
            get :{
                handler : comp.versionIndex
            }
        },
        '/documentation/:version([a-zA-Z0-9-.]+)/:section([a-zA-Z0-9-.]+)/:api([a-zA-Z0-9-.]+)(/)?' : {
            get :{
                handler : comp.index
            }
        }
    }
}
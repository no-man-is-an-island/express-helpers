'use strict';

const fs = require('fs');
const path = require('path');
const debug = require('debug')('Routes');

const helpers = require('./helpers');

const verbs = ['get', 'post', 'delete', 'put'];

class Routes {
    /**
     * Initialise the routes.
     * @param {app}     expressApp and instance of the express app
     * @param {string}  absPath the absolute path of the directory that contains all the services with routes
     * @param {string}  pathPrefix [optional] path to prefix to all the routes
     */
        
    constructor(expressApp, absPath, pathPrefix) {
        const pathIsGood = fs.existsSync(absPath);
        if(pathIsGood){
            const isDir = fs.statSync(absPath).isDirectory();
            if(isDir){
                this.app = expressApp;
                this.services = [];
                this.serviceDirAbsPath = absPath;
                this.pathPrefix = pathPrefix;
                //work out the relative path (starting with ./) from this file to the dir containing the services
                this.serviceDirRelPath = `./${path.relative(__dirname, absPath)}`;
                this._addServices();
            } else {
                throw new Error(`Invalid absolute path passed to Routes constructor - it needs to be a directory: ${absPath}`);                
            }
        } else {
            throw new Error(`Invalid absolute path passed to Routes constructor: ${absPath}`);
        }
    }

    _addVerb(verb){
        this.services.forEach(service => {
            if(service.routes[verb] && service.routes[verb].length > 0){
                debug(`adding ${verb} routes for: ${service.filename}`);
                service.routes[verb].forEach(route => {
                    this.app[verb](`${this.pathPrefix}${route.path}`, ...route.funcs);
                });
            }
        });
    };

    addGetRoutes() {
        this._addVerb('get');
        /*
        this.services.forEach(service => {
            if(service.routes.get && service.routes.get.length > 0){
                debug(`adding get routes for: ${service.filename}`);
                service.routes.get.forEach(getRoute => {
                    this.app.get(`${this.pathPrefix}${getRoute.path}`, ...getRoute.funcs);
                });
            }
        });
        */
    };
    
    addPostRoutes(){
        this._addVerb('post');
        /*
        this.services.forEach(service => {
            if(service.routes.post && service.routes.post.length > 0){
                debug(`adding post routes for: ${service.filename}`);
                service.routes.post.forEach(postRoute => {
                    this.app.post(`${this.pathPrefix}${postRoute.path}`, ...postRoute.funcs);
                 });
            }
        });
        */
    };

    addDeleteRoutes(){
        this._addVerb('delete');
    };

    addPutRoutes(){
        this._addVerb('put');
    };

    /**
     * Add all the service classes.
     */
    _addServices(){
        const serviceRoutesAreValid = service => {
            const validate = function(verb){
                if(service.routes[verb]){
                    service.routes[verb].forEach(route => {
                        if(!route.path || !route.funcs){
                            throw new Error(`Misconfigured ${verb} route. Route path is '${route.path}'`);
                        }
                    });
                }
            }
            verbs.forEach(validate);
            return true;
        };

        debug('parsing routes for services..');
        fs
          .readdirSync(this.serviceDirAbsPath)
          .filter(file => {
            return (file.indexOf('.') !== 0) && (file.slice(-3) === '.js');
          })
          .forEach(file => {
            const service = require(`${this.serviceDirRelPath}/${file}`);
            const serviceToUse = service.default ? service.default : service;

            if(serviceToUse.routes){
                serviceRoutesAreValid(service);
                debug(`parsing routes for service: ${file}`);
                this.services.push({filename: file, routes: serviceToUse.routes});
            }
          });
      };
};
module.exports.Routes = Routes;
module.exports.helpers = helpers;

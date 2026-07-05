/**
 * Single Page Application Hash Router
 */
class Router {
    constructor() {
        this.routes = {};
        window.addEventListener('hashchange', () => this.handleRouting());
        window.addEventListener('load', () => this.handleRouting());
    }

    register(path, renderCallback) {
        this.routes[path] = renderCallback;
    }

    handleRouting() {
        const hash = window.location.hash || '#/dashboard';
        const render = this.routes[hash];
        
        if (render) {
            render();
        } else {
            // Default fallback
            this.navigateTo('#/dashboard');
        }
    }

    navigateTo(hash) {
        window.location.hash = hash;
    }
}

window.AppRouter = new Router();

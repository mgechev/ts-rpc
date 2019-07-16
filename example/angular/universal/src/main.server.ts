import { enableProdMode } from '@angular/core';

import { environment } from './environments/environment';
import { listen } from 'ts-rpc-server';

if (environment.production) {
  enableProdMode();
}

export { AppServerModule } from './app/app.server.module';
export { ngExpressEngine } from "@nguniversal/express-engine";
export { provideModuleMap } from "@nguniversal/module-map-ngfactory-loader";

listen('0.0.0.0', 8081);

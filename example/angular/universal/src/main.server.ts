import { enableProdMode } from '@angular/core';

import { environment } from './environments/environment';
import { listen } from 'ts-rpc-server';

if (environment.production) {
  enableProdMode();
}

export { AppServerModule } from './app/app.server.module';

listen();

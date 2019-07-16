import { NgModule } from '@angular/core';
import { ServerModule } from '@angular/platform-server';

import { AppModule } from './app.module';
import { AppComponent } from './app.component';
import { ModuleMapLoaderModule } from '@nguniversal/module-map-ngfactory-loader';
import { TodosService, TodosServiceToken } from './services';

@NgModule({
  imports: [
    AppModule,
    ServerModule,
    ModuleMapLoaderModule,
  ],
  providers: [
    {
      provide: TodosServiceToken,
      useClass: TodosService
    }
  ],
  bootstrap: [AppComponent],
})
export class AppServerModule {}


import { NgModule } from '@angular/core';
import { ServerModule } from '@angular/platform-server';

import { AppModule } from './app.module';
import { AppComponent } from './app.component';
import { ModuleMapLoaderModule } from '@nguniversal/module-map-ngfactory-loader';
import { TodosService } from './services';
import { TodosService as TodosServiceDeclaration } from './services/todos';

@NgModule({
  imports: [
    AppModule,
    ServerModule,
    ModuleMapLoaderModule,
  ],
  providers: [
    {
      provide: TodosServiceDeclaration,
      useClass: TodosService
    }
  ],
  bootstrap: [AppComponent],
})
export class AppServerModule {}


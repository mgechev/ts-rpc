import { NgModule } from '@angular/core';
import { ServerModule } from '@angular/platform-server';

import { AppModule } from './app.module';
import { AppComponent } from './app.component';
import { TodosService } from './server';
import { TodosService as TodosServiceDeclaration } from './services/todos';
import { TSRPCAngularModule, wrapServices } from 'ts-rpc-angular/server';

wrapServices([{
  provide: TodosServiceDeclaration,
  useClass: TodosService
}]);

@NgModule({
  imports: [
    AppModule,
    ServerModule,
    TSRPCAngularModule.register(
      {
        provide: TodosServiceDeclaration,
        useClass: TodosService
      }
    )
  ],
  bootstrap: [AppComponent],
})
export class AppServerModule {}


import { TodosService } from './client/todos';
import { TodosServiceToken } from './services/todos';

import { BrowserModule, BrowserTransferStateModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { TodosComponent } from './todos/todos.component';
import { TodoComponent } from './todos/todo/todo.component';
import { TodosFilter } from './todos/todos.pipe';
import { Fetch, Host } from 'ts-rpc';

@NgModule({
  declarations: [AppComponent, TodosComponent, TodoComponent, TodosFilter],
  providers: [
    {
      provide: Fetch,
      useValue: fetch
    },
    {
      provide: Host,
      useValue: 'http://127.0.0.1:9211'
    },
    {
      provide: TodosServiceToken,
      useClass: TodosService
    }
  ],
  imports: [BrowserModule.withServerTransition({ appId: 'serverApp' }), BrowserTransferStateModule],
  bootstrap: [AppComponent]
})
export class AppModule {}

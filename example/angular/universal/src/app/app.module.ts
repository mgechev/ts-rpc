import { TodosService } from './client/todos';
import { TodosServiceToken } from './services/todos';

import { BrowserModule, BrowserTransferStateModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { TodosComponent } from './todos/todos.component';
import { TodoComponent } from './todos/todo/todo.component';
import { TodosFilter } from './todos/todos.pipe';

export function todoServiceFactory() {
  return new TodosService(fetch, 'http://127.0.0.1:9211');
}

@NgModule({
  declarations: [AppComponent, TodosComponent, TodoComponent, TodosFilter],
  providers: [
    {
      provide: TodosServiceToken,
      useFactory: todoServiceFactory
    }
  ],
  imports: [BrowserModule.withServerTransition({ appId: 'serverApp' }), BrowserTransferStateModule],
  bootstrap: [AppComponent]
})
export class AppModule {}

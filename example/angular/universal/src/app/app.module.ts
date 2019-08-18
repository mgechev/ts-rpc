import { TodosService } from './services/todos';

import {
  BrowserModule,
} from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { TodosComponent } from './todos/todos.component';
import { TodoComponent } from './todos/todo/todo.component';
import { TodosFilter } from './todos/todos.pipe';

import { serviceFactory } from 'ts-rpc-reflect';

export function todoServiceFactory() {
  return serviceFactory(
    TodosService,
    {
      fetch: ((typeof global !== 'undefined' ? global : window) as any).fetch,
      host: 'http://127.0.0.1:9211',
    }
  );
}

@NgModule({
  declarations: [AppComponent, TodosComponent, TodoComponent, TodosFilter],
  providers: [
    {
      provide: TodosService,
      useFactory: todoServiceFactory
    }
  ],
  imports: [
    BrowserModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}

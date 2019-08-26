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

// Use tree-shakable providers
// export function todoServiceFactory() {
//   return serviceFactory(TodosService);
// }

@NgModule({
  declarations: [AppComponent, TodosComponent, TodoComponent, TodosFilter],
  // providers: [
  //   // TodosService,
  // ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'app' }),
    BrowserModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}

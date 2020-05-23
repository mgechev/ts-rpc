import {
  BrowserModule,
} from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { TodosComponent } from './todos/todos.component';
import { TodoComponent } from './todos/todo/todo.component';
import { TodosFilter } from './todos/todos.pipe';

@NgModule({
  declarations: [AppComponent, TodosComponent, TodoComponent, TodosFilter],
  imports: [
    BrowserModule.withServerTransition({ appId: 'app' }),
    BrowserModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}

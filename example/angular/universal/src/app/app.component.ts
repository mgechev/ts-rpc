import { Component, Inject, OnInit } from '@angular/core';
import { Todo } from './models/todo';
import { TodosService } from './services/todos';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  todos: Todo[] = [];

  constructor(private todoService: TodosService) {
    this.todos = this.todoService.initialTodos;
  }

  ngOnInit() {
    this.todoService.getAll().then(todos => {
      this.todos = todos;
      return todos;
    });
  }

  addTodo(input: HTMLInputElement) {
    const todo = {
      completed: false,
      label: input.value
    };
    this.todoService.createTodo(todo).then(({ id }) => {
      const result: Todo = { ...todo, id };
      this.todos.push(result);
      console.log('Created', todo);
    });
    input.value = '';
  }

  onChange(todo: Todo) {
    if (!todo.id) {
      return;
    }
    this.todoService.updateTodo(todo).then(() => console.log('Updated', todo));
  }

  onDelete(todo: Todo) {
    if (!todo.id) {
      return;
    }
    const idx = this.todos.findIndex(t => t.id === todo.id);
    if (idx < 0) {
      return;
    }
    console.log('Deleting', idx);
    this.todos.splice(idx, 1);
    this.todoService.deleteTodo(todo);
  }
}

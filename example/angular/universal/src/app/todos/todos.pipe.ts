import { Pipe, PipeTransform } from '@angular/core';
import { Todo } from '../models/todo';

export const enum TodoFilter {
  All = 'all',
  Completed = 'completed',
  Active = 'active'
}

@Pipe({
  pure: false,
  name: 'todosFilter'
})
export class TodosFilter implements PipeTransform {
  transform(todos: Todo[], filter: TodoFilter) {
    return (todos || []).filter(t => {
      if (filter === TodoFilter.All) return true;
      if (filter === TodoFilter.Active && !t.completed) return true;
      if (filter === TodoFilter.Completed && t.completed) return true;
      return false;
    });
  }
}

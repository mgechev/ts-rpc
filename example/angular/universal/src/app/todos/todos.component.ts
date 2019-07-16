import {
  Component,
  Input,
  EventEmitter,
  Output,
  ChangeDetectorRef,
  OnInit,
  OnDestroy
} from '@angular/core';
import { Todo } from '../models/todo';
import { TodoFilter } from './todos.pipe';

@Component({
  templateUrl: 'todos.component.html',
  selector: 'app-todos'
})
export class TodosComponent implements OnInit, OnDestroy {
  @Input() todos: Todo[] | null;
  @Output() update = new EventEmitter();
  @Output() delete = new EventEmitter();
  @Output() add = new EventEmitter();
  private hashListener: EventListenerOrEventListenerObject;

  constructor(private cdRef: ChangeDetectorRef) {}

  ngOnInit() {
    if (typeof window !== 'undefined') {
      window.addEventListener(
        'hashchange',
        (this.hashListener = () => this.cdRef.markForCheck())
      );
    }
  }

  ngOnDestroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('hashchange', this.hashListener);
    }
  }

  get filterValue(): TodoFilter {
    if (typeof window !== 'undefined') {
      return window.location.hash.replace(/^#\//, '') as TodoFilter || TodoFilter.All;
    }
    return TodoFilter.All;
  }

  get itemsLeft() {
    return (this.todos || []).filter(t => !t.completed).length;
  }

  clearCompleted() {
    (this.todos || [])
      .filter(t => t.completed)
      .forEach(t => this.delete.emit(t));
  }
}

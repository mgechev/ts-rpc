import { useState } from 'react';
import { Todo as TodoItem } from '../models/store';
import Todo, { OnDelete, OnEdit } from './todo';

export enum TodoFilter {
  All = 'all',
  Completed = 'completed',
  Active = 'active'
}

export default ({
  todos,
  onDelete,
  onEdit
}: {
  todos: TodoItem[];
  onDelete: OnDelete;
  onEdit: OnEdit;
}) => {
  const [activeState, setActiveState] = useState(
    typeof window !== 'undefined'
      ? (window.location.hash.replace(/^#\//, '') as TodoFilter) ||
          TodoFilter.All
      : TodoFilter.All
  );

  const clearCompleted = () => {};
  const itemsLeft = todos.filter(t => !t.completed).length;

  return (
    <>
      <section className="main">
        <input id="toggle-all" className="toggle-all" type="checkbox" />
        <label htmlFor="toggle-all">Mark all as complete</label>
        <ul className="todo-list">
          {todos.filter(t => {
            switch (activeState) {
              case TodoFilter.Active:
                return !t.completed;
              case TodoFilter.Completed:
                return t.completed;
              default:
                return true;
            }
          }).map(t => (
            <Todo onDelete={onDelete} onEdit={onEdit} key={t.id} todo={t} />
          ))}
        </ul>
      </section>
      <footer className="footer">
        <span className="todo-count">
          <strong>{itemsLeft}</strong> item left
        </span>
        <ul className="filters">
          <li>
            <a
              onClick={() => setActiveState(TodoFilter.All)}
              className={activeState === TodoFilter.All ? 'selected' : ''}
              href="#/"
            >
              All
            </a>
          </li>
          <li>
            <a
              onClick={() => setActiveState(TodoFilter.Active)}
              className={activeState === TodoFilter.Active ? 'selected' : ''}
              href="#/active"
            >
              Active
            </a>
          </li>
          <li>
            <a
              onClick={() => setActiveState(TodoFilter.Completed)}
              className={
                activeState === TodoFilter.Completed ? 'selected' : ''
              }
              href="#/completed"
            >
              Completed
            </a>
          </li>
        </ul>
        <button className="clear-completed" onClick={clearCompleted}>
          Clear completed
        </button>
      </footer>
    </>
  );
};

import { Todo } from '../models/store';
import { useState } from 'react';

export interface OnDelete {
  (id: string): void;
}

export interface OnEdit {
  (todo: Todo): void;
}

export default ({ todo, onDelete, onEdit }: { todo: Todo, onDelete: OnDelete, onEdit: OnEdit }) => {
  const [editMode, setEditMode] = useState(false);

  const toggle = (todo: Todo) => {
    todo.completed = !todo.completed;
    onEdit(todo);
  };

  const onTodoKeyDown = (e: any) => {
    if (e.keyCode !== 13) {
      todo.label = (e.target as any).value;
    } else {
      onEdit(todo);
      setEditMode(false);
    }
  };

  return <>
    <li className={todo.completed ? 'completed': ''}>
      <div className="view">
        <input className="toggle" type="checkbox" checked={todo.completed} onChange={toggle.bind(null, todo)}/>
        <label onDoubleClick={() => setEditMode(!editMode)} style={{ display: editMode ? 'none': 'block' }}>
          {todo.label}
        </label>
        <button className="destroy" style={{cursor: 'pointer'}} onClick={onDelete.bind(null, todo.id)}/>
      </div>
      <input className="edit"
        defaultValue={todo.label}
        style={{display: editMode ? 'block' : 'none'}}
        onKeyDown={onTodoKeyDown}/>
    </li>
    </>;
};

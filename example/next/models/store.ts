import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

export interface Todo {
  id: string;
  label: string;
  completed: boolean;
}

export interface Store {
  todos: Todo[];
}

const initialState: Store = {
  todos: []
};

export enum ActionTypes {
  Add = 'Add',
  Remove = 'Remove',
  Edit = 'Edit',
  SetAll = 'SetAll'
}

interface AddTodo {
  type: ActionTypes.Add;
  todo: Todo;
}

interface EditTodo {
  type: ActionTypes.Edit;
  todo: Todo;
}

interface RemoveTodo {
  type: ActionTypes.Remove;
  id: string;
}

interface SetAll {
  type: ActionTypes.SetAll;
  todos: Todo[];
}

export type Action = AddTodo | EditTodo | RemoveTodo | SetAll;

export const reducer = (state = initialState, action: Action) => {
  switch (action.type) {
    case ActionTypes.Add:
      state.todos = [...state.todos, action.todo];
      return Object.assign({}, state);
    case ActionTypes.SetAll:
      state.todos = [...action.todos];
      return Object.assign({}, state);
    case ActionTypes.Remove:
      state.todos.splice(state.todos.findIndex((val: Todo) => val.id === action.id), 1);
      state.todos = [...state.todos];
      return Object.assign({}, state);
    case ActionTypes.Edit:
      state.todos[state.todos.findIndex((val: Todo) => val.id === action.todo.id)] = action.todo;
      state.todos = [...state.todos];
      return Object.assign({}, state);
    default:
      return state;
  }
};

export function initializeStore(state = initialState) {
  return createStore(reducer, state, applyMiddleware(thunk));
}

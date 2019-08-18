import { TodosService } from './todos.service';
import { ActionTypes, Todo } from './store';

function deleteTodo(service: TodosService) {
  return (id: string) => {
    return async dispatch => {
      await service.deleteTodo({ id });
      dispatch({
        type: ActionTypes.Remove,
        id
      });
    };
  };
}

function editTodo(service: TodosService) {
  return (todo: Todo) => {
    return async dispatch => {
      await service.updateTodo(todo);
      dispatch({
        type: ActionTypes.Edit,
        todo: todo
      });
    };
  };
}

function createTodo(service: TodosService) {
  return (todo: Todo) => {
    return async dispatch => {
      const savedTodo = await service.createTodo(todo);
      dispatch({
        type: ActionTypes.Add,
        todo: savedTodo
      });
    };
  };
}

function getAll(service: TodosService) {
  return () => {
    return async dispatch => {
      const all = await service.getAll() || [];
      all.forEach(todo => {
        dispatch({
          type: ActionTypes.SetAll,
          todos: all
        });
      });
    };
  };
}

let service;
if (typeof window !== "undefined") {
  const { serviceFactory } = require('ts-rpc-reflect');
  service = serviceFactory(TodosService);
} else {
  service = new (require('../server/impl') as any).TodosService();
}

export default {
  createTodo: createTodo(service),
  editTodo: editTodo(service),
  deleteTodo: deleteTodo(service),
  getAll: getAll(service)
};

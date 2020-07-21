import { TodosService as TodosServiceDeclaration } from '../services/todos';
import { Service } from 'ts-rpc-server';
import { findAll, create, update, destroy } from './db';
import { Todo } from '../models/todo';
import { Injectable } from '@angular/core';
import {AuthServiceServer} from 'ts-rpc-lib';

@Injectable()
@Service()
export class TodosService extends TodosServiceDeclaration {
  async getAll(): Promise<Todo[]> {
    const todos = await findAll();
    return todos.sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10));
  }

  async createTodo(todo: Todo): Promise<Todo> {
    const { id } = await create(todo);
    todo.id = id;
    return todo;
  }

  async updateTodo(todo: Todo): Promise<Todo> {
    const _ = await update(todo, {
      where: { id: todo.id }
    });
    return todo;
  }

  deleteTodo({ id }: { id: string }): Promise<void> {
    return destroy({ where: { id } });
  }
}

@Injectable()
@Service()
export class AuthService extends AuthServiceServer {
  constructor() {
    super({
      authenticate(username: string, password: string): string | null {
        // todo: implement for real, calling into db to validate password hash and returning userid
        return '1';
      }
    });
  }
}

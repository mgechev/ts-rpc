import Head from 'next/head';
import React, { Dispatch } from 'react';
import { connect } from 'react-redux';
import Todos from '../components/todos';
import autobind from 'autobind';
import actions from '../models/actions';

import '../node_modules/todomvc-app-css/index.css';
import '../node_modules/todomvc-common/base.css';
import { Action, Todo } from '../models/store';

interface IndexProps {
  dispatch: Dispatch<Action>;
  todos: Todo[];
  editTodo: (todo: Todo) => Action;
  createTodo: (todo: Todo) => Action;
  deleteTodo: (id: string) => Action;
  getAll: () => Action;
}

class Index extends React.Component<IndexProps> {
  constructor(props: IndexProps) {
    super(props);
    this.props.dispatch(this.props.getAll());
  }

  @autobind
  keyDown(e: KeyboardEvent) {
    if (e.keyCode !== 13) return;
    this.props.dispatch(this.props.createTodo({
      id: '',
      label: (e.target as any).value,
      completed: false
    }));
    console.log(this.props);
    (e.target as any).value = '';
  }

  render() {
    return (
      <>
        <Head>
          <title>Full-Stack Next.js</title>
        </Head>
        <section className="todoapp">
          <header className="header">
            <h1>todos</h1>
            <input
              onKeyDown={this.keyDown.bind(this)}
              className="new-todo"
              placeholder="What needs to be done?"
              autoFocus
            />
          </header>
          <Todos
            onDelete={(id: string) => this.props.dispatch(this.props.deleteTodo(id))}
            onEdit={(todo: Todo) => this.props.dispatch(this.props.editTodo(todo))}
            todos={this.props.todos}
          />
        </section>
      </>
    );
  }
}



export default connect(state => ({ ...state }), dispatch => {
  return {
    dispatch,
    ...actions
  }
})(Index);

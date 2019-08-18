import App from 'next/app'
import React from 'react'
import withReduxStore from '../lib/with-redux-store'
import { Provider } from 'react-redux'
import { Store } from 'redux';
import { Store as TodoStore } from '../models/store';

interface TodoAppProps {
  Component: React.Component;
  pageProps: TodoStore;
  reduxStore: Store<TodoStore>;
}

class TodoApp extends App<TodoAppProps> {
  render () {
    const { Component, pageProps, reduxStore } = this.props
    return (
      <Provider store={reduxStore}>
        <Component {...pageProps} />
      </Provider>
    )
  }
}

export default withReduxStore(TodoApp)

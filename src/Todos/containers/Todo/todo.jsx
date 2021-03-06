import React, { Component } from "react";
import { Redirect } from "react-router-dom";
import TodoList from "../../components/TodoList/todoList.jsx";
import Spinner from "../../components/Spinner/spinnerTodo.jsx";
import ErrorMessage from "../../components/ErrorMessage/ErrorMessage.jsx";
import SignOutButton from "../../../Authorization/components/UI/SignOutButton/SignOutButton.jsx";
import * as actions from "../../store/actions/index";
import * as service from "./service";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import classes from "./todo.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlusSquare } from "@fortawesome/free-solid-svg-icons";
import { auth } from "../../../Authorization/store/actions/auth.js";

export class Todo extends Component {
  state = {
    inputText: "",
    warning: false,
    tooManyTodos: false,
  };

  componentDidMount() {
    if (this.props.token) {
      this.props.onFetchTodo(this.props.token, this.props.userId);
    }
  }

  inputChangedHandler = (event) => {
    event.preventDefault();
    if (event.target.value.length <= 60) {
      this.setState({ inputText: event.target.value });
    }
  };

  submitHandler = (event) => {
    event.preventDefault();
    if (this.state.inputText === "") {
      this.setState({ warning: true });
    } else if (
      this.props.token !== null &&
      this.props.userId !== null &&
      !this.props.loading
    ) {
      if (this.props.todos.length >= 5) {
        this.setState({ tooManyTodos: true });
      } else {
        let newTodo = {
          todo: this.state.inputText,
          completed: false,
          delete: false,
        };
        let updatedTodos = [];

        if (this.props.todos) {
          updatedTodos = [...this.props.todos, newTodo];
        } else {
          updatedTodos.push(newTodo);
        }

        this.props.onSubmitTodo(
          this.props.userId,
          updatedTodos,
          this.props.token
        );
        this.setState({ inputText: "" });
      }
    }
  };

  todoDelete = (index) => {
    let endpoint = this.props.endpointsArr[index];
    if (endpoint && this.props.token && this.props.userId) {
      this.props.onDeleteTodo(
        endpoint,
        index,
        this.props.todos,
        this.props.token,
        this.props.userId
      );
    }
  };

  todoCompleted = (index) => {
    let endpoint = this.props.endpointsArr[index];
    if (endpoint && this.props.token && this.props.userId) {
      this.props.onMarkAsCompleted(
        endpoint,
        index,
        this.props.todos[index],
        this.props.token,
        this.props.userId
      );
    }
  };

  errorWarningResetFunction = (stateProperty) => {
    this.setState({ [stateProperty]: false });
  };

  createTodoList = () => {
    let todoList = null;
    if (this.props.todos.length > 0 && !this.props.loading) {
      todoList = (
        <TodoList
          todos={this.props.todos}
          todoDelete={this.todoDelete}
          todoCompleted={this.todoCompleted}
          inputChangedHandler={this.inputChangedHandler}
        />
      );
    }

    if (this.props.token && this.props.userId && this.props.loading) {
      todoList = <Spinner />;
    }

    return todoList;
  };

  createContentWhenUserLoggedIn = () => {
    if (this.props.token && this.props.userId) {
      return (
        <div className={classes.todoComponent} data-test="component-Todo">
          <SignOutButton data-test="component-SignOutButton" />
          <form
            data-test="component-todoForm"
            onSubmit={this.submitHandler}
            className={classes.todoComponentForm}
          >
            <input
              type="text"
              value={this.state.inputText}
              className={classes.todoComponentInput}
              onChange={this.inputChangedHandler}
            />
            <button
              className={classes.todoComponentButton}
              type="submit"
              onClick={this.submitHandler}
            >
              <FontAwesomeIcon icon={faPlusSquare} />
            </button>
          </form>
          <ErrorMessage
            data-test="component-fetchTodoError"
            error={{
              errorText: this.props.fetchTodoError,
              errorType: "fetchTodoError",
            }}
          />
          <ErrorMessage
            data-test="component-submitCompleteDeleteTodoError"
            error={{
              errorText: this.props.submitTodoError,
              errorType: "submitCompleteDeleteTodoError",
            }}
            resetError={this.props.onResetError}
          />
          <ErrorMessage
            data-test="component-maxTodoLimitExceededError"
            error={service.createMaxTodosLimitExceeded(this.state.tooManyTodos)}
            resetError={this.errorWarningResetFunction}
          />

          {this.createTodoList()}

          <ErrorMessage
            data-test="component-warning"
            error={service.createWarning(this.state.warning)}
            resetError={this.errorWarningResetFunction}
          />
        </div>
      );
    } else {
      return null;
    }
  };

  render() {
    let authRedirect = null;

    // celaning todos, endpoints arrays and redirecting to login form
    if (!this.props.token && !this.props.userId && !this.props.loading) {
      this.props.onLogoutUserData();
      authRedirect = <Redirect to="/" data-test="component-redirectToAuth" />;
    }

    return (
      <div>
        {authRedirect}
        {this.createContentWhenUserLoggedIn()}
      </div>
    );
  }
}

Todo.propTypes = {
  todos: PropTypes.array.isRequired,
  endpointsArr: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  fetchTodoError: PropTypes.string.isRequired,
  submitTodoError: PropTypes.string.isRequired,
  submitTodoSuccess: PropTypes.bool.isRequired,
  token: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
  onFetchTodo: PropTypes.func.isRequired,
  onSubmitTodo: PropTypes.func.isRequired,
  onMarkAsCompleted: PropTypes.func.isRequired,
  onDeleteTodo: PropTypes.func.isRequired,
  onResetError: PropTypes.func.isRequired,
  onLogoutUserData: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => {
  return {
    todos: state.todos.todos,
    endpointsArr: state.todos.endpointsArr,
    loading: state.todos.loading,
    fetchTodoError: state.todos.fetchTodoError,
    submitTodoError: state.todos.submitCompleteDeleteTodoError,
    submitTodoSuccess: state.todos.submitTodoSuccess,
    token: state.auth.token,
    userId: state.auth.userId,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    onFetchTodo: (token, userId) => dispatch(actions.fetchTodo(token, userId)),
    onSubmitTodo: (userId, newTodo, token) =>
      dispatch(actions.submitTodo(userId, newTodo, token)),
    onMarkAsCompleted: (endpoint, index, todo, token, userId) =>
      dispatch(actions.markAsCompleted(endpoint, index, todo, token, userId)),
    onDeleteTodo: (endpoint, index, todos, token, userId) =>
      dispatch(actions.deleteTodo(endpoint, index, todos, token, userId)),
    onResetError: (errorType) => dispatch(actions.resetError(errorType)),
    onLogoutUserData: () => dispatch(actions.logoutUserData()),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Todo);

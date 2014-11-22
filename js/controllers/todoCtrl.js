/*global angular */

/**
 * The main controller for the app. The controller:
 * - retrieves and persists the model via the todoStorage service
 * - exposes the model to the template and provides event handlers
 */
angular.module('todomvc')
		.controller('TodoCtrl', function TodoCtrl($scope, $routeParams, $filter, store) {
			'use strict';

			var todos = $scope.todos = store.todos;

			$scope.newTodo = '';
			$scope.editedTodo = null;

			//Here we watch for changes on todos, so if it changes,	we update come counts on it.
			$scope.$watch('todos', function () {
				$scope.remainingCount = $filter('filter')(todos, { completed: false }).length;
				$scope.completedCount = todos.length - $scope.remainingCount;
				$scope.allChecked = !$scope.remainingCount;
			}, true);

			// Monitor the current route for changes and adjust the filter accordingly.
			$scope.$on('$routeChangeSuccess', function () {
				var status = $scope.status = $routeParams.status || '';

				$scope.statusFilter = (status === 'active') ?
				{ completed: false } : (status === 'completed') ?
				{ completed: true } : null;
			});

			$scope.addTodo = function () {
				var newTodo = {
					title: $scope.newTodo.trim(),
					completed: false
				};

				if (newTodo.title === "") {
					return;
				}

				$scope.saving = true;
				store.create(newTodo)
						.then(function success() {
							$scope.newTodo = '';
						})
						.finally(function () {
							$scope.saving = false;
						});
			};

			$scope.editTodo = function (todo) {
				$scope.editedTodo = todo;
				// Clone the original todo to restore it on demand, if edit is canceled.
				$scope.originalTodo = angular.extend({}, todo);
			};

			$scope.saveEdits = function (todo, event) {
				// Blur events are automatically triggered after the form submit event.
				// This does some unfortunate logic handling to prevent saving twice.
				if (event === 'blur' && $scope.saveEvent === 'submit') {
					$scope.saveEvent = null;
					return;
				}

				$scope.saveEvent = event;

				if ($scope.reverted) {
					// Todo edits were reverted-- don't save.
					$scope.reverted = null;
					return;
				}

				todo.title = todo.title.trim();

				if (todo.title === $scope.originalTodo.title) {
					return;
				}

				store[todo.title ? 'put' : 'delete'](todo)
						.then(function success() {
						}, function error() {
							todo.title = $scope.originalTodo.title;
						})
						.finally(function () {
							$scope.editedTodo = null;
						});
			};

			$scope.revertEdits = function (todo) {
				todos[todos.indexOf(todo)] = $scope.originalTodo;
				$scope.editedTodo = null;
				$scope.originalTodo = null;
				$scope.reverted = true;
			};

			$scope.removeTodo = function (todo) {
				store.delete(todo);
			};

			$scope.saveTodo = function (todo) {
				store.put(todo);
			};

			$scope.toggleCompleted = function (todo, completed) {
				if (angular.isDefined(completed)) {
					todo.completed = completed;
				}
				store.put(todo, todos.indexOf(todo))
						.then(function success() {
						}, function error() {
							todo.completed = !todo.completed;
						});
			};

			// we just hand on the function reference.
			$scope.clearCompletedTodos = store.clearCompleted;

			$scope.markAll = function (completed) {
				todos.forEach(function (todo) {
					if (todo.completed !== completed) {
						$scope.toggleCompleted(todo, completed);
					}
				});
			};

			$scope.loginState = 'Login';

			$scope.login = function(user) {
				if ($scope.loginState === 'Login') {
					if (user) {
						store.login(user).then(function success(x) {
							if(x) {
								$scope.loginState = 'Logout';
								$scope.username = user;
							}
						});
					//	$scope.loginState = 'Logout';
					}
				}else {
					store.logout(user).then(function success(x) {
						if (x){
							$scope.loginState = 'Login';
							$scope.username = '';
						}

					});
						//$scope.loginState = 'Login';


				}

			};


		});
import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import './TodoList.css';

type Todo = {
  id: number;
  text: string;
  completed: boolean;
  createdAt: Date;
};

type FilterType = 'all' | 'active' | 'completed';
type SortType = 'newest' | 'oldest' | 'alphabetical';

const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('newest');

  // Load todos from localStorage on initial render
  useEffect(() => {
    const storedTodos = localStorage.getItem('todos');
    if (storedTodos) {
      try {
        // Parse the stored JSON and convert date strings back to Date objects
        const parsedTodos = JSON.parse(storedTodos).map((todo: any) => ({
          ...todo,
          createdAt: new Date(todo.createdAt)
        }));
        setTodos(parsedTodos);
      } catch (e) {
        console.error('Failed to parse todos from localStorage', e);
      }
    }
  }, []);

  // Save todos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate input
    if (!inputValue.trim()) {
      setError('Task cannot be empty');
      return;
    }
    
    // Check for duplicate task
    if (todos.some(todo => todo.text.toLowerCase() === inputValue.trim().toLowerCase())) {
      setError('This task already exists');
      return;
    }
    
    // Add new todo
    const newTodo: Todo = {
      id: Date.now(),
      text: inputValue.trim(),
      completed: false,
      createdAt: new Date()
    };
    
    setTodos(prevTodos => [newTodo, ...prevTodos]);
    setInputValue('');
    setError('');
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (error) setError('');
  };

  const toggleTodo = (id: number) => {
    setTodos(prevTodos =>
      prevTodos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: number) => {
    setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
  };

  const clearCompleted = () => {
    setTodos(prevTodos => prevTodos.filter(todo => !todo.completed));
  };

  // Apply filter and sort to todos
  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const sortedTodos = [...filteredTodos].sort((a, b) => {
    if (sort === 'newest') {
      return b.createdAt.getTime() - a.createdAt.getTime();
    } else if (sort === 'oldest') {
      return a.createdAt.getTime() - b.createdAt.getTime();
    } else {
      // alphabetical
      return a.text.localeCompare(b.text);
    }
  });

  return (
    <div className="todo-container">
      <h1>Todo List</h1>
      
      <form onSubmit={handleSubmit} className="todo-form">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Add a new task"
          className={error ? 'error' : ''}
        />
        <button type="submit">Add</button>
      </form>
      {error && <p className="error-message">{error}</p>}
      
      <div className="todo-controls">
        <div className="filter-controls">
          <button 
            className={filter === 'all' ? 'active' : ''} 
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={filter === 'active' ? 'active' : ''} 
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button 
            className={filter === 'completed' ? 'active' : ''} 
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
        </div>
        
        <div className="sort-controls">
          <label>Sort by: </label>
          <select 
            value={sort}
            onChange={(e) => setSort(e.target.value as SortType)}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="alphabetical">A-Z</option>
          </select>
        </div>
      </div>
      
      {sortedTodos.length > 0 ? (
        <ul className="todo-list">
          {sortedTodos.map(todo => (
            <li key={todo.id} className={todo.completed ? 'completed' : ''}>
              <div className="todo-content">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                />
                <span className="todo-text">{todo.text}</span>
              </div>
              <button 
                className="delete-btn"
                onClick={() => deleteTodo(todo.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-message">No tasks found</p>
      )}
      
      {todos.some(todo => todo.completed) && (
        <button 
          className="clear-btn" 
          onClick={clearCompleted}
        >
          Clear completed
        </button>
      )}
      
      <div className="todo-stats">
        <p>{todos.filter(todo => !todo.completed).length} tasks left</p>
      </div>
    </div>
  );
};

export default TodoList; 
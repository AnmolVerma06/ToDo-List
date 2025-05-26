import { useState, useEffect, useRef } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import './TodoList.css';

// Default categories with icons
const DEFAULT_CATEGORIES = [
  { id: 'cleaning', name: 'Cleaning', icon: '🧹' },
  { id: 'work', name: 'Work', icon: '💼' },
  { id: 'errands', name: 'Shopping', icon: '🛒' },
  { id: 'learning', name: 'Learning', icon: '📚' },
  { id: 'health', name: 'Health', icon: '🏥' }
];

// Category emojis by use case
const CATEGORY_EMOJIS = {
  productivity: ['💼', '💻', '📊', '📈', '⏰'],
  personal: ['🏠', '🛌', '🧘', '🏋️', '🎮'],
  education: ['📚', '✏️', '🔬', '🎓', '🧠'],
  errands: ['🛒', '🚗', '📱', '💰', '📫'],
  household: ['🧹', '🧺', '🍽️', '🪴', '🛠️'],
  health: ['🏥', '💊', '🍎', '🏃', '💆'],
  events: ['🎉', '🎂', '🎯', '👥', '📅'],
  travel: ['✈️', '🏖️', '🏞️', '🗺️', '🧳'],
  food: ['🍕', '🥗', '🍲', '🛒', '📝'],
};

// Validation constants
const VALIDATION = {
  task: {
    minLength: 2,
    maxLength: 100,
    forbiddenChars: /[<>{}\\]/g,
    profanityList: ['MC', 'BC', 'BKL', 'motherfucker'], // Add actual words as needed
  },
  category: {
    minLength: 2,
    maxLength: 20,
    forbiddenChars: /[<>{}\\\/]/g,
    reservedNames: ['default', 'all', 'system', 'none', 'general']
  }
};

type Category = {
  id: string;
  name: string;
  icon: string;
};

type Todo = {
  id: number;
  text: string;
  completed: boolean;
  createdAt: string;
  categoryId: string;
};

type FilterType = 'all' | 'active' | 'completed';
type EmojiCategory = keyof typeof CATEGORY_EMOJIS;
type SortMethod = 'newest' | 'oldest' | 'alphabetical' | 'completed' | 'priority';
type ValidationError = string | null;

// Save a string to localStorage
const saveStringToLocalStorage = (string: string) => {
  localStorage.setItem("string", JSON.stringify(string));
};

// Add the All tasks category constant
const ALL_TASKS_CATEGORY = { id: 'all', name: 'All tasks', icon: '📋' };

const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const stored = localStorage.getItem('todos');
    return stored ? JSON.parse(stored) : [];
  });
  const [inputValue, setInputValue] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [iconInput, setIconInput] = useState('');
  const [error, setError] = useState<ValidationError>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [categories, setCategories] = useState<Category[]>(() => {
    const stored = localStorage.getItem('categories');
    return stored ? JSON.parse(stored) : [];
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isEditingTodo, setIsEditingTodo] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [editInputValue, setEditInputValue] = useState('');
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState<EmojiCategory>('productivity');
  const [sortMethod, setSortMethod] = useState<SortMethod>('newest');
  const [showSortOptions, setShowSortOptions] = useState(false);
  
  // Refs for animations
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  
  // Calculate progress
  const totalTasks = todos.length;
  const completedTasks = todos.filter(todo => todo.completed).length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Click outside handler for sort menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setShowSortOptions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Validate task text
  const validateTaskInput = (text: string): ValidationError => {
    // Empty check
    if (!text.trim()) {
      return 'Task cannot be empty';
    }
    
    // Length check
    if (text.trim().length < VALIDATION.task.minLength) {
      return `Task must be at least ${VALIDATION.task.minLength} characters`;
    }
    
    if (text.trim().length > VALIDATION.task.maxLength) {
      return `Task cannot exceed ${VALIDATION.task.maxLength} characters`;
    }
    
    // Forbidden characters
    if (VALIDATION.task.forbiddenChars.test(text)) {
      return 'Task contains invalid characters';
    }
    
    // Profanity check
    const lowerText = text.toLowerCase();
    for (const word of VALIDATION.task.profanityList) {
      if (lowerText.includes(word.toLowerCase())) {
        return 'Task contains inappropriate language';
      }
    }
    
    // Duplicate check (specific to the current category)
    if (todos.some(todo => 
      todo.text.toLowerCase() === text.trim().toLowerCase() && 
      todo.categoryId === selectedCategory
    )) {
      return 'This task already exists in this category';
    }
    
    return null;
  };
  
  // Validate category name
  const validateCategoryInput = (name: string): ValidationError => {
    // Empty check
    if (!name.trim()) {
      return 'Category name cannot be empty';
    }
    
    // Length check
    if (name.trim().length < VALIDATION.category.minLength) {
      return `Category name must be at least ${VALIDATION.category.minLength} characters`;
    }
    
    if (name.trim().length > VALIDATION.category.maxLength) {
      return `Category name cannot exceed ${VALIDATION.category.maxLength} characters`;
    }
    
    // Forbidden characters
    if (VALIDATION.category.forbiddenChars.test(name)) {
      return 'Category name contains invalid characters';
    }
    
    // Reserved name check
    const lowerName = name.trim().toLowerCase();
    if (VALIDATION.category.reservedNames.includes(lowerName)) {
      return 'This category name is reserved';
    }
    
    // Duplicate check
    if (categories.some(cat => cat.name.toLowerCase() === lowerName)) {
      return 'This category already exists';
    }
    
    return null;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate input
    const validationError = validateTaskInput(inputValue);
    if (validationError) {
      setError(validationError);
      
      if (inputRef.current) {
        inputRef.current.classList.add('shake-animation');
        setTimeout(() => {
          inputRef.current?.classList.remove('shake-animation');
        }, 500);
      }
      
      return;
    }
    
    // Add new todo
    const newTodo: Todo = {
      id: Date.now(),
      text: inputValue.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      categoryId: selectedCategory
    };
    
    setTodos(prevTodos => [newTodo, ...prevTodos]);
    setInputValue('');
    setError(null);
    
    // Add animation to form
    if (formRef.current) {
      formRef.current.classList.add('pulse-animation');
      setTimeout(() => {
        formRef.current?.classList.remove('pulse-animation');
      }, 500);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (error) setError(null);
  };

  const toggleTodo = (id: number) => {
    // First, mark the task as being completed for animation
    setCompletingId(id);
    
    // After a delay, update the state
    setTimeout(() => {
      setTodos(prevTodos =>
        prevTodos.map(todo =>
          todo.id === id ? { ...todo, completed: !todo.completed } : todo
        )
      );
      setCompletingId(null);
    }, 300);
  };

  const deleteTodo = (id: number) => {
    // First, mark the task as being deleted for animation
    setDeletingId(id);
    
    // After animation completes, remove from state
    setTimeout(() => {
      setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
      setDeletingId(null);
    }, 300);
  };

  const clearCompleted = () => {
    setTodos(prevTodos => prevTodos.filter(todo => !todo.completed));
  };
  
  const handleAddCategory = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate category name
    const validationError = validateCategoryInput(categoryInput);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    const icon = iconInput.trim() || '📝';
    
    const newCategory: Category = {
      id: `category-${Date.now()}`,
      name: categoryInput.trim(),
      icon: icon
    };
    
    setCategories(prev => [...prev, newCategory]);
    setCategoryInput('');
    setIconInput('');
    setIsAddingCategory(false);
    setSelectedCategory(newCategory.id);
    setError(null);
  };

  const selectEmoji = (emoji: string) => {
    setIconInput(emoji);
  };
  
  const handleEditTodo = (todo: Todo) => {
    setEditingTodo(todo);
    setEditInputValue(todo.text);
    setIsEditingTodo(true);
  };
  
  const handleUpdateTodo = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Special validation for edit - we don't need to check for duplication with the current task
    let validationError: ValidationError = null;
    
    if (!editInputValue.trim()) {
      validationError = 'Task cannot be empty';
    } else if (editInputValue.trim().length < VALIDATION.task.minLength) {
      validationError = `Task must be at least ${VALIDATION.task.minLength} characters`;
    } else if (editInputValue.trim().length > VALIDATION.task.maxLength) {
      validationError = `Task cannot exceed ${VALIDATION.task.maxLength} characters`;
    } else if (VALIDATION.task.forbiddenChars.test(editInputValue)) {
      validationError = 'Task contains invalid characters';
    } else {
      // Profanity check
      const lowerText = editInputValue.toLowerCase();
      for (const word of VALIDATION.task.profanityList) {
        if (lowerText.includes(word.toLowerCase())) {
          validationError = 'Task contains inappropriate language';
          break;
        }
      }
      
      // Check for duplicate (but not the current task)
      if (!validationError && editingTodo && todos.some(todo => 
        todo.id !== editingTodo.id &&
        todo.text.toLowerCase() === editInputValue.trim().toLowerCase() && 
        todo.categoryId === editingTodo.categoryId
      )) {
        validationError = 'This task already exists in this category';
      }
    }
    
    if (validationError) {
      setError(validationError);
      return;
    }
    
    // Update the todo
    if (editingTodo) {
      setTodos(prevTodos => 
        prevTodos.map(todo => 
          todo.id === editingTodo.id 
            ? { ...todo, text: editInputValue.trim() } 
            : todo
        )
      );
      
      setIsEditingTodo(false);
      setEditingTodo(null);
      setEditInputValue('');
      setError(null);
    }
  };
  
  const deleteCategory = (categoryId: string) => {
    // Don't delete if it's the last category
    if (categories.length <= 1) {
      setError("Can't delete the last category");
      return;
    }
    
    // Delete the category
    const updatedCategories = categories.filter(cat => cat.id !== categoryId);
    setCategories(updatedCategories);
    
    // Delete all todos in that category
    setTodos(prevTodos => prevTodos.filter(todo => todo.categoryId !== categoryId));
    
    // Set selected category to the first available one
    setSelectedCategory(updatedCategories[0].id);
    setError(null);
  };

  const toggleSortMenu = () => {
    setShowSortOptions(prev => !prev);
  };

  const handleSortChange = (method: SortMethod) => {
    setSortMethod(method);
    setShowSortOptions(false);
  };

  // Get the sort icon based on current method
  const getSortIcon = () => {
    switch (sortMethod) {
      case 'newest': return '🕒↓';
      case 'oldest': return '🕒↑';
      case 'alphabetical': return 'A→Z';
      case 'completed': return '✓→✗';
      case 'priority': return '🔴→🔵'; 
      default: return '🕒↓';
    }
  };

  // Update filteredTodos to show all todos if selectedCategory is 'all'
  const filteredTodos = (() => {
    // 1. Start with all todos or just the selected category
    let result = selectedCategory === 'all'
      ? todos
      : todos.filter(todo => todo.categoryId === selectedCategory);

    // 2. Apply filter (all/active/completed)
    if (filter === 'active') {
      result = result.filter(todo => !todo.completed);
    } else if (filter === 'completed') {
      result = result.filter(todo => todo.completed);
    }

    // 3. Apply sorting
    result = result.slice().sort((a, b) => {
      switch (sortMethod) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'alphabetical':
          return a.text.localeCompare(b.text);
        case 'completed':
          return (a.completed === b.completed) ? 0 : a.completed ? 1 : -1;
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  })();

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>TO-DO LIST</h1>
      </header>
      
      <div className="main-content">
        <div className="left-panel">
          <div className="category-header">
            <h2>
              {categories.find(cat => cat.id === selectedCategory)?.icon || '📝'}{' '}
              {categories.find(cat => cat.id === selectedCategory)?.name || 'Tasks'}
            </h2>
          </div>
          
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
            
            <div className="sort-dropdown" ref={sortMenuRef}>
              <button 
                className="sort-btn"
                onClick={toggleSortMenu}
                aria-label="Sort tasks"
              >
                Sort {getSortIcon()}
              </button>
              
              {showSortOptions && (
                <div className="sort-options">
                  <button 
                    className={sortMethod === 'newest' ? 'active' : ''}
                    onClick={() => handleSortChange('newest')}
                  >
                    Newest First 🕒↓
                  </button>
                  <button 
                    className={sortMethod === 'oldest' ? 'active' : ''}
                    onClick={() => handleSortChange('oldest')}
                  >
                    Oldest First 🕒↑
                  </button>
                  <button 
                    className={sortMethod === 'alphabetical' ? 'active' : ''}
                    onClick={() => handleSortChange('alphabetical')}
                  >
                    Alphabetical A→Z
                  </button>
                  <button 
                    className={sortMethod === 'completed' ? 'active' : ''}
                    onClick={() => handleSortChange('completed')}
                  >
                    Incomplete First ✓→✗
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="todos-container">
            {filteredTodos.length > 0 ? (
              <ul className="todo-list">
                {filteredTodos.map(todo => (
                  <li 
                    key={todo.id} 
                    className={`
                      ${todo.completed ? 'completed' : ''}
                      ${completingId === todo.id ? 'task-complete-animation' : ''}
                      ${deletingId === todo.id ? 'task-delete-animation' : ''}
                    `}
                  >
                    <div className="todo-content">
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => toggleTodo(todo.id)}
                        aria-label={`Mark "${todo.text}" as ${todo.completed ? 'incomplete' : 'complete'}`}
                      />
                      <span className="todo-text">
                        {todo.text}
                        {selectedCategory === 'all' && (
                          <span className="todo-category-label"> ({categories.find(cat => cat.id === todo.categoryId)?.name || 'Unknown'})</span>
                        )}
                      </span>
                    </div>
                    <div className="todo-actions">
                      <button 
                        className="edit-btn"
                        onClick={() => handleEditTodo(todo)}
                        aria-label="Edit task"
                      >
                        ✏️
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => deleteTodo(todo.id)}
                        aria-label="Delete task"
                      >
                        🗑️
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-message">No tasks found in this category</p>
            )}
            
            {todos.some(todo => todo.completed && todo.categoryId === selectedCategory) && (
              <button 
                className="clear-btn" 
                onClick={clearCompleted}
              >
                Clear completed
              </button>
            )}
          </div>
        </div>
        
        <div className="right-panel">
          <div className="progress-card">
            <h3>Today's Progress</h3>
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <span className="progress-text">{progressPercentage}%</span>
            </div>
          </div>
          
          <div className="add-task-card">
            <h3>Add New Task</h3>
            <form ref={formRef} onSubmit={handleSubmit} className="todo-form">
              <div className="form-group">
                <label htmlFor="taskName">Task Name:</label>
                <input
                  id="taskName"
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder="Enter your task"
                  className={error ? 'error' : ''}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="categorySelect">Category:</label>
                <select
                  id="categorySelect"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="category-select"
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <button type="submit" className="add-btn">Add Task</button>
            </form>
            {error && <p className="error-message">{error}</p>}
          </div>
        </div>
      </div>
      
      <div className="category-bar">
        {/* Update the categories bar to include All tasks as the first item */}
        <div 
          className="category-item all-tasks"
          onClick={() => setSelectedCategory('all')}
        >
          <span className="category-icon">{ALL_TASKS_CATEGORY.icon}</span>
          <span className="category-name">{ALL_TASKS_CATEGORY.name}</span>
        </div>
        
        {categories.map(category => (
          <div 
            key={category.id}
            className={`category-item ${selectedCategory === category.id ? 'active' : ''}`}
          >
            <div className="category-content" onClick={() => setSelectedCategory(category.id)}>
              <span className="category-icon">{category.icon}</span>
              <span className="category-name">{category.name}</span>
            </div>
            <button 
              className="category-delete-btn" 
              onClick={(e) => {
                e.stopPropagation();
                deleteCategory(category.id);
              }}
              aria-label={`Delete ${category.name} category`}
            >
              ✕
            </button>
          </div>
        ))}
        
        <div 
          className="category-item add-category"
          onClick={() => setIsAddingCategory(true)}
        >
          <span className="category-icon">➕</span>
          <span className="category-name">Add Category</span>
        </div>
      </div>
      
      {/* Add Category Modal */}
      {isAddingCategory && (
        <div className="modal-overlay">
          <div className="modal-content category-modal">
            <h3>Add New Category</h3>
            <form onSubmit={handleAddCategory} className="category-form">
              <div className="form-group">
                <label htmlFor="categoryName">Category Name:</label>
                <input
                  id="categoryName"
                  type="text"
                  value={categoryInput}
                  onChange={(e) => {
                    setCategoryInput(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Category name"
                  className={error ? 'error' : ''}
                />
                <small className="form-hint">
                  2-20 characters, no special characters
                </small>
              </div>
              
              <div className="form-group">
                <label>Choose an Icon:</label>
                <div className="emoji-selector-tabs">
                  {(Object.keys(CATEGORY_EMOJIS) as EmojiCategory[]).map(category => (
                    <button 
                      key={category} 
                      type="button"
                      className={selectedEmojiCategory === category ? 'active' : ''}
                      onClick={() => setSelectedEmojiCategory(category)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                
                <div className="emoji-grid">
                  {CATEGORY_EMOJIS[selectedEmojiCategory].map(emoji => (
                    <button 
                      key={emoji} 
                      type="button" 
                      className={`emoji-btn ${iconInput === emoji ? 'selected' : ''}`} 
                      onClick={() => selectEmoji(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                
                <div className="selected-emoji">
                  <span>Selected: </span>
                  <span className="emoji-preview">{iconInput || '📝'}</span>
                </div>
              </div>
              
              <div className="modal-actions">
                <button type="button" onClick={() => {
                  setIsAddingCategory(false);
                  setError(null);
                }} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="add-btn">
                  Add Category
                </button>
              </div>
              
              {error && <p className="error-message modal-error">{error}</p>}
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Todo Modal */}
      {isEditingTodo && editingTodo && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit Task</h3>
            <form onSubmit={handleUpdateTodo} className="edit-form">
              <div className="form-group">
                <label htmlFor="editTaskName">Task Name:</label>
                <input
                  id="editTaskName"
                  type="text"
                  value={editInputValue}
                  onChange={(e) => {
                    setEditInputValue(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Edit your task"
                  className={error ? 'error' : ''}
                  autoFocus
                />
                <small className="form-hint">
                  2-100 characters, no special characters
                </small>
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsEditingTodo(false);
                    setEditingTodo(null);
                    setEditInputValue('');
                    setError(null);
                  }} 
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button type="submit" className="add-btn">
                  Update Task
                </button>
              </div>
              
              {error && <p className="error-message modal-error">{error}</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodoList; 
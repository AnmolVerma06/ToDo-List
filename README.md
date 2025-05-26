# React Todo List Application

A feature-rich Todo List application built with React and TypeScript that allows users to manage tasks efficiently.

## Features

- **Add Tasks**: Create new tasks with validation to prevent empty or duplicate entries
- **Complete Tasks**: Mark tasks as completed with a checkbox
- **Delete Tasks**: Remove unwanted tasks from the list
- **Filter Tasks**: View all tasks, only active tasks, or only completed tasks
- **Sort Tasks**: Sort tasks by newest first, oldest first, or alphabetically
- **Persistence**: Tasks are saved to localStorage so they persist between page refreshes
- **Responsive Design**: Works well on both desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js (v14 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd to-do-list
```

2. Install the dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to the URL provided in the terminal (typically http://localhost:5173)

## Usage

- **Add a Task**: Type a task in the input field and click "Add" or press Enter
- **Complete a Task**: Click the checkbox next to a task to mark it as completed
- **Delete a Task**: Click the "Delete" button next to a task to remove it
- **Filter Tasks**: Use the "All", "Active", and "Completed" buttons to filter tasks
- **Sort Tasks**: Use the dropdown menu to sort tasks by different criteria
- **Clear Completed Tasks**: Use the "Clear completed" button to remove all completed tasks at once

## Testing

To test the application functionality:

1. Add a few tasks
2. Mark some tasks as completed
3. Test the filtering options
4. Test the sorting options
5. Delete a task
6. Clear all completed tasks
7. Refresh the page to confirm that tasks persist in localStorage

## Building for Production

To build the application for production:

```bash
npm run build
```

The build files will be located in the `dist` directory.

## Technologies Used

- React
- TypeScript
- Vite
- CSS
- LocalStorage API

## License

This project is licensed under the MIT License - see the LICENSE file for details.

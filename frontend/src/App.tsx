import { useState } from 'react';
import './App.css';
import { isAuthenticated, logout } from './api/auth';
import LoginPage from './components/LoginPage';
import TaskList from './components/TaskList';

function App() {
  const [authed, setAuthed] = useState(isAuthenticated);

  const handleAuth = () => setAuthed(true);
  const handleLogout = () => {
    logout();
    setAuthed(false);
  };

  if (!authed) return <LoginPage onAuth={handleAuth} />;

  return (
    <div className="app">
      <header>
        <h1>OpKit</h1>
        <button onClick={handleLogout} className="btn-logout">
          Logout
        </button>
      </header>
      <TaskList token={localStorage.getItem('token')!} />
    </div>
  );
}

export default App;

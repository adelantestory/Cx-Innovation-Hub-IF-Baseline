import { useState } from 'react';
import type { User, Project } from './types';
import UserSelect from './components/UserSelect';
import ProjectList from './components/ProjectList';
import Board from './components/Board';
import Header from './components/Header';

type View = 'userSelect' | 'projectList' | 'board';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('userSelect');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  function handleSelectUser(user: User) {
    setCurrentUser(user);
    setCurrentView('projectList');
  }

  function handleSwitchUser() {
    setCurrentUser(null);
    setSelectedProject(null);
    setCurrentView('userSelect');
  }

  function handleSelectProject(project: Project) {
    setSelectedProject(project);
    setCurrentView('board');
  }

  function handleBackToProjects() {
    setSelectedProject(null);
    setCurrentView('projectList');
  }

  if (currentView === 'userSelect') {
    return <UserSelect onSelectUser={handleSelectUser} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header
        currentUser={currentUser!}
        onSwitchUser={handleSwitchUser}
        onGoToProjects={handleBackToProjects}
      />
      {currentView === 'projectList' && (
        <ProjectList
          onSelectProject={handleSelectProject}
        />
      )}
      {currentView === 'board' && selectedProject && (
        <Board
          project={selectedProject}
          currentUser={currentUser!}
          onBack={handleBackToProjects}
        />
      )}
    </div>
  );
}

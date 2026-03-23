import { useState } from "react";
import type { User, Project } from "./api/types";
import UserSelect from "./components/users/UserSelect";
import ProjectList from "./components/projects/ProjectList";
import Board from "./components/kanban/Board";
import Header from "./components/layout/Header";

type AppView = "user-select" | "project-list" | "board";

export default function App() {
  const [view, setView] = useState<AppView>("user-select");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  function handleSelectUser(user: User) {
    setCurrentUser(user);
    setView("project-list");
  }

  function handleSelectProject(project: Project) {
    setSelectedProject(project);
    setView("board");
  }

  function handleSwitchUser() {
    setCurrentUser(null);
    setSelectedProject(null);
    setView("user-select");
  }

  function handleNavigateHome() {
    setSelectedProject(null);
    setView("project-list");
  }

  if (view === "user-select") {
    return <UserSelect onSelectUser={handleSelectUser} />;
  }

  if (!currentUser) {
    return <UserSelect onSelectUser={handleSelectUser} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        user={currentUser}
        onSwitchUser={handleSwitchUser}
        onNavigateHome={handleNavigateHome}
      />
      {view === "project-list" && (
        <ProjectList onSelectProject={handleSelectProject} />
      )}
      {view === "board" && selectedProject && (
        <Board
          project={selectedProject}
          currentUser={currentUser}
          onBack={() => setView("project-list")}
        />
      )}
    </div>
  );
}

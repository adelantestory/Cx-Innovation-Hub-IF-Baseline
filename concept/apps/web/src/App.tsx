// =============================================================================
// App Root Component
// =============================================================================
// Top-level component managing navigation between three views:
//   1. User Selection (landing screen)
//   2. Project List (after user selection)
//   3. Kanban Board (after project selection)
//
// Navigation is managed via simple state (no router library needed for POC).
// =============================================================================

import { useState } from "react";
import Header from "./components/layout/Header";
import UserSelect from "./components/users/UserSelect";
import ProjectList from "./components/projects/ProjectList";
import Board from "./components/kanban/Board";
import type { User, Project } from "./api/types";

type View = "user-select" | "project-list" | "board";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [view, setView] = useState<View>("user-select");

  function handleSelectUser(user: User) {
    setCurrentUser(user);
    setView("project-list");
  }

  function handleSwitchUser() {
    setCurrentUser(null);
    setCurrentProject(null);
    setView("user-select");
  }

  function handleSelectProject(project: Project) {
    setCurrentProject(project);
    setView("board");
  }

  function handleNavigateHome() {
    setCurrentProject(null);
    setView("project-list");
  }

  function handleBackToProjects() {
    setCurrentProject(null);
    setView("project-list");
  }

  // User selection screen (no header)
  if (view === "user-select" || !currentUser) {
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

      {view === "board" && currentProject && (
        <Board
          project={currentProject}
          currentUser={currentUser}
          onBack={handleBackToProjects}
        />
      )}
    </div>
  );
}

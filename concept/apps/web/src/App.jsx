// App.jsx — Legacy class component
// Issues: class-based, no error handling, API URL hardcoded
import React, { Component } from 'react';
import UserSelect from './components/users/UserSelect.jsx';
import ProjectList from './components/projects/ProjectList.jsx';
import KanbanBoard from './components/kanban/KanbanBoard.jsx';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { view: 'userSelect', currentUser: null, currentProject: null };
  }
  render() {
    const { view, currentUser, currentProject } = this.state;
    if (view === 'userSelect') return (
      <UserSelect onSelect={u => this.setState({ currentUser: u, view: 'projectList' })} />
    );
    if (view === 'projectList') return (
      <ProjectList currentUser={currentUser}
        onSelect={p => this.setState({ currentProject: p, view: 'board' })} />
    );
    return (
      <KanbanBoard project={currentProject} currentUser={currentUser}
        onBack={() => this.setState({ view: 'projectList' })} />
    );
  }
}
export default App;

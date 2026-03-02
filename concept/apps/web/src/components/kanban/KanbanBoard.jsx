// KanbanBoard.jsx — Legacy class component
// Issues: class-based, direct state mutation, no error handling,
//         custom drag-and-drop that breaks on fast moves
import React, { Component } from 'react';

const COLUMNS = ['todo', 'in_progress', 'in_review', 'done'];
const LABELS = { todo: 'To Do', in_progress: 'In Progress', in_review: 'In Review', done: 'Done' };
const API = process.env.REACT_APP_API_URL || 'http://localhost:3000';

class KanbanBoard extends Component {
  constructor(props) {
    super(props);
    this.state = { tasks: [], loading: true, draggingId: null };
    this.handleDragStart = this.handleDragStart.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
  }
  componentDidMount() {
    // No error handling
    fetch(`${API}/api/projects/${this.props.project.id}/tasks`)
      .then(r => r.json())
      .then(tasks => this.setState({ tasks, loading: false }));
  }
  handleDragStart(id) { this.setState({ draggingId: id }); }
  handleDrop(newStatus) {
    const id = this.state.draggingId;
    // BAD: direct state mutation (React anti-pattern)
    const tasks = this.state.tasks;
    const task = tasks.find(t => t.id === id);
    if (task) task.status = newStatus;
    this.setState({ tasks, draggingId: null });
    // Missing Content-Type header
    fetch(`${API}/api/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus, position: 0 })
    });
  }
  render() {
    const { tasks, loading } = this.state;
    const { currentUser, project, onBack } = this.props;
    if (loading) return <p>Loading...</p>;
    return (
      <div>
        <button onClick={onBack}>← Projects</button>
        <h2>{project.name}</h2>
        <div style={{ display: 'flex', gap: 16 }}>
          {COLUMNS.map(col => (
            <div key={col} style={{ minWidth: 220, background: '#f1f5f9', padding: 12 }}
              onDragOver={e => e.preventDefault()}
              onDrop={() => this.handleDrop(col)}>
              <h3>{LABELS[col]}</h3>
              {tasks.filter(t => t.status === col).map(task => (
                <div key={task.id} draggable
                  onDragStart={() => this.handleDragStart(task.id)}
                  style={{
                    background: task.assigned_user_id === currentUser.id ? '#eff6ff' : '#fff',
                    border: '1px solid #e2e8f0', borderRadius: 6, padding: 10, marginBottom: 6
                  }}>
                  <strong>{task.title}</strong>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{task.assigned_user_name || 'Unassigned'}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }
}
export default KanbanBoard;

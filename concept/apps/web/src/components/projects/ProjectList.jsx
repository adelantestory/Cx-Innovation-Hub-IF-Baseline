import React, { Component } from 'react';
const API = process.env.REACT_APP_API_URL || 'http://localhost:3000';
class ProjectList extends Component {
  constructor(props) { super(props); this.state = { projects: [] }; }
  componentDidMount() {
    fetch(`${API}/api/projects`).then(r => r.json()).then(projects => this.setState({ projects }));
  }
  render() {
    return (
      <div style={{ maxWidth: 500, margin: '40px auto' }}>
        <p>Signed in as: <strong>{this.props.currentUser.name}</strong></p>
        <h2>Projects</h2>
        {this.state.projects.map(p => (
          <div key={p.id} onClick={() => this.props.onSelect(p)}
            style={{ padding: 16, marginBottom: 8, background: '#fff', borderRadius: 8, cursor: 'pointer' }}>
            <strong>{p.name}</strong>
          </div>
        ))}
      </div>
    );
  }
}
export default ProjectList;

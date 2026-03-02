import React, { Component } from 'react';
const API = process.env.REACT_APP_API_URL || 'http://localhost:3000';
class UserSelect extends Component {
  constructor(props) { super(props); this.state = { users: [] }; }
  componentDidMount() {
    fetch(`${API}/api/users`).then(r => r.json()).then(users => this.setState({ users }));
  }
  render() {
    return (
      <div style={{ maxWidth: 400, margin: '80px auto', textAlign: 'center' }}>
        <h1>Taskify</h1>
        <h2>Select User</h2>
        {this.state.users.map(u => (
          <button key={u.id} onClick={() => this.props.onSelect(u)}
            style={{ display: 'block', width: '100%', padding: 12, marginBottom: 8, fontSize: 16 }}>
            {u.name} — {u.role}
          </button>
        ))}
      </div>
    );
  }
}
export default UserSelect;

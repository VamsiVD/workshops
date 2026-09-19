import React, { useState, useEffect } from 'react';

const API_URL = "https://74jaiumpab.execute-api.us-east-2.amazonaws.com/notices";

export default function App() {
  const [notices, setNotices] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const fetchNotices = async () => {
    const res = await fetch(API_URL);
    const data = await res.json();
    setNotices(data);
  };

  useEffect(() => { fetchNotices(); }, []);

  const createNotice = async (e) => {
    e.preventDefault();
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content })
    });
    setTitle(''); setContent('');
    fetchNotices();
  };

  const deleteNotice = async (id) => {
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    fetchNotices();
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Notice Board</h1>
      <form onSubmit={createNotice}>
        <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required />
        <br />
        <textarea placeholder="Content" value={content} onChange={e => setContent(e.target.value)} required />
        <br />
        <button type="submit">Add Notice</button>
      </form>
      <h2>All Notices</h2>
      {notices.map(n => (
        <div key={n._id} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px' }}>
          <h3>{n.title}</h3>
          <p>{n.content}</p>
          <button onClick={() => deleteNotice(n._id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}

import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
const features = [
  { icon: '🔒', title: 'Secure by default', description: 'JWT authentication with HttpOnly cookies keeps your notes private and inaccessible to third parties.' },
  { icon: '⚡', title: 'Instant updates', description: 'Create, edit, and delete notes with immediate feedback — no page reloads, no waiting.' },
  { icon: '🗂️', title: 'Stay organized', description: 'Search and sort notes by date or title so you always find exactly what you need.' },
];
const HomePage: React.FC = () => {
  const { isAuthenticated } = useContext(AuthContext);
  return (
    <div>
      <section className="hero-wrapper">
        <span className="hero-badge">✦ Notes App — Your private workspace</span>
        <h1 className="hero-title">
          Capture every thought,<br />
          <span className="grad-text">stay in control.</span>
        </h1>
        <p className="hero-subtitle">
          A clean, fast, and secure notes app built on the MERN stack.
          Your ideas are protected end-to-end.
        </p>
        <div className="hero-cta">
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn-primary">Go to Dashboard →</Link>
          ) : (
            <>
              <Link to="/register" className="btn-primary">Get started — it's free</Link>
              <Link to="/login" className="btn-secondary">Sign in</Link>
            </>
          )}
        </div>
        <div className="hero-stats">
          <div>
            <div className="hero-stat-value">100%</div>
            <div className="hero-stat-label">Private & Secure</div>
          </div>
          <div>
            <div className="hero-stat-value">MERN</div>
            <div className="hero-stat-label">Full-Stack Built</div>
          </div>
          <div>
            <div className="hero-stat-value">0ms</div>
            <div className="hero-stat-label">UI Lag</div>
          </div>
        </div>
      </section>
      <section className="features">
        {features.map((f) => (
          <div key={f.title} className="feature-card">
            <div className="feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.description}</p>
          </div>
        ))}
      </section>
    </div>
  );
};
export default HomePage;
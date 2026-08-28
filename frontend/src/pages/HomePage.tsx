import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <div className="landing-page">
      <main className="landing-main">
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-headline">
              Capture your thoughts.<br />
              Keep them organized.
            </h1>
            <p className="hero-description">
              Memoora gives you a simple, focused space to write, organize, and revisit the ideas that matter.
            </p>
            <div className="hero-actions">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
              ) : (
                <>
                  <Link to="/register" className="btn-primary">Create your first note</Link>
                  <Link to="/login" className="btn-secondary">Sign in</Link>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="hero-visual-section">
          <div className="hero-visual-container">
            <img src="/hero-visual.png" alt="Memoora Productivity" className="hero-visual-image" />
          </div>
        </section>

        <section className="features-section">
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </div>
              <h3>Capture Easily</h3>
              <p>Write down ideas, meeting notes, tasks, and anything worth remembering.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
              </div>
              <h3>Stay Organized</h3>
              <p>Keep your notes in one clean workspace and find what you need quickly.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
              </div>
              <h3>Edit Anytime</h3>
              <p>Create, update, and manage your notes without unnecessary complexity.</p>
            </div>
          </div>
        </section>

        <section className="final-cta-section">
          <h2>Ready to organize your thoughts?</h2>
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
          ) : (
            <Link to="/register" className="btn-primary">Create your first note</Link>
          )}
        </section>
      </main>
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <img src="/memoora-icon.svg" alt="Memoora Icon" style={{ width: '20px', height: '20px' }} />
            <span>Memoora</span>
          </div>
          <p>Your simple space for thoughts and ideas.</p>
          <div className="footer-copyright">© 2026 Memoora</div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
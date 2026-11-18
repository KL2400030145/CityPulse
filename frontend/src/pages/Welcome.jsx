
import React from 'react';

export default function Welcome({ onExplore }) {
  return (
    <div className="welcome-page">
      <nav className="welcome-nav">
        <h2>✦ CityPulse</h2>
        <span>SMART CITY MOBILITY PLATFORM</span>
      </nav>

      <main className="welcome-hero">
        <div className="welcome-tag">
          REAL-TIME MOBILITY INTELLIGENCE
        </div>

        <h1>
          Smarter Cities.
          <br />
          <span>Better Mobility.</span>
        </h1>

        <p>
          Monitor traffic conditions, manage road incidents,
          and explore urban mobility insights through one
          unified platform.
        </p>

        <button onClick={onExplore}>
          Explore Dashboard →
        </button>

        <div className="welcome-features">
          <div>🗺️ <strong>Traffic Monitoring</strong></div>
          <div>🚨 <strong>Incident Management</strong></div>
          <div>📊 <strong>Mobility Analytics</strong></div>
        </div>
      </main>

      <footer>
        CityPulse · Urban Mobility Intelligence
      </footer>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { audioChime } from '../services/audioChime';
import { dataStore } from '../../../mobile/src/services/dataStore';
import { RoomQueue } from '../../../mobile/src/types';

export const MonitorDisplay: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [queue, setQueue] = useState<RoomQueue>(() => dataStore.getCurrentQueue('usr_doc_jenkins'));
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false); // Hide full patient name on TV
  const [callingPulse, setCallingPulse] = useState(false);

  // Live Clock updater
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Real-time queue subscription
  useEffect(() => {
    const unsubscribe = dataStore.subscribeToQueue('usr_doc_jenkins', (newQueue) => {
      // Check if token changed
      setQueue((prevQueue) => {
        if (prevQueue.currentToken !== newQueue.currentToken) {
          // Trigger visual flash
          setCallingPulse(true);
          setTimeout(() => setCallingPulse(false), 3000);

          // Trigger audio chime & announcement
          audioChime.announceToken(newQueue.currentToken, newQueue.roomNumber);
        }
        return { ...newQueue };
      });
    });

    return () => unsubscribe();
  }, []);

  const handleEnableAudio = () => {
    audioChime.enableAudio();
    setAudioEnabled(true);
    audioChime.playChime();
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleTestCallNext = () => {
    dataStore.callNextPatient('usr_doc_jenkins');
  };

  // Format time and date
  const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = currentTime.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

  // Currently called patient details
  const currentUpcoming = queue.upcomingTokens.find(t => t.tokenNumber === queue.currentToken);
  const patientDisplayName = privacyMode
    ? `TOKEN #${queue.currentToken}`
    : (currentUpcoming?.patientName || 'John Doe');

  return (
    <div className="monitor-wrapper">
      {/* Header */}
      <header className="monitor-header">
        <div className="brand-section">
          <div className="brand-logo-badge">🏥</div>
          <div>
            <h1 className="brand-title">UPSTAGE HEALTH</h1>
            <p className="brand-subtitle">Outpatient Clinic Live Queue Display</p>
          </div>
        </div>

        {/* Doctor & Room Badge */}
        <div className="doctor-room-banner">
          <div className="room-number-pill">{queue.roomNumber || 'ROOM 204'}</div>
          <div className="doctor-details">
            <h3>{queue.doctorName || 'Dr. Sarah Jenkins, MD'}</h3>
            <p>{queue.specialty || 'Cardiology'} • Floor 2, West Wing</p>
          </div>
        </div>

        {/* Live Clock */}
        <div className="header-clock-section">
          <div className="live-time">{timeString}</div>
          <div className="live-date">{dateString}</div>
        </div>
      </header>

      {/* Main Screen Area */}
      <main className="monitor-main-content">
        {/* Left Hero Card: Currently Calling Token */}
        <div className={`current-token-hero ${callingPulse ? 'calling-animation' : ''}`}>
          <div className="hero-glass-rim"></div>

          <div className="calling-status-chip">
            <div className="pulse-indicator"></div>
            <span className="calling-status-text">NOW CONSULTING / PLEASE ENTER</span>
          </div>

          <div className="token-big-label">TOKEN NUMBER</div>
          <div className="giant-token-number">
            #{queue.currentToken < 10 ? `0${queue.currentToken}` : queue.currentToken}
          </div>

          <div className="patient-calling-name">
            Patient: {patientDisplayName}
          </div>

          <div className="enter-instruction-box">
            👉 Please proceed directly inside {queue.roomNumber}
          </div>
        </div>

        {/* Right Panel: Upcoming Tokens In Line */}
        <div className="upcoming-queue-panel">
          <div className="upcoming-header">
            <h2>UPCOMING IN QUEUE</h2>
            <div className="waiting-count-badge">
              {queue.upcomingTokens.length} Waiting
            </div>
          </div>

          <div className="upcoming-list">
            {queue.upcomingTokens.map((item, index) => (
              <div key={item.tokenNumber} className="upcoming-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div className="upcoming-token-badge">
                    #{item.tokenNumber < 10 ? `0${item.tokenNumber}` : item.tokenNumber}
                  </div>
                  <div className="upcoming-info">
                    <h4>{privacyMode ? `Patient #${item.tokenNumber}` : item.patientName}</h4>
                    <p>Estimated: {item.timeSlot}</p>
                  </div>
                </div>

                <div className="upcoming-status-tag">
                  {index === 0 ? '👉 Next In Line' : '⏳ In Waiting Area'}
                </div>
              </div>
            ))}

            {queue.upcomingTokens.length === 0 && (
              <div style={{ padding: '30px', textAlign: 'center', color: '#64748B' }}>
                No more upcoming patients in queue for today.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer & Display Controls */}
      <footer className="monitor-footer">
        <div className="footer-ticker">
          <span>🔔 Audio Alert: {audioEnabled ? 'Active (Ding-Dong Chime Ready)' : 'Click "Enable Audio" for sound'}</span>
          <span>•</span>
          <span>Last Called: {queue.lastCalledAt || '10:30 AM'}</span>
        </div>

        <div className="footer-controls">
          <button
            className={`btn-control ${audioEnabled ? 'active' : ''}`}
            onClick={handleEnableAudio}
          >
            {audioEnabled ? '🔊 Sound Enabled' : '🔇 Enable Sound & Chime'}
          </button>

          <button
            className={`btn-control ${privacyMode ? 'active' : ''}`}
            onClick={() => setPrivacyMode(!privacyMode)}
          >
            {privacyMode ? '🔒 Privacy: Token Only' : '👤 Show Names'}
          </button>

          <button className="btn-control" onClick={handleTestCallNext}>
            📢 Test Call Next Token
          </button>

          <button className="btn-control" onClick={handleToggleFullscreen}>
            ⛶ Fullscreen Kiosk
          </button>
        </div>
      </footer>
    </div>
  );
};

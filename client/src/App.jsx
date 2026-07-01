import React, { useState } from 'react';
import './App.css';

function App() {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [result, setResult] = useState(null);

  // Hàm "Clear" xóa trắng các trường văn bản
  const handleClear = () => {
    setDay('');
    setMonth('');
    setYear('');
    setResult(null);
  };

  // Hàm "Close" hiển thị hộp thoại xác nhận
  const handleClose = () => {
    if (window.confirm('Are you sure to exit?')) {
      window.close();
    }
  };

  // Hàm "Check" gọi tới backend API
  const handleCheck = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/check-date', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day, month, year })
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, message: 'Network Error: Cannot connect to server.' });
    }
  };

  return (
    <div className="app-window">
      <div className="window-header">
        <span className="window-title">Date Checker</span>
        <button className="close-btn" onClick={handleClose}>✕</button>
      </div>

      <div className="window-content">
        <div className="logo-container">
          <div className="logo-text">FPT UNIVERSITY</div>
          <div className="logo-subtext">DREAM OF INNOVATION</div>
        </div>

        <h1 className="app-title">Date Time Checker</h1>

        <div className="form-group">
          <label>Day</label>
          <input
            id="day-input"
            type="text"
            placeholder="e.g. 15"
            value={day}
            onChange={(e) => setDay(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Month</label>
          <input
            id="month-input"
            type="text"
            placeholder="e.g. 6"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Year</label>
          <input
            id="year-input"
            type="text"
            placeholder="e.g. 2024"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        </div>

        <div className="button-group">
          <button className="btn-clear" onClick={handleClear}>Clear</button>
          <button className="btn-check" onClick={handleCheck}>Check</button>
        </div>

        {result && (
          <div className={`result-box ${result.success ? 'success' : 'error'}`}>
            {result.success ? '✓ ' : '✗ '}
            {result.message}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

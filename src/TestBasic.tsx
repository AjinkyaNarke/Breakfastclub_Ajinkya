import React from 'react';

// Ultra-minimal test component
export function TestBasic() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: 'green' }}>✅ Basic React Working!</h1>
      <p>If you see this, React is rendering correctly.</p>
      <p>Current time: {new Date().toLocaleTimeString()}</p>
      <button 
        onClick={() => alert('JavaScript working!')}
        style={{ padding: '10px', marginTop: '10px' }}
      >
        Test Click
      </button>
    </div>
  );
}

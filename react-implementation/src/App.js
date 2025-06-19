// cd react-implementation
// npm start


import React, { useEffect, useState } from 'react';

function App() {

  const [userLog, setUserLog] = useState([]);
  const [data, setData] = useState({
    winner: '',
    winText: 'A Measly Worm',
    numberOfTimesText: '',
    victoryReason: 'What defeats a measly worm?',
    emoji: '🐛',
    color: 'green',
    nextFight: '',
    win: true,
    log: '',
  });

  const [defender, setDefender] = useState("A Measly Worm");
  const [log, setLog] = useState('');

  const [input, setInput] = useState('');

  const handleSend = async () => {
    try {
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: [input, defender, log] }),
      });
      setUserLog(userLog => [...userLog, input]);
      const result = await response.json();
      setData(result.result);
      setDefender(result.result.winner);
      setLog(result.result.log);
      console.log('Data set:', data);
      setInput('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };
  const [isSending, setIsSending] = useState(false);

  return (
    <div className="container">
      <h1 style={{ color: data.color }}>{data.winText}</h1>
      <h4>{data.victoryReason}</h4>
      <h5>{data.emoji}</h5>
      <h3 style={{ color: data.color }}>{data.numberOfTimesText}</h3>
      <h2>{data.nextFight}</h2>
      {data.win !== false ? (
        <>
          <input
            type="text"
            value={input}
            onChange={e => {
              const value = e.target.value.replace(/[^a-zA-Z ]/g, '').slice(0, 20);
              setInput(value);
            }}
            placeholder="Type your challenger's name"
            maxLength={20}
            disabled={isSending}
            onKeyDown={async (e) => {
              if ( userLog.includes(e.target.value) ) {
                alert('No repeat inputs allowed. Please enter a new challenger.');
                e.target.value = '';
                return;
              }
              if (
                e.key === 'Enter' &&
                !isSending &&
                input.replace(/\s/g, '').length > 0
              ) {
                setIsSending(true);
                await handleSend();
                setIsSending(false);
              }
            }}
          />
          <button
            onClick={async () => {
              setIsSending(true);
              await handleSend();
              setIsSending(false);
            }}
            disabled={isSending || input.replace(/\s/g, '').length === 0}
          >
            Battle!
          </button>
        </>
      ) : (
        <button
          onClick={() => {
            setData({
              winner: '',
              winText: 'A Measly Worm',
              numberOfTimesText: '',
              victoryReason: 'What defeats a measly worm?',
              emoji: '🐛',
              color: 'green',
              nextFight: '',
              win: true,
              log: '',
            });
            setDefender("A Measly Worm");
            setInput('');
            setLog('');
            setUserLog([]);
          }}
        >
          Reset
        </button>
      )}
      <h6>{data.log}</h6>
    </div>
  );
}

export default App;

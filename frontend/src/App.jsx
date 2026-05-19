import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

const API_BASE = 'http://localhost:5000';

function App() {
  const [stats, setStats] = useState({
    total_trades: 0,
    wins: 0,
    losses: 0,
    win_rate_pct: 0,
    total_pnl: 0,
    avg_rr: 0,
  });
  const [trades, setTrades] = useState([]);
  
  const [formData, setFormData] = useState({
    symbol: '',
    side: 'long',
    quantity: '',
    entry_price: '',
    exit_price: '',
    stop_loss: '',
    take_profit: '',
    fees: 0,
    notes: ''
  });

  const fetchData = async () => {
    try {
      const [statsRes, tradesRes] = await Promise.all([
        fetch(`${API_BASE}/api/stats`),
        fetch(`${API_BASE}/api/trades`)
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (tradesRes.ok) setTrades(await tradesRes.json());
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prepare payload
    const payload = { ...formData };
    Object.keys(payload).forEach(key => {
      if (payload[key] === '') payload[key] = null;
      else if (key !== 'symbol' && key !== 'side' && key !== 'notes') {
        payload[key] = parseFloat(payload[key]);
      }
    });

    try {
      const res = await fetch(`${API_BASE}/api/trades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setFormData({
          symbol: '', side: 'long', quantity: '', entry_price: '', 
          exit_price: '', stop_loss: '', take_profit: '', fees: 0, notes: ''
        });
        fetchData();
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert('Failed to submit trade.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this trade?')) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/trades/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>TradeLab Dashboard</h1>
        <button 
          onClick={() => window.open(`${API_BASE}/api/export`, '_blank')}
          style={{ width: 'auto', padding: '0.5rem 1rem' }}
        >
          Export CSV
        </button>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">Total PnL</div>
          <div className={`stat-value ${stats.total_pnl >= 0 ? 'positive' : 'negative'}`}>
            ${stats.total_pnl.toFixed(2)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Win Rate</div>
          <div className="stat-value">{stats.win_rate_pct}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Total Trades</div>
          <div className="stat-value">{stats.total_trades}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Avg R/R</div>
          <div className="stat-value">{stats.avg_rr.toFixed(2)}</div>
        </div>
      </div>

      <div className="main-content">
        <div className="trades-list">
          <h2>Recent Trades</h2>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Side</th>
                  <th>Qty</th>
                  <th>Entry</th>
                  <th>Exit</th>
                  <th>PnL</th>
                  <th>R/R</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {trades.length === 0 ? (
                  <tr><td colSpan="8" style={{textAlign: 'center'}}>No trades found.</td></tr>
                ) : trades.map(trade => (
                  <tr key={trade.id}>
                    <td><strong>{trade.symbol}</strong></td>
                    <td style={{ textTransform: 'uppercase', color: trade.side === 'long' ? '#4caf50' : '#f44336' }}>{trade.side}</td>
                    <td>{trade.quantity}</td>
                    <td>${trade.entry_price}</td>
                    <td>{trade.exit_price ? `$${trade.exit_price}` : '-'}</td>
                    <td className={trade.pnl > 0 ? 'positive' : (trade.pnl < 0 ? 'negative' : '')}>
                      {trade.pnl !== null ? `$${trade.pnl}` : '-'}
                    </td>
                    <td>{trade.rr !== null ? trade.rr : '-'}</td>
                    <td>
                      <button className="delete-btn" onClick={() => handleDelete(trade.id)} title="Delete trade">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="add-trade-form">
          <h2>Add Trade</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Symbol *</label>
              <input type="text" name="symbol" value={formData.symbol} onChange={handleInputChange} required placeholder="e.g. AAPL" />
            </div>
            
            <div className="form-group">
              <label>Side *</label>
              <select name="side" value={formData.side} onChange={handleInputChange}>
                <option value="long">Long</option>
                <option value="short">Short</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Quantity *</label>
              <input type="number" step="any" name="quantity" value={formData.quantity} onChange={handleInputChange} required min="0.000001" />
            </div>
            
            <div className="form-group">
              <label>Entry Price *</label>
              <input type="number" step="any" name="entry_price" value={formData.entry_price} onChange={handleInputChange} required min="0.000001" />
            </div>
            
            <div className="form-group">
              <label>Exit Price</label>
              <input type="number" step="any" name="exit_price" value={formData.exit_price} onChange={handleInputChange} min="0.000001" />
            </div>
            
            <div className="form-group">
              <label>Stop Loss</label>
              <input type="number" step="any" name="stop_loss" value={formData.stop_loss} onChange={handleInputChange} />
            </div>
            
            <div className="form-group">
              <label>Take Profit</label>
              <input type="number" step="any" name="take_profit" value={formData.take_profit} onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label>Fees</label>
              <input type="number" step="any" name="fees" value={formData.fees} onChange={handleInputChange} min="0" />
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows="3"></textarea>
            </div>

            <button type="submit">Save Trade</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
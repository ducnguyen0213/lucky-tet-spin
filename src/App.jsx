import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { History, Settings, X, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import Wheel from './components/Wheel';
import { defaultRewards, getWeightedReward } from './utils/probabilities';

function App() {
    const [rewards, setRewards] = useState(defaultRewards);
    const [isSpinning, setIsSpinning] = useState(false);
    const [winningIndex, setWinningIndex] = useState(null);
    const [showResult, setShowResult] = useState(false);
    const [history, setHistory] = useState([]);
    const [spinsLeft, setSpinsLeft] = useState(5);
    const [showAdmin, setShowAdmin] = useState(false);
    const [unlimitedSpins, setUnlimitedSpins] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    useEffect(() => {
        const savedRewards = localStorage.getItem('rewardsConfig');
        if (savedRewards) setRewards(JSON.parse(savedRewards));

        const savedHistory = localStorage.getItem('spinHistory');
        if (savedHistory) setHistory(JSON.parse(savedHistory));

        const savedSpins = localStorage.getItem('spinsLeft');
        if (savedSpins !== null) setSpinsLeft(parseInt(savedSpins));

        const savedUnlimited = localStorage.getItem('unlimitedSpins');
        if (savedUnlimited !== null) setUnlimitedSpins(JSON.parse(savedUnlimited));
    }, []);

    const updateRewards = (newRewards) => {
        setRewards(newRewards);
        localStorage.setItem('rewardsConfig', JSON.stringify(newRewards));
    };

    const handleSpin = () => {
        if (isSpinning) return;
        if (!unlimitedSpins && spinsLeft <= 0) return;

        const winner = getWeightedReward(rewards);
        const index = rewards.findIndex(r => r.id === winner.id);

        setWinningIndex(index);
        setIsSpinning(true);

        if (!unlimitedSpins) {
            setSpinsLeft(prev => {
                const newVal = prev - 1;
                localStorage.setItem('spinsLeft', newVal);
                return newVal;
            });
        }
    };

    const handleNextTurn = () => {
        if (isSpinning) return;
        setSpinsLeft(5);
        localStorage.setItem('spinsLeft', 5);
        setShowResult(false);
    };

    const handleResetAll = () => {
        setHistory([]);
        setSpinsLeft(5);
        localStorage.removeItem('spinHistory');
        localStorage.setItem('spinsLeft', 5);
        alert("Đã đặt lại tất cả dữ liệu thành công!");
    };

    const onSpinEnd = () => {
        setIsSpinning(false);
        setShowResult(true);

        const winner = rewards[winningIndex];
        const newHistory = [{ ...winner, date: new Date().toLocaleString() }, ...history].slice(0, 10);
        setHistory(newHistory);
        localStorage.setItem('spinHistory', JSON.stringify(newHistory));

        // Fire confetti!
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1001 };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    };

    // Helper for normalization
    const normalizeWeights = (items) => {
        const sum = items.reduce((acc, r) => acc + (Number(r.weight) || 0), 0);
        if (sum === 0) {
            const equalWeight = 100 / items.length;
            return items.map(r => ({ ...r, weight: Number(equalWeight.toFixed(2)) }));
        }
        return items.map(r => ({
            ...r,
            weight: Number(((Number(r.weight) / sum) * 100).toFixed(2))
        }));
    };

    // Form logic
    const handleAddReward = () => {
        const nextId = Math.max(...rewards.map(r => r.id), 0) + 1;
        const newRewards = [...rewards, { id: nextId, label: '0₫', value: 0, weight: 10, color: '#D32F2F' }];
        updateRewards(normalizeWeights(newRewards));
    };

    const handleRemoveReward = (id) => {
        if (rewards.length <= 2) return alert("Cần ít nhất 2 giải thưởng!");
        const filtered = rewards.filter(r => r.id !== id);
        updateRewards(normalizeWeights(filtered));
    };

    const handleRewardChange = (id, field, val) => {
        let newRewards = rewards.map(r => {
            if (r.id === id) {
                const updated = { ...r, [field]: val };
                if (field === 'value') {
                    updated.label = `${new Intl.NumberFormat('vi-VN').format(val)}₫`;
                }
                return updated;
            }
            return r;
        });

        if (field === 'weight') {
            newRewards = normalizeWeights(newRewards);
        }
        updateRewards(newRewards);
    };

    return (
        <div className="app-container">
            <header className="header">
                <h1>🧧 Lì Xì May Mắn 🧧</h1>
                <p className="festive-font">Vòng Quay Tết Bính Ngọ 2026</p>
            </header>

            <div className="wheel-section">
                <Wheel
                    rewards={rewards}
                    isSpinning={isSpinning}
                    winningIndex={winningIndex}
                    onSpinEnd={onSpinEnd}
                />

                <div style={{ textAlign: 'center' }}>
                    <button
                        className="spin-button"
                        onClick={handleSpin}
                        disabled={isSpinning || (!unlimitedSpins && spinsLeft <= 0)}
                    >
                        {isSpinning ? 'Đang quay...' : 'QUAY NGAY!'}
                    </button>
                    {!unlimitedSpins && (
                        <p style={{ color: 'var(--tet-red)', fontWeight: 'bold', marginTop: '1rem' }}>
                            Bạn còn {spinsLeft} lượt quay
                        </p>
                    )}
                    {unlimitedSpins && (
                        <p style={{ color: 'var(--tet-gold-dark)', fontWeight: 'bold', marginTop: '1rem' }}>
                            Chế độ Chơi Tự Do (Vô hạn lượt)
                        </p>
                    )}

                    {!isSpinning && (spinsLeft <= 0 && !unlimitedSpins) && (
                        <button
                            className="next-turn-button"
                            onClick={handleNextTurn}
                            style={{ marginTop: '1rem' }}
                        >
                            Tiếp tục lượt mới 🧧
                        </button>
                    )}
                </div>
            </div>

            {/* Result Popup */}
            {showResult && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 className="festive-font">Chúc Mừng Năm Mới! 🧧</h2>
                        <p>Bạn đã nhận được lộc xuân:</p>
                        <div className="amount">{rewards[winningIndex]?.label}</div>
                        <button className="close-button" onClick={() => setShowResult(false)}>
                            Nhận Lộc
                        </button>
                    </div>
                </div>
            )}

            {/* Floating Buttons */}
            <div style={{ position: 'fixed', bottom: '20px', right: '20px', display: 'flex', gap: '10px', zIndex: 100 }}>
                <button
                    onClick={() => setShowAdmin(!showAdmin)}
                    style={{ background: 'var(--tet-gold)', border: 'none', borderRadius: '50%', padding: '10px', cursor: 'pointer', display: 'flex', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}
                >
                    <Settings size={24} color="var(--tet-red)" />
                </button>
            </div>

            {/* History Panel */}
            <div className="history-panel">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--tet-red)', margin: '0 0 1rem 0' }}>
                    <History size={20} /> Lịch sử nhận lộc
                </h3>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {history.length === 0 ? (
                        <p style={{ fontSize: '0.9rem', color: '#666' }}>Chưa có lượt quay nào.</p>
                    ) : (
                        history.map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                                <span>{item.label}</span>
                                <span style={{ fontSize: '0.8rem', color: '#888' }}>{item.date}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Admin Panel */}
            {showAdmin && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ textAlign: 'left', minWidth: '350px', maxHeight: '90vh', overflowY: 'auto', background: 'white', color: '#333' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', position: 'sticky', top: 0, background: 'white', zIndex: 10, paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
                            <h3 style={{ margin: 0 }}>Cấu hình giải thưởng</h3>
                            <X cursor="pointer" onClick={() => setShowAdmin(false)} />
                        </div>

                        <div className="reward-list">
                            {rewards.map((reward) => (
                                <div key={reward.id} className="reward-row">
                                    <input
                                        type="number"
                                        className="reward-input"
                                        placeholder="Số tiền (VND)"
                                        value={reward.value}
                                        onChange={(e) => handleRewardChange(reward.id, 'value', Number(e.target.value))}
                                    />
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <input
                                            type="number"
                                            className="reward-input"
                                            placeholder="Tỉ lệ"
                                            value={reward.weight}
                                            onChange={(e) => handleRewardChange(reward.id, 'weight', Number(e.target.value))}
                                        />
                                    </div>
                                    <input
                                        type="color"
                                        className="color-picker"
                                        value={reward.color || '#D32F2F'}
                                        onChange={(e) => handleRewardChange(reward.id, 'color', e.target.value)}
                                    />
                                    <button className="delete-btn" onClick={() => handleRemoveReward(reward.id)}>
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button className="add-reward-btn" style={{ width: '100%' }} onClick={handleAddReward}>
                            <Plus size={20} /> Thêm giải thưởng
                        </button>

                        <div className="weight-info">
                            <span>Tổng tỉ lệ:</span>
                            <span style={{ color: '#4caf50' }}>
                                100%
                            </span>
                        </div>

                        <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
                            * Weights are auto-balanced to stay exactly 100%. Relative values are scaled proportionally.
                        </p>

                        <div className="advanced-section">
                            <div className="collapsible-header" onClick={() => setShowAdvanced(!showAdvanced)}>
                                <span>Cấu hình nâng cao (JSON)</span>
                                {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>

                            {showAdvanced && (
                                <textarea
                                    style={{ width: '100%', height: '150px', fontFamily: 'monospace', padding: '10px', fontSize: '12px', marginTop: '0.5rem' }}
                                    value={JSON.stringify(rewards, null, 2)}
                                    onChange={(e) => {
                                        try {
                                            const updated = JSON.parse(e.target.value);
                                            updateRewards(updated);
                                        } catch (err) { }
                                    }}
                                />
                            )}
                        </div>

                        <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                            <h4 style={{ color: 'var(--tet-red)', margin: '0 0 1rem 0' }}>Cài đặt hệ thống</h4>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={unlimitedSpins}
                                    onChange={(e) => {
                                        setUnlimitedSpins(e.target.checked);
                                        localStorage.setItem('unlimitedSpins', e.target.checked);
                                    }}
                                />
                                Cho phép quay vô hạn (Free Play)
                            </label>

                            <button
                                onClick={handleResetAll}
                                style={{
                                    width: '100%',
                                    background: '#f44336',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.8rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Xóa tất cả lịch sử & Lượt quay
                            </button>
                        </div>

                        <button className="close-button" style={{ marginTop: '1rem' }} onClick={() => setShowAdmin(false)}>
                            Đóng cấu hình
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;

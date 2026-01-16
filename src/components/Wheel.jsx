import React, { useRef, useEffect, useState } from 'react';

const Wheel = ({ rewards, onSpinEnd, isSpinning, winningIndex }) => {
    const canvasRef = useRef(null);
    const [rotation, setRotation] = useState(0);
    const [wheelSize, setWheelSize] = useState(Math.min(window.innerWidth * 0.9, 320));

    useEffect(() => {
        const handleResize = () => setWheelSize(Math.min(window.innerWidth * 0.9, 320));
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const size = wheelSize;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;

    useEffect(() => {
        drawWheel();
    }, [rewards, rotation, wheelSize]);

    const drawWheel = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const totalSegments = rewards.length;
        const segmentAngle = (2 * Math.PI) / totalSegments;

        ctx.clearRect(0, 0, size, size);

        // Draw Wheel Background (Gold Border)
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFD700';
        ctx.fill();

        rewards.forEach((reward, i) => {
            const angle = rotation + i * segmentAngle;

            // Draw Segment
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius - 5, angle, angle + segmentAngle);
            ctx.fillStyle = i % 2 === 0 ? '#D32F2F' : '#B71C1C';
            ctx.fill();

            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Draw Text
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(angle + segmentAngle / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#FFD700';
            ctx.font = `bold ${size / 20}px Inter`;
            ctx.fillText(reward.label, radius - 20, size / 60);
            ctx.restore();
        });

        // Draw Center Circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, size / 8, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFD700';
        ctx.fill();
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw "SPIN" in center
        ctx.fillStyle = '#D32F2F';
        ctx.font = `bold ${size / 15}px Inter`;
        ctx.textAlign = 'center';
        ctx.fillText('SPIN', centerX, centerY + (size / 40));
    };

    useEffect(() => {
        if (isSpinning) {
            const startTime = performance.now();
            const spinDuration = 5000;
            const startRotation = rotation;

            const segmentAngle = (2 * Math.PI) / rewards.length;
            const targetRewardAngle = (winningIndex * segmentAngle) + (segmentAngle / 2);

            // Final rotation formula:
            const fullTurns = 8 * 2 * Math.PI;
            const currentPosOnWheel = startRotation % (2 * Math.PI);
            const angleToTarget = (2 * Math.PI - (targetRewardAngle % (2 * Math.PI))) - (Math.PI / 2);
            const totalRotation = startRotation + fullTurns + angleToTarget - currentPosOnWheel;

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / spinDuration, 1);
                const ease = 1 - Math.pow(1 - progress, 4);
                const currentRotation = startRotation + (totalRotation - startRotation) * ease;

                setRotation(currentRotation);
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    onSpinEnd();
                }
            };
            requestAnimationFrame(animate);
        }
    }, [isSpinning, winningIndex, rewards.length]);

    return (
        <div style={{ position: 'relative', width: size, height: size }}>
            <div style={{
                position: 'absolute',
                top: '-5px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '0',
                height: '0',
                borderLeft: '15px solid transparent',
                borderRight: '15px solid transparent',
                borderTop: '30px solid #FFD700',
                zIndex: 10,
                filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))'
            }} />
            <canvas
                ref={canvasRef}
                width={size}
                height={size}
            />
        </div>
    );
};

export default Wheel;

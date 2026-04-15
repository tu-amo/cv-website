"use client";

export default function TimerWidget({ remainingSeconds, isTimerRunning, onClick, formatTime }) {
    if (remainingSeconds <= 0 && !isTimerRunning) return null;

    return (
        <div className="timer-widget" onClick={onClick}>
            <div className="timer-ring" style={{
                animation: isTimerRunning ? "pulse 2s infinite linear" : "none",
                borderTopColor: remainingSeconds === 0 ? "red" : "var(--color-accent-amber)"
            }}></div>
            <div className="timer-time font-heading">{formatTime(remainingSeconds)}</div>
            <div className="timer-label">{remainingSeconds === 0 ? "Ready! 🔔" : (isTimerRunning ? "Running" : "Paused")}</div>
        </div>
    );
}

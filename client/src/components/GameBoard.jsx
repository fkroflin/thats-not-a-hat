import { useEffect, useState } from 'react';
import socket from '../socket';

function PenaltyDots({ count }) {
  return (
    <span className="penalties">
      {Array.from({ length: Math.min(3, count) }).map((_, i) => (
        <span key={i} className="dot">⭕</span>
      ))}
      {Array.from({ length: Math.max(0, 3 - count) }).map((_, i) => (
        <span key={i} className="dot empty">○</span>
      ))}
    </span>
  );
}

function CardHandDisplay({ cards, isRevealPhase, extraCardForPlayer }) {
  const allCards = [...(cards || [])];
  if (isRevealPhase && extraCardForPlayer) {
    allCards.push(extraCardForPlayer);
  }

  if (allCards.length === 0) {
    return <div className="card-hand-empty">No cards</div>;
  }

  return (
    <div className="card-hand-container">
      {allCards.map((card, idx) => {
        const isRevealed = Boolean(isRevealPhase && card);

        return (
          <div
            key={idx}
            className={`card-tile ${isRevealed ? 'face-up' : 'face-down'}`}
          >
            {isRevealed ? (
              <div className="card-front">
                <span className="card-emoji">{card.emoji}</span>
                <span className="card-label">{card.name}</span>
                {idx === 1 && <span className="extra-tag">Extra</span>}
              </div>
            ) : (
              <div className="card-back">
                <span className="card-back-icon">🎩</span>
                <span className="card-back-label">
                  {allCards.length > 1 ? (idx === 0 ? 'Gift #1 (Oldest)' : 'Gift #2 (New)') : 'Gift #1'}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function OtherPlayer({ player, isActive, isTransferTarget, isRevealPhase, extraCard }) {
  const hasExtra = isRevealPhase && isActive && extraCard;

  return (
    <div className={`player-tile ${isActive ? 'active' : ''} ${player.eliminated ? 'eliminated' : ''} ${isTransferTarget ? 'target' : ''}`}>
      <div className="player-tile-name">{player.name}</div>
      
      <CardHandDisplay
        cards={isRevealPhase ? player.visibleCards : Array(player.cardCount).fill(null)}
        isRevealPhase={isRevealPhase}
        extraCardForPlayer={hasExtra ? extraCard : null}
      />

      <div style={{ marginTop: '0.4rem' }}>
        <PenaltyDots count={player.penalties} />
      </div>

      {isActive && !player.eliminated && <div className="turn-badge">🎯 Active</div>}
      {isTransferTarget && <div className="turn-badge target-badge">📦 Target</div>}
      {player.eliminated && <div className="turn-badge elim-badge">💀 Out</div>}
    </div>
  );
}

export default function GameBoard({ onGameEnd }) {
  const [gameState, setGameState] = useState(null);
  const [claim, setClaim] = useState('');
  const [targetId, setTargetId] = useState('');
  const [error, setError] = useState('');

  const myId = socket.id;

  useEffect(() => {
    socket.on('game_state', (state) => {
      setGameState(state);
      setError('');
    });

    socket.on('game_error', ({ message }) => {
      setError(message);
    });

    socket.emit('get_game_state');

    return () => {
      socket.off('game_state');
      socket.off('game_error');
    };
  }, []);

  if (!gameState) {
    return (
      <div className="screen game-screen">
        <p style={{ color: '#fff', padding: '2rem', textAlign: 'center' }}>
          🎮 Starting game, dealing cards to table...
        </p>
      </div>
    );
  }

  const me = gameState.players.find((p) => p.id === myId);
  const others = gameState.players.filter((p) => p.id !== myId);
  const isMyTurn = gameState.activePlayerId === myId;
  const isTransferTarget = gameState.transfer?.toId === myId;
  const activePlayers = gameState.players.filter((p) => !p.eliminated);
  const isRevealPhase = gameState.phase === 'reveal';
  const activePlayerName = gameState.players.find((p) => p.id === gameState.activePlayerId)?.name || 'Player';

  function handleFlipFaceDown() {
    socket.emit('flip_cards_face_down');
  }

  function handlePass() {
    if (!targetId) return setError('Please select a player to pass the gift to.');
    if (!claim.trim()) return setError('Please state what gift you are passing.');
    socket.emit('pass_card', { toId: targetId, claim: claim.trim() });
    setClaim('');
    setTargetId('');
  }

  function handleAccept() {
    socket.emit('accept_card');
  }

  function handleChallenge() {
    socket.emit('challenge_card');
  }

  function handleFlipReplacement() {
    socket.emit('flip_replacement_card');
  }

  return (
    <div className="screen game-screen">
      <div className="game-header">
        <span>🎴 That's Not a Hat!</span>
        <span>Reserve Deck: {gameState.deckCount} cards</span>
      </div>

      <div className="other-players">
        {others.map((p) => (
          <OtherPlayer
            key={p.id}
            player={p}
            isActive={gameState.activePlayerId === p.id}
            isTransferTarget={gameState.transfer?.toId === p.id}
            isRevealPhase={isRevealPhase}
            extraCard={gameState.extraCard}
          />
        ))}
      </div>

      <div className="action-area">
        <p className="last-event">{gameState.lastEvent}</p>

        {gameState.phase === 'reveal' && (
          <div className="reveal-box">
            <h3>👁 Memorize All Cards on the Table!</h3>
            <p style={{ fontSize: '0.9rem', color: '#ccc' }}>
              Every starting card is visible face-up. Random starting player:{' '}
              <strong style={{ color: '#f0a500' }}>{activePlayerName}</strong> (has the extra gift).
            </p>

            {gameState.extraCard && (
              <div style={{ margin: '0.6rem 0', textAlign: 'center' }}>
                <p style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '0.3rem' }}>
                  Extra Gift for {activePlayerName}:
                </p>
                <div className="big-card">
                  {gameState.extraCard.emoji}
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginTop: '0.3rem', color: '#fff' }}>
                  {gameState.extraCard.name}
                </div>
              </div>
            )}

            <div style={{ marginTop: '0.5rem', width: '100%' }}>
              <button
                onClick={handleFlipFaceDown}
                style={{ width: '100%', fontSize: '1.05rem', padding: '0.8rem' }}
              >
                🔒 Flip All Cards Face-Down & Start Game
              </button>
            </div>
          </div>
        )}

        {gameState.phase === 'await_pass' && isMyTurn && (
          <div className="action-box">
            <p>
              🎁 Pass your <strong>oldest gift (Gift #1)</strong> to another player:
            </p>
            <select value={targetId} onChange={(e) => setTargetId(e.target.value)}>
              <option value="">— Select player to give gift to —</option>
              {activePlayers
                .filter((p) => p.id !== myId)
                .map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
            </select>
            <input
              type="text"
              placeholder="This is a... (e.g. Pizza, Hat, Rocket)"
              value={claim}
              onChange={(e) => setClaim(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePass()}
              maxLength={30}
              autoFocus
            />
            <button onClick={handlePass} style={{ width: '100%' }}>📦 Pass Gift</button>
          </div>
        )}

        {gameState.phase === 'await_response' && !isTransferTarget && (
          <div className="action-box waiting-box">
            {gameState.transfer && (
              <p>
                <strong>{gameState.transfer.fromName}</strong> offered a gift to{' '}
                <strong>{gameState.transfer.toName}</strong> claiming:{' '}
                <em className="claim-text">"{gameState.transfer.claim}"</em>
              </p>
            )}
            <p className="waiting">
              Waiting for <strong>{gameState.transfer?.toName}</strong> to accept or challenge...
            </p>
          </div>
        )}

        {gameState.phase === 'await_response' && isTransferTarget && gameState.transfer && (
          <div className="action-box response-box">
            <p><strong>{gameState.transfer.fromName}</strong> offers you a gift saying:</p>
            <div className="claim-banner">"{gameState.transfer.claim}"</div>
            <p style={{ fontSize: '0.9rem', color: '#aaa', margin: '0.2rem 0' }}>
              Do you believe them?
            </p>
            <div className="button-row">
              <button className="accept-btn" onClick={handleAccept}>
                ✅ Accept ("Thank you!")
              </button>
              <button className="challenge-btn" onClick={handleChallenge}>
                ❌ Challenge ("That's NOT a {gameState.transfer.claim}!")
              </button>
            </div>
          </div>
        )}

        {gameState.phase === 'challenge_reveal' && gameState.revealInfo && (
          <div className="action-box reveal-result">
            <div className="big-card">{gameState.revealInfo.card.emoji}</div>
            <p className="reveal-name">
              The card was actually: <strong>{gameState.revealInfo.card.name}</strong>!
            </p>
            <p className={gameState.revealInfo.lied ? 'result-lie' : 'result-truth'}>
              {gameState.revealInfo.lied
                ? `❌ Claim "${gameState.revealInfo.claim}" was a LIE / MISTAKE!`
                : `✅ Claim "${gameState.revealInfo.claim}" was the TRUTH!`}
            </p>
            <p style={{ color: '#e94560', fontWeight: 'bold' }}>
              ⭕ 1 Penalty awarded to: {gameState.revealInfo.penalizedName}
            </p>
          </div>
        )}

        {gameState.phase === 'replacement_reveal' && (
          <div className="reveal-box">
            <h3>🎴 New Gift Drawn!</h3>
            <p style={{ fontSize: '0.9rem', color: '#aaa' }}>
              All other cards remain untouched! {activePlayerName} draws a replacement gift:
            </p>

            {gameState.replacementCard && (
              <div style={{ margin: '0.5rem 0' }}>
                <div className="big-card">{gameState.replacementCard.emoji}</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginTop: '0.3rem' }}>
                  {gameState.replacementCard.name}
                </div>
              </div>
            )}

            {isMyTurn ? (
              <button
                onClick={handleFlipReplacement}
                style={{ width: '100%', fontSize: '1.05rem', padding: '0.75rem' }}
              >
                🔒 Flip Face-Down & Resume Play
              </button>
            ) : (
              <p className="waiting">
                Waiting for <strong>{activePlayerName}</strong> to flip the new gift face-down...
              </p>
            )}
          </div>
        )}

        {gameState.phase === 'await_pass' && !isMyTurn && (
          <div className="action-box waiting-box">
            <p className="waiting">
              Waiting for <strong>{activePlayerName}</strong> to pass their oldest gift...
            </p>
          </div>
        )}

        {gameState.phase === 'game_end' && (
          <div className="action-box">
            <h3>🏆 Game Over!</h3>
            <div className="scoreboard">
              {[...gameState.players]
                .sort((a, b) => a.penalties - b.penalties)
                .map((p, i) => (
                  <div key={p.id} className={`score-row ${p.id === myId ? 'mine' : ''}`}>
                    <span>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '💀'} {p.name}{p.id === myId ? ' (You)' : ''}</span>
                    <PenaltyDots count={p.penalties} />
                  </div>
                ))}
            </div>
            <button onClick={onGameEnd} style={{ width: '100%', marginTop: '0.5rem' }}>🔄 Back to Lobby</button>
          </div>
        )}

        {error && <p className="error">{error}</p>}
      </div>

      {me && (
        <div className={`my-area ${isMyTurn ? 'my-turn' : ''}`}>
          <div className="my-area-header">
            <span className="my-name">
              {isMyTurn ? '🎯 Your Turn: ' : 'Your Hand: '}{me.name}
            </span>
            <PenaltyDots count={me.penalties} />
          </div>

          <CardHandDisplay
            cards={isRevealPhase ? me.visibleCards : Array(me.cardCount).fill(null)}
            isRevealPhase={isRevealPhase}
            extraCardForPlayer={isRevealPhase && isMyTurn ? gameState.extraCard : null}
          />

          {isRevealPhase ? (
            <p style={{ fontSize: '0.8rem', color: '#f0a500', marginTop: '0.35rem' }}>
              Memorize all cards on table! Click the button above when ready to flip them.
            </p>
          ) : (
            <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.35rem' }}>
              All gifts are face-down. You must remember what you have!
            </p>
          )}

          {me.eliminated && <span className="elim-text">💀 Eliminated (3 penalties)</span>}
        </div>
      )}
    </div>
  );
}

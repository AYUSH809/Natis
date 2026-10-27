const matchEngine = require('../engine/matchEngine');
const botEngine = require('../engine/botEngine');
const roomManager = require('../models/roomManager');
const db = require('../db/database');

function broadcastMatchState(io, roomCode) {
  const room = roomManager.getRoom(roomCode);
  if (!room) return;

  for (const p of room.players) {
    if (p.socketId) {
      const publicState = matchEngine.getPublicState(roomCode, p.playerId);
      if (publicState) {
        io.to(p.socketId).emit('match:state_updated', publicState);
      }
    }
  }

  // After broadcast, check if the current turn belongs to an automated bot
  checkAndRunBotTurn(io, roomCode);
}

// Automated bot action dispatcher
function checkAndRunBotTurn(io, roomCode) {
  const match = matchEngine.getMatch(roomCode);
  if (!match) return;

  // 1. Bot Bidding Turn
  if (match.phase === 'bidding') {
    const currentBidder = match.players.find(p => p.slotNumber === match.currentBidderSlot);
    if (currentBidder && currentBidder.isBot) {
      setTimeout(() => {
        const m = matchEngine.getMatch(roomCode);
        if (!m || m.phase !== 'bidding' || m.currentBidderSlot !== currentBidder.slotNumber) return;

        const botHand = m.playerHands.get(currentBidder.playerId) || [];
        const bid = botEngine.decideBid(botHand, m.currentHighestBid);
        try {
          matchEngine.placeBid({ roomCode, playerId: currentBidder.playerId, bid });
          broadcastMatchState(io, roomCode);
        } catch (err) {
          console.error('Bot Bid Error:', err.message);
        }
      }, 700);
    }
  }

  // 2. Bot Trump Selection Turn
  else if (match.phase === 'trump_selection') {
    const contractPlayer = match.players.find(p => p.slotNumber === match.contractPlayerSlot);
    if (contractPlayer && contractPlayer.isBot) {
      setTimeout(() => {
        const m = matchEngine.getMatch(roomCode);
        if (!m || m.phase !== 'trump_selection') return;

        const botHand = m.playerHands.get(contractPlayer.playerId) || [];
        const suit = botEngine.decideTrumpSuit(botHand);
        try {
          matchEngine.selectTrump({ roomCode, playerId: contractPlayer.playerId, suit });
          broadcastMatchState(io, roomCode);
        } catch (err) {
          console.error('Bot Trump Selection Error:', err.message);
        }
      }, 700);
    }
  }

  // 3. Bot Trick Play Turn (Feature 3)
  else if (match.phase === 'trick_play' && match.currentTrick && !match.currentTrick.isResolving) {
    const currentTurnSlot = match.currentTrick.turnSlot;
    const currentTurnPlayer = match.players.find(p => p.slotNumber === currentTurnSlot);

    if (currentTurnPlayer && currentTurnPlayer.isBot) {
      setTimeout(() => {
        const m = matchEngine.getMatch(roomCode);
        if (!m || m.phase !== 'trick_play' || !m.currentTrick || m.currentTrick.isResolving || m.currentTrick.turnSlot !== currentTurnSlot) return;

        const botHand = m.playerHands.get(currentTurnPlayer.playerId) || [];

        // Check if bot should reveal Trump first
        if (botEngine.shouldRevealTrump(botHand, m.currentTrick, m.isTrumpRevealed, m.trickSuit)) {
          try {
            matchEngine.revealTrump({ roomCode, playerId: currentTurnPlayer.playerId });
            io.to(roomCode).emit('trump:revealed_notice', {
              revealedBySlot: currentTurnPlayer.slotNumber,
              nickname: currentTurnPlayer.nickname,
              trickSuit: m.trickSuit
            });
            broadcastMatchState(io, roomCode);
          } catch (e) {
            // Ignore if reveal not permitted
          }
        }

        // Pick and play card
        const cardToPlay = botEngine.decideCardToPlay(
          botHand,
          m.currentTrick,
          m.isTrumpRevealed,
          m.trickSuit,
          m.currentTrick.trickNumber
        );

        if (cardToPlay) {
          try {
            matchEngine.playCard({
              roomCode,
              playerId: currentTurnPlayer.playerId,
              cardId: cardToPlay.id
            });
            broadcastMatchState(io, roomCode);

            // If trick is complete, wait 1.8s for draw animation before finalizing
            if (m.currentTrick && m.currentTrick.isResolving) {
              setTimeout(() => {
                const liveM = matchEngine.getMatch(roomCode);
                if (liveM && liveM.currentTrick && liveM.currentTrick.isResolving) {
                  matchEngine.finalizeCompletedTrick(liveM);
                  broadcastMatchState(io, roomCode);
                }
              }, 1800);
            }
          } catch (err) {
            console.error('Bot Play Error:', err.message);
          }
        }
      }, 700);
    }
  }
}

function registerGameHandlers(io, socket) {
  // START SOLO GAME WITH BOTS ("Play with Computer")
  socket.on('room:create_solo', ({ nickname, playerId }, callback) => {
    try {
      if (!nickname || !nickname.trim()) throw new Error('Nickname is required');
      if (!playerId) throw new Error('Player ID is required');

      // Create 4-player room with 1 human and 3 bots
      const room = roomManager.createSoloWithBots({
        nickname,
        playerId,
        socketId: socket.id
      });

      socket.join(room.id);

      // Start match in engine immediately
      const match = matchEngine.startNewMatch({
        roomCode: room.id,
        mode: 4,
        players: room.players,
        dealerSlot: 1,
        cumulativeScores: { teamA: 0, teamB: 0 },
        endGameRequested: false
      });

      room.status = 'playing';
      db.prepare("UPDATE rooms SET status = 'playing' WHERE id = ?").run(room.id);

      if (callback) callback({ success: true, room, matchId: match.matchId });
      io.to(room.id).emit('room:updated', room);
      io.to(room.id).emit('game:started', { roomCode: room.id, room });
      broadcastMatchState(io, room.id);
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // START NEW MATCH (Two-Phase Deal & Bidding initialization)
  socket.on('match:start', ({ roomCode, playerId }, callback) => {
    try {
      const room = roomManager.getRoom(roomCode);
      if (!room) throw new Error('Room not found');

      if (room.ownerId !== playerId) {
        throw new Error('Only the room owner can start the match');
      }

      roomManager.canStartGame(roomCode, playerId);

      const dbRoom = db.prepare('SELECT team_a_score, team_b_score, dealer_slot FROM rooms WHERE id = ?').get(room.id);
      const cumulativeScores = {
        teamA: dbRoom ? dbRoom.team_a_score : 0,
        teamB: dbRoom ? dbRoom.team_b_score : 0
      };
      const dealerSlot = dbRoom ? dbRoom.dealer_slot : 1;

      const match = matchEngine.startNewMatch({
        roomCode: room.id,
        mode: room.mode,
        players: room.players,
        dealerSlot,
        cumulativeScores,
        endGameRequested: false
      });

      room.status = 'playing';
      db.prepare("UPDATE rooms SET status = 'playing' WHERE id = ?").run(room.id);

      io.to(room.id).emit('room:updated', room);
      io.to(room.id).emit('game:started', { roomCode: room.id });
      broadcastMatchState(io, room.id);

      if (callback) callback({ success: true, matchId: match.matchId });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // GET MATCH STATE
  socket.on('match:get_state', ({ roomCode, playerId }, callback) => {
    try {
      const state = matchEngine.getPublicState(roomCode, playerId);
      if (callback) callback({ success: true, state });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // PLACE BID
  socket.on('bid:place', ({ roomCode, playerId, bid }, callback) => {
    try {
      const match = matchEngine.placeBid({ roomCode, playerId, bid });
      broadcastMatchState(io, roomCode);
      if (callback) callback({ success: true, phase: match.phase });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // SELECT TRICK SUIT (Contract player only)
  socket.on('trump:select', ({ roomCode, playerId, suit }, callback) => {
    try {
      const match = matchEngine.selectTrump({ roomCode, playerId, suit });
      broadcastMatchState(io, roomCode);
      if (callback) callback({ success: true, phase: match.phase });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // FEATURE 3: PLAY CARD
  socket.on('card:play', ({ roomCode, playerId, cardId }, callback) => {
    try {
      const match = matchEngine.playCard({ roomCode, playerId, cardId });
      broadcastMatchState(io, roomCode);

      // If trick is complete, wait 1.8s for draw animation before finalizing
      if (match.currentTrick && match.currentTrick.isResolving) {
        setTimeout(() => {
          const liveM = matchEngine.getMatch(roomCode);
          if (liveM && liveM.currentTrick && liveM.currentTrick.isResolving) {
            matchEngine.finalizeCompletedTrick(liveM);
            broadcastMatchState(io, roomCode);
          }
        }, 1800);
      }

      if (callback) callback({ success: true });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // FEATURE 3: REVEAL TRUMP
  socket.on('trump:reveal', ({ roomCode, playerId }, callback) => {
    try {
      const match = matchEngine.revealTrump({ roomCode, playerId });
      io.to(roomCode).emit('trump:revealed_notice', {
        revealedBySlot: match.trumpRevealerSlot,
        trickSuit: match.trickSuit
      });
      broadcastMatchState(io, roomCode);
      if (callback) callback({ success: true, trickSuit: match.trickSuit });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // START NEXT DEAL (Dealer token rotates, cumulative score maintained)
  socket.on('match:next_deal', ({ roomCode, playerId }, callback) => {
    try {
      const room = roomManager.getRoom(roomCode);
      if (!room) throw new Error('Room not found');

      const dbRoom = db.prepare('SELECT team_a_score, team_b_score, dealer_slot FROM rooms WHERE id = ?').get(room.id);
      const nextDealerSlot = dbRoom ? dbRoom.dealer_slot : 1;

      const match = matchEngine.startNewMatch({
        roomCode: room.id,
        mode: room.mode,
        players: room.players,
        dealerSlot: nextDealerSlot,
        cumulativeScores: {
          teamA: dbRoom ? dbRoom.team_a_score : 0,
          teamB: dbRoom ? dbRoom.team_b_score : 0
        },
        endGameRequested: false
      });

      broadcastMatchState(io, room.id);
      if (callback) callback({ success: true });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // END GAME CTA (Rule 7: flags ongoing match as final)
  socket.on('game:request_end', ({ roomCode, playerId }, callback) => {
    try {
      const match = matchEngine.requestEndGame({ roomCode, playerId });
      io.to(roomCode.toUpperCase()).emit('game:end_requested_notice', {
        requestedByPlayerId: playerId,
        message: 'A player has requested to End Game. This ongoing match will be the final match.'
      });
      broadcastMatchState(io, roomCode);
      if (callback) callback({ success: true });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });
}

module.exports = {
  registerGameHandlers,
  broadcastMatchState,
  checkAndRunBotTurn
};

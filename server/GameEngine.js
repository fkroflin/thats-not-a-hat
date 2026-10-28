function normalize(str) {
  if (!str) return '';
  let s = str.toLowerCase().trim();
  if (s.endsWith('s')) s = s.slice(0, -1); // singular / plural match
  return s;
}

// 36 cards with canonical names and common aliases
const CARDS = [
  { id: 1,  emoji: '🐋', name: 'Whale', aliases: ['whale', 'whales', 'blue whale'] },
  { id: 2,  emoji: '🦒', name: 'Giraffe', aliases: ['giraffe', 'giraffes'] },
  { id: 3,  emoji: '🌵', name: 'Cactus', aliases: ['cactus', 'cacti', 'cactuses', 'plant'] },
  { id: 4,  emoji: '🚀', name: 'Rocket', aliases: ['rocket', 'rockets', 'spaceship', 'space ship'] },
  { id: 5,  emoji: '🎺', name: 'Trumpet', aliases: ['trumpet', 'trumpets', 'horn'] },
  { id: 6,  emoji: '🍕', name: 'Pizza', aliases: ['pizza', 'pizzas'] },
  { id: 7,  emoji: '🏰', name: 'Castle', aliases: ['castle', 'castles', 'fort'] },
  { id: 8,  emoji: '🦑', name: 'Squid', aliases: ['squid', 'squids', 'calamari'] },
  { id: 9,  emoji: '🌈', name: 'Rainbow', aliases: ['rainbow', 'rainbows'] },
  { id: 10, emoji: '🎸', name: 'Guitar', aliases: ['guitar', 'guitars'] },
  { id: 11, emoji: '🐉', name: 'Dragon', aliases: ['dragon', 'dragons'] },
  { id: 12, emoji: '🌍', name: 'Globe', aliases: ['globe', 'globes', 'earth', 'world'] },
  { id: 13, emoji: '🎩', name: 'Top Hat', aliases: ['top hat', 'hat', 'hats', 'cap'] },
  { id: 14, emoji: '🦀', name: 'Crab', aliases: ['crab', 'crabs'] },
  { id: 15, emoji: '🎠', name: 'Carousel', aliases: ['carousel', 'carousels', 'merry go round', 'horse'] },
  { id: 16, emoji: '🌺', name: 'Hibiscus', aliases: ['hibiscus', 'flower', 'flowers', 'rose'] },
  { id: 17, emoji: '🧊', name: 'Ice Cube', aliases: ['ice cube', 'ice cubes', 'ice'] },
  { id: 18, emoji: '🦋', name: 'Butterfly', aliases: ['butterfly', 'butterflies'] },
  { id: 19, emoji: '🎯', name: 'Bullseye', aliases: ['bullseye', 'target', 'targets', 'darts'] },
  { id: 20, emoji: '🎃', name: 'Pumpkin', aliases: ['pumpkin', 'pumpkins', 'jack o lantern'] },
  { id: 21, emoji: '🐙', name: 'Octopus', aliases: ['octopus', 'octopuses', 'octopi'] },
  { id: 22, emoji: '🌙', name: 'Moon', aliases: ['moon', 'moons', 'crescent'] },
  { id: 23, emoji: '🦜', name: 'Parrot', aliases: ['parrot', 'parrots', 'bird'] },
  { id: 24, emoji: '🍄', name: 'Mushroom', aliases: ['mushroom', 'mushrooms', 'fungus'] },
  { id: 25, emoji: '🎭', name: 'Theater', aliases: ['theater', 'theatre', 'mask', 'masks', 'drama'] },
  { id: 26, emoji: '🦊', name: 'Fox', aliases: ['fox', 'foxes'] },
  { id: 27, emoji: '🌊', name: 'Wave', aliases: ['wave', 'waves', 'water', 'ocean', 'sea'] },
  { id: 28, emoji: '🎪', name: 'Circus', aliases: ['circus', 'circuses', 'tent'] },
  { id: 29, emoji: '🍦', name: 'Ice Cream', aliases: ['ice cream', 'ice creams', 'cone'] },
  { id: 30, emoji: '🐬', name: 'Dolphin', aliases: ['dolphin', 'dolphins'] },
  { id: 31, emoji: '🌴', name: 'Palm Tree', aliases: ['palm tree', 'palm', 'tree', 'palms'] },
  { id: 32, emoji: '🎋', name: 'Bamboo', aliases: ['bamboo', 'bamboos', 'plant'] },
  { id: 33, emoji: '🦩', name: 'Flamingo', aliases: ['flamingo', 'flamingos'] },
  { id: 34, emoji: '🏔️', name: 'Mountain', aliases: ['mountain', 'mountains', 'mount'] },
  { id: 35, emoji: '🎆', name: 'Fireworks', aliases: ['fireworks', 'firework', 'sparkler'] },
  { id: 36, emoji: '🦈', name: 'Shark', aliases: ['shark', 'sharks'] },
];

function checkMatch(claim, card) {
  const normClaim = normalize(claim);
  const normName = normalize(card.name);
  if (normClaim === normName) return true;
  if (card.aliases && card.aliases.some((alias) => normalize(alias) === normClaim)) {
    return true;
  }
  return false;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

class GameEngine {
  constructor(room) {
    this.deck = shuffle(CARDS);
    this.discardPile = [];

    this.players = room.players.map((p) => ({
      id: p.id,
      name: p.name,
      penalties: 0,
      eliminated: false,
      cards: [],
    }));

    this.activePlayerIndex = Math.floor(Math.random() * this.players.length);

    this.phase = 'reveal'; 
    this.extraCard = null;
    this.replacementCard = null;
    this.transfer = null;
    this.revealInfo = null;

    this._dealInitialCards();
  }

  get activePlayer() {
    return this.players[this.activePlayerIndex] ?? null;
  }

  _drawCard() {
    if (this.deck.length === 0) {
      if (this.discardPile.length > 0) {
        this.deck = shuffle(this.discardPile);
        this.discardPile = [];
      } else {
        this.deck = shuffle(CARDS);
      }
    }
    return this.deck.pop();
  }

  _dealInitialCards() {
    this.players.forEach((p) => {
      p.cards = [this._drawCard()];
    });

    this.extraCard = this._drawCard();

    this.lastEvent = `Game started! Everyone, memorize all cards on the table. ${this.activePlayer.name} has the extra gift (${this.extraCard.name})!`;
  }

  getPublicState() {
    return {
      phase: this.phase,
      activePlayerId: this.activePlayer?.id ?? null,
      deckCount: this.deck.length,
      extraCard: this.phase === 'reveal' ? this.extraCard : null,
      replacementCard: this.phase === 'replacement_reveal' ? this.replacementCard : null,
      players: this.players.map((p) => ({
        id: p.id,
        name: p.name,
        penalties: p.penalties,
        eliminated: p.eliminated,
        cardCount: p.cards.length,
        visibleCards: this.phase === 'reveal' ? p.cards : null, // In the initial reveal phase, ALL table cards are visible face-up
      })),
      transfer: this.transfer
        ? {
            fromId: this.transfer.fromId,
            fromName: this.transfer.fromName,
            toId: this.transfer.toId,
            toName: this.transfer.toName,
            claim: this.transfer.claim,
          }
        : null,
      revealInfo: this.revealInfo,
      lastEvent: this.lastEvent,
    };
  }

  getPrivateState(playerId) {
    const player = this.players.find((p) => p.id === playerId);
    if (!player) return null;
    return {
      cards: player.cards,
    };
  }

  // Called when players lock in and flip all cards face-down
  flipAllCardsFaceDown() {
    if (this.phase !== 'reveal') return { error: 'Not in reveal phase.' };

    // The starting player receives the extra gift into their hand (now holds 2 cards)
    if (this.extraCard) {
      this.activePlayer.cards.push(this.extraCard);
      this.extraCard = null;
    }

    this.phase = 'await_pass';
    this.lastEvent = `All cards are now face-down! ${this.activePlayer.name}, choose a player and pass your oldest gift!`;
    return { success: true };
  }

  passCard(fromId, toId, claim) {
    if (this.phase !== 'await_pass') return { error: 'Not time to pass.' };
    if (this.activePlayer?.id !== fromId) return { error: 'Not your turn.' };

    const fromPlayer = this.players.find((p) => p.id === fromId);
    const toPlayer = this.players.find((p) => p.id === toId);

    if (!toPlayer || toPlayer.eliminated) return { error: 'Invalid target player.' };
    if (toId === fromId) return { error: 'You cannot pass to yourself.' };
    if (fromPlayer.cards.length === 0) return { error: 'You have no gifts to pass.' };
    if (!claim?.trim()) return { error: 'You must state what this gift is.' };

    // Always passes the oldest card in front of them (FIFO)
    const passedCard = fromPlayer.cards.shift();

    this.transfer = {
      card: passedCard,
      fromId,
      fromName: fromPlayer.name,
      toId,
      toName: toPlayer.name,
      claim: claim.trim(),
    };

    this.phase = 'await_response';
    this.lastEvent = `${fromPlayer.name} passed a gift to ${toPlayer.name} saying: "This is a ${claim.trim()}"!`;
    return { success: true };
  }

  acceptCard(playerId) {
    if (this.phase !== 'await_response') return { error: 'No gift transfer in progress.' };
    if (this.transfer.toId !== playerId) return { error: 'This gift is not for you.' };

    const toPlayer = this.players.find((p) => p.id === playerId);

    toPlayer.cards.push(this.transfer.card);

    this.lastEvent = `${toPlayer.name} accepted the gift: "${this.transfer.claim}"! ✅`;
    this.transfer = null;
    this.revealInfo = null;

    const receiverIndex = this.players.findIndex((p) => p.id === playerId);
    this.activePlayerIndex = receiverIndex;
    this.phase = 'await_pass';

    return { success: true };
  }

  challengeCard(playerId) {
    if (this.phase !== 'await_response') return { error: 'No gift transfer in progress.' };
    if (this.transfer.toId !== playerId) return { error: 'This gift is not for you.' };

    const { card, fromId, toId, claim } = this.transfer;
    const fromPlayer = this.players.find((p) => p.id === fromId);
    const toPlayer = this.players.find((p) => p.id === toId);

    const isTruth = checkMatch(claim, card);
    const lied = !isTruth;

    let penalizedPlayer;
    if (lied) {
      penalizedPlayer = fromPlayer;
      penalizedPlayer.penalties += 1;
      this.lastEvent = `"That's NOT a ${claim}!" ✅ Correct challenge! It was a ${card.name} (${card.emoji}). ⭕ Penalty for ${fromPlayer.name}!`;
    } else {
      penalizedPlayer = toPlayer;
      penalizedPlayer.penalties += 1;
      this.lastEvent = `"That's NOT a ${claim}?" ❌ False accusation! It IS a ${card.name} (${card.emoji}). ⭕ Penalty for ${toPlayer.name}!`;
    }

    if (penalizedPlayer.penalties >= 3) {
      penalizedPlayer.eliminated = true;
    }

    this.discardPile.push(card);

    this.revealInfo = {
      card,
      claim,
      lied,
      penalizedId: penalizedPlayer.id,
      penalizedName: penalizedPlayer.name,
    };

    this.transfer = null;
    this.phase = 'challenge_reveal';

    const penalizedIndex = this.players.findIndex((p) => p.id === penalizedPlayer.id);
    this.activePlayerIndex = penalizedIndex >= 0 ? penalizedIndex : 0;

    return { success: true };
  }

  afterReveal() {
    this.revealInfo = null;
    const activePlayers = this.players.filter((p) => !p.eliminated);

    if (this.players.some((p) => p.penalties >= 3) || activePlayers.length <= 1) {
      this.phase = 'game_end';
      const loser = this.players.find((p) => p.penalties >= 3);
      this.lastEvent = loser
        ? `🏆 Game Over! ${loser.name} reached 3 penalties!`
        : '🏆 Game Over!';
      return;
    }

    this.replacementCard = this._drawCard();
    this.phase = 'replacement_reveal';
    this.lastEvent = `All cards stay in place! ${this.activePlayer.name} draws a new gift (${this.replacementCard.name} ${this.replacementCard.emoji}) to continue.`;
  }

  flipReplacementCardFaceDown() {
    if (this.phase !== 'replacement_reveal') return { error: 'Not in replacement card phase.' };

    if (this.replacementCard) {
      this.activePlayer.cards.push(this.replacementCard);
      this.replacementCard = null;
    }

    this.phase = 'await_pass';
    this.lastEvent = `${this.activePlayer.name} flipped the new gift face-down. Pass your oldest gift to continue!`;
    return { success: true };
  }
}

module.exports = GameEngine;

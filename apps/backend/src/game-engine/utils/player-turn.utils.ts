import {
    GameState,
    PlayerHand,
} from "../types/game.types";

export function isPlayerDisabled(
    gameState: GameState,
    playerId: string
) {
    return gameState.disabledPlayerIds.includes(
        playerId
    );
}

export function getActivePlayers(
    gameState: GameState
) {
    return gameState.players.filter(
        (player) =>
            !isPlayerDisabled(
                gameState,
                player.userId
            )
    );
}

export function getNextActivePlayerId(
    gameState: GameState,
    currentPlayerId: string
) {
    const activePlayers =
        getActivePlayers(gameState);

    const currentIndex =
        activePlayers.findIndex(
            (player) =>
                player.userId ===
                currentPlayerId
        );

    if (currentIndex === -1) {
        throw new Error(
            "Current player is not active"
        );
    }

    const nextIndex =
        (currentIndex + 1) %
        activePlayers.length;

    return activePlayers[nextIndex].userId;
}

export function getTeammate(
    gameState: GameState,
    playerId: string
) {
    const player =
        gameState.players.find(
            (entry) =>
                entry.userId === playerId
        );

    if (!player) {
        return undefined;
    }

    return gameState.players.find(
        (entry) =>
            entry.userId !== playerId &&
            entry.team === player.team
    );
}

export function setDisabledPlayers(
    gameState: GameState,
    disabledPlayerIds: string[]
) {
    gameState.disabledPlayerIds =
        disabledPlayerIds;

    for (const player of gameState.players) {
        player.disabled =
            disabledPlayerIds.includes(
                player.userId
            );
    }
}

export function getPlayerById(
    gameState: GameState,
    playerId: string
) {
    return gameState.players.find(
        (player) =>
            player.userId === playerId
    );
}

export function isDisconnectedPlayer(
    player?: PlayerHand
) {
    return player?.disconnected === true;
}

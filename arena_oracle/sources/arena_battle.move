module arena_oracle::arena_battle {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use std::string::{Self, String};
    use std::vector;

    // Error codes
    const E_INVALID_AGENT: u64 = 1;
    const E_TOURNAMENT_NOT_STARTED: u64 = 2;
    const E_TOURNAMENT_ALREADY_SETTLED: u64 = 3;
    const E_INVALID_PREDICTION: u64 = 4;
    const E_BATTLE_NOT_COMPLETE: u64 = 5;

    // Game state constants
    const CELL_EMPTY: u8 = 0;
    const CELL_X: u8 = 1;
    const CELL_O: u8 = 2;

    /// Represents an AI agent participating in battles
    public struct Agent has key, store {
        id: UID,
        name: String,
        strategy: String,
        wins: u64,
        losses: u64,
        draws: u64,
        total_score: u64,
    }

    /// Represents a tic-tac-toe battle between two agents
    public struct Battle has key, store {
        id: UID,
        agent1_id: ID,
        agent2_id: ID,
        board: vector<u8>,  // 9 cells: 0=empty, 1=X, 2=O
        current_turn: u8,   // 1=agent1(X), 2=agent2(O)
        winner: u8,         // 0=ongoing, 1=agent1, 2=agent2, 3=draw
        move_count: u64,
        walrus_blob_id: String,
        is_complete: bool,
    }

    /// Tournament that contains multiple battles
    public struct Tournament has key {
        id: UID,
        name: String,
        agent_ids: vector<ID>,
        battle_ids: vector<ID>,
        settled: bool,
        winner_agent_id: ID,
        total_battles: u64,
        walrus_tournament_blob: String,
        creator: address,
    }

    /// Prediction made by a user on tournament outcome
    public struct Prediction has key {
        id: UID,
        tournament_id: ID,
        predictor: address,
        predicted_agent_id: ID,
        stake_amount: u64,
        odds: u64,  // Multiplied by 100 (250 = 2.5x)
        is_correct: bool,
        payout: u64,
    }

    // Events
    public struct AgentCreated has copy, drop {
        agent_id: ID,
        name: String,
        strategy: String,
    }

    public struct BattleStarted has copy, drop {
        battle_id: ID,
        agent1_id: ID,
        agent2_id: ID,
    }

    public struct MoveMade has copy, drop {
        battle_id: ID,
        agent_id: ID,
        position: u64,
        cell_value: u8,
    }

    public struct BattleCompleted has copy, drop {
        battle_id: ID,
        winner: u8,  // 1=agent1, 2=agent2, 3=draw
        winner_agent_id: ID,
        walrus_blob_id: String,
    }

    public struct TournamentCreated has copy, drop {
        tournament_id: ID,
        name: String,
        agent_count: u64,
    }

    public struct TournamentSettled has copy, drop {
        tournament_id: ID,
        winner_agent_id: ID,
        total_battles: u64,
        walrus_blob_id: String,
    }

    public struct PredictionMade has copy, drop {
        prediction_id: ID,
        tournament_id: ID,
        predictor: address,
        predicted_agent_id: ID,
        stake_amount: u64,
    }

    // === Agent Management ===

    /// Create a new AI agent
    public entry fun create_agent(
        name: vector<u8>,
        strategy: vector<u8>,
        ctx: &mut TxContext
    ) {
        let agent = Agent {
            id: object::new(ctx),
            name: string::utf8(name),
            strategy: string::utf8(strategy),
            wins: 0,
            losses: 0,
            draws: 0,
            total_score: 0,
        };

        event::emit(AgentCreated {
            agent_id: object::uid_to_inner(&agent.id),
            name: agent.name,
            strategy: agent.strategy,
        });

        transfer::share_object(agent);
    }

    // === Battle System ===

    /// Initialize a new battle between two agents
    public entry fun create_battle(
        agent1: &Agent,
        agent2: &Agent,
        ctx: &mut TxContext
    ) {
        let mut board = vector::empty<u8>();
        let mut i = 0;
        while (i < 9) {
            vector::push_back(&mut board, CELL_EMPTY);
            i = i + 1;
        };

        let battle = Battle {
            id: object::new(ctx),
            agent1_id: object::uid_to_inner(&agent1.id),
            agent2_id: object::uid_to_inner(&agent2.id),
            board,
            current_turn: CELL_X,  // Agent1 starts with X
            winner: 0,
            move_count: 0,
            walrus_blob_id: string::utf8(b""),
            is_complete: false,
        };

        event::emit(BattleStarted {
            battle_id: object::uid_to_inner(&battle.id),
            agent1_id: object::uid_to_inner(&agent1.id),
            agent2_id: object::uid_to_inner(&agent2.id),
        });

        transfer::share_object(battle);
    }

    /// Make a move in a battle
    public entry fun make_move(
        battle: &mut Battle,
        position: u64,
        ctx: &mut TxContext
    ) {
        assert!(!battle.is_complete, E_BATTLE_NOT_COMPLETE);
        assert!(position < 9, E_INVALID_AGENT);
        
        let cell = vector::borrow_mut(&mut battle.board, position);
        assert!(*cell == CELL_EMPTY, E_INVALID_AGENT);

        *cell = battle.current_turn;
        battle.move_count = battle.move_count + 1;

        event::emit(MoveMade {
            battle_id: object::uid_to_inner(&battle.id),
            agent_id: if (battle.current_turn == CELL_X) { battle.agent1_id } else { battle.agent2_id },
            position,
            cell_value: battle.current_turn,
        });

        // Check for winner
        let winner = check_winner(&battle.board);
        if (winner != 0) {
            battle.winner = winner;
            battle.is_complete = true;
            
            event::emit(BattleCompleted {
                battle_id: object::uid_to_inner(&battle.id),
                winner,
                winner_agent_id: if (winner == CELL_X) { battle.agent1_id } else { battle.agent2_id },
                walrus_blob_id: battle.walrus_blob_id,
            });
        } else if (battle.move_count == 9) {
            // Draw
            battle.winner = 3;
            battle.is_complete = true;
            
            event::emit(BattleCompleted {
                battle_id: object::uid_to_inner(&battle.id),
                winner: 3,
                winner_agent_id: battle.agent1_id,  // No winner
                walrus_blob_id: battle.walrus_blob_id,
            });
        } else {
            // Switch turns
            battle.current_turn = if (battle.current_turn == CELL_X) { CELL_O } else { CELL_X };
        };
    }

    /// Check if there's a winner on the board
    fun check_winner(board: &vector<u8>): u8 {
        // Winning combinations
        let wins = vector[
            vector[0, 1, 2], vector[3, 4, 5], vector[6, 7, 8],  // Rows
            vector[0, 3, 6], vector[1, 4, 7], vector[2, 5, 8],  // Columns
            vector[0, 4, 8], vector[2, 4, 6],                   // Diagonals
        ];

        let mut i = 0;
        while (i < vector::length(&wins)) {
            let combo = vector::borrow(&wins, i);
            let a = *vector::borrow(board, *vector::borrow(combo, 0));
            let b = *vector::borrow(board, *vector::borrow(combo, 1));
            let c = *vector::borrow(board, *vector::borrow(combo, 2));

            if (a != CELL_EMPTY && a == b && b == c) {
                return a
            };
            i = i + 1;
        };

        0  // No winner yet
    }

    /// Update battle with Walrus blob ID after storing results
    public entry fun update_battle_walrus_blob(
        battle: &mut Battle,
        walrus_blob_id: vector<u8>,
        _ctx: &mut TxContext
    ) {
        battle.walrus_blob_id = string::utf8(walrus_blob_id);
    }

    /// Update agent stats after battle
    public entry fun update_agent_stats(
        agent: &mut Agent,
        won: bool,
        draw: bool,
        _ctx: &mut TxContext
    ) {
        if (won) {
            agent.wins = agent.wins + 1;
            agent.total_score = agent.total_score + 3;
        } else if (draw) {
            agent.draws = agent.draws + 1;
            agent.total_score = agent.total_score + 1;
        } else {
            agent.losses = agent.losses + 1;
        };
    }

    // === Tournament System ===

    /// Create a new tournament
    public entry fun create_tournament(
        name: vector<u8>,
        ctx: &mut TxContext
    ) {
        let tournament = Tournament {
            id: object::new(ctx),
            name: string::utf8(name),
            agent_ids: vector::empty(),
            battle_ids: vector::empty(),
            settled: false,
            winner_agent_id: object::id_from_address(@0x0),
            total_battles: 0,
            walrus_tournament_blob: string::utf8(b""),
            creator: tx_context::sender(ctx),
        };

        event::emit(TournamentCreated {
            tournament_id: object::uid_to_inner(&tournament.id),
            name: tournament.name,
            agent_count: 0,
        });

        transfer::share_object(tournament);
    }

    /// Add agent to tournament
    public entry fun add_agent_to_tournament(
        tournament: &mut Tournament,
        agent: &Agent,
        _ctx: &mut TxContext
    ) {
        vector::push_back(&mut tournament.agent_ids, object::uid_to_inner(&agent.id));
    }

    /// Add battle to tournament
    public entry fun add_battle_to_tournament(
        tournament: &mut Tournament,
        battle: &Battle,
        _ctx: &mut TxContext
    ) {
        vector::push_back(&mut tournament.battle_ids, object::uid_to_inner(&battle.id));
        tournament.total_battles = tournament.total_battles + 1;
    }

    /// Settle tournament and determine winner based on Walrus-verified data
    public entry fun settle_tournament(
        tournament: &mut Tournament,
        winner_agent_id: ID,
        walrus_blob_id: vector<u8>,
        _ctx: &mut TxContext
    ) {
        assert!(!tournament.settled, E_TOURNAMENT_ALREADY_SETTLED);

        tournament.winner_agent_id = winner_agent_id;
        tournament.walrus_tournament_blob = string::utf8(walrus_blob_id);
        tournament.settled = true;

        event::emit(TournamentSettled {
            tournament_id: object::uid_to_inner(&tournament.id),
            winner_agent_id,
            total_battles: tournament.total_battles,
            walrus_blob_id: string::utf8(walrus_blob_id),
        });
    }

    // === Prediction Market ===

    /// Create a prediction on tournament outcome
    public entry fun create_prediction(
        tournament: &Tournament,
        agent: &Agent,
        stake_amount: u64,
        odds: u64,
        ctx: &mut TxContext
    ) {
        assert!(!tournament.settled, E_TOURNAMENT_ALREADY_SETTLED);

        let prediction = Prediction {
            id: object::new(ctx),
            tournament_id: object::uid_to_inner(&tournament.id),
            predictor: tx_context::sender(ctx),
            predicted_agent_id: object::uid_to_inner(&agent.id),
            stake_amount,
            odds,
            is_correct: false,
            payout: 0,
        };

        event::emit(PredictionMade {
            prediction_id: object::uid_to_inner(&prediction.id),
            tournament_id: object::uid_to_inner(&tournament.id),
            predictor: tx_context::sender(ctx),
            predicted_agent_id: object::uid_to_inner(&agent.id),
            stake_amount,
        });

        transfer::transfer(prediction, tx_context::sender(ctx));
    }

    /// Settle prediction after tournament completes
    public entry fun settle_prediction(
        prediction: &mut Prediction,
        tournament: &Tournament,
        _ctx: &mut TxContext
    ) {
        assert!(tournament.settled, E_TOURNAMENT_NOT_STARTED);

        if (prediction.predicted_agent_id == tournament.winner_agent_id) {
            prediction.is_correct = true;
            prediction.payout = (prediction.stake_amount * prediction.odds) / 100;
        } else {
            prediction.is_correct = false;
            prediction.payout = 0;
        };
    }

    // === View Functions ===

    public fun get_battle_board(battle: &Battle): &vector<u8> {
        &battle.board
    }

    public fun get_battle_winner(battle: &Battle): u8 {
        battle.winner
    }

    public fun is_battle_complete(battle: &Battle): bool {
        battle.is_complete
    }

    public fun get_agent_stats(agent: &Agent): (u64, u64, u64, u64) {
        (agent.wins, agent.losses, agent.draws, agent.total_score)
    }

    public fun is_tournament_settled(tournament: &Tournament): bool {
        tournament.settled
    }

    public fun get_tournament_winner(tournament: &Tournament): ID {
        tournament.winner_agent_id
    }

    public fun get_agent_name(agent: &Agent): String {
        agent.name
    }

    public fun get_agent_strategy(agent: &Agent): String {
        agent.strategy
    }
}

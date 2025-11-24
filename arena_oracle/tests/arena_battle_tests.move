#[test_only]
module arena_oracle::arena_battle_tests {
    use arena_oracle::arena_battle::{Self, Agent, Battle, Tournament};
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::test_utils;
    use std::string;

    const ADMIN: address = @0xAD;
    const USER1: address = @0xA1;
    const USER2: address = @0xA2;

    // Helper function to create a test agent
    fun create_test_agent(scenario: &mut Scenario, sender: address, name: vector<u8>, strategy: vector<u8>) {
        ts::next_tx(scenario, sender);
        {
            arena_battle::create_agent(name, strategy, ts::ctx(scenario));
        };
    }

    #[test]
    fun test_create_agent() {
        let mut scenario = ts::begin(ADMIN);
        
        // Create an agent
        create_test_agent(&mut scenario, ADMIN, b"Alpha Bot", b"Aggressive");
        
        // Verify agent was created
        ts::next_tx(&mut scenario, ADMIN);
        {
            let agent = ts::take_shared<Agent>(&scenario);
            
            assert!(string::bytes(&arena_battle::get_agent_name(&agent)) == &b"Alpha Bot", 0);
            
            let (wins, losses, draws, score) = arena_battle::get_agent_stats(&agent);
            assert!(wins == 0, 1);
            assert!(losses == 0, 2);
            assert!(draws == 0, 3);
            assert!(score == 0, 4);
            
            ts::return_shared(agent);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_create_battle() {
        let mut scenario = ts::begin(ADMIN);
        
        // Create two agents
        create_test_agent(&mut scenario, ADMIN, b"Agent1", b"Strategy1");
        create_test_agent(&mut scenario, ADMIN, b"Agent2", b"Strategy2");
        
        // Create battle between agents
        ts::next_tx(&mut scenario, ADMIN);
        {
            let agent1 = ts::take_shared<Agent>(&scenario);
            let agent2 = ts::take_shared<Agent>(&scenario);
            
            arena_battle::create_battle(&agent1, &agent2, ts::ctx(&mut scenario));
            
            ts::return_shared(agent1);
            ts::return_shared(agent2);
        };
        
        // Verify battle was created
        ts::next_tx(&mut scenario, ADMIN);
        {
            let battle = ts::take_shared<Battle>(&scenario);
            
            assert!(!arena_battle::is_battle_complete(&battle), 0);
            assert!(arena_battle::get_battle_winner(&battle) == 0, 1);
            
            let board = arena_battle::get_battle_board(&battle);
            assert!(vector::length(board) == 9, 2);
            
            ts::return_shared(battle);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_make_moves_and_win() {
        let mut scenario = ts::begin(ADMIN);
        
        // Create agents and battle
        create_test_agent(&mut scenario, ADMIN, b"Agent1", b"Strategy1");
        create_test_agent(&mut scenario, ADMIN, b"Agent2", b"Strategy2");
        
        ts::next_tx(&mut scenario, ADMIN);
        {
            let agent1 = ts::take_shared<Agent>(&scenario);
            let agent2 = ts::take_shared<Agent>(&scenario);
            arena_battle::create_battle(&agent1, &agent2, ts::ctx(&mut scenario));
            ts::return_shared(agent1);
            ts::return_shared(agent2);
        };
        
        // Agent1 plays winning sequence: center, top-right, bottom-right (diagonal)
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut battle = ts::take_shared<Battle>(&scenario);
            arena_battle::make_move(&mut battle, 4, ts::ctx(&mut scenario)); // X at center
            ts::return_shared(battle);
        };
        
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut battle = ts::take_shared<Battle>(&scenario);
            arena_battle::make_move(&mut battle, 0, ts::ctx(&mut scenario)); // O at top-left
            ts::return_shared(battle);
        };
        
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut battle = ts::take_shared<Battle>(&scenario);
            arena_battle::make_move(&mut battle, 2, ts::ctx(&mut scenario)); // X at top-right
            ts::return_shared(battle);
        };
        
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut battle = ts::take_shared<Battle>(&scenario);
            arena_battle::make_move(&mut battle, 6, ts::ctx(&mut scenario)); // O at bottom-left
            ts::return_shared(battle);
        };
        
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut battle = ts::take_shared<Battle>(&scenario);
            arena_battle::make_move(&mut battle, 8, ts::ctx(&mut scenario)); // X at bottom-right (wins diagonal)
            ts::return_shared(battle);
        };
        
        // Verify winner
        ts::next_tx(&mut scenario, ADMIN);
        {
            let battle = ts::take_shared<Battle>(&scenario);
            assert!(arena_battle::is_battle_complete(&battle), 0);
            assert!(arena_battle::get_battle_winner(&battle) == 1, 1); // Agent1 (X) wins
            ts::return_shared(battle);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_create_tournament() {
        let mut scenario = ts::begin(ADMIN);
        
        // Create tournament
        ts::next_tx(&mut scenario, ADMIN);
        {
            arena_battle::create_tournament(b"Test Tournament", ts::ctx(&mut scenario));
        };
        
        // Verify tournament
        ts::next_tx(&mut scenario, ADMIN);
        {
            let tournament = ts::take_shared<Tournament>(&scenario);
            assert!(!arena_battle::is_tournament_settled(&tournament), 0);
            ts::return_shared(tournament);
        };
        
        ts::end(scenario);
    }

    #[test]
    fun test_tournament_with_agents() {
        let mut scenario = ts::begin(ADMIN);
        
        // Create tournament
        arena_battle::create_tournament(b"Test Tournament", ts::ctx(&mut scenario));
        
        // Create agents
        create_test_agent(&mut scenario, ADMIN, b"Agent1", b"Strategy1");
        create_test_agent(&mut scenario, ADMIN, b"Agent2", b"Strategy2");
        
        // Add agents to tournament
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut tournament = ts::take_shared<Tournament>(&scenario);
            let agent1 = ts::take_shared<Agent>(&scenario);
            let agent2 = ts::take_shared<Agent>(&scenario);
            
            arena_battle::add_agent_to_tournament(&mut tournament, &agent1, ts::ctx(&mut scenario));
            arena_battle::add_agent_to_tournament(&mut tournament, &agent2, ts::ctx(&mut scenario));
            
            ts::return_shared(tournament);
            ts::return_shared(agent1);
            ts::return_shared(agent2);
        };
        
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = arena_battle::E_TOURNAMENT_ALREADY_SETTLED)]
    fun test_cannot_settle_twice() {
        let mut scenario = ts::begin(ADMIN);
        
        // Create tournament and agent
        arena_battle::create_tournament(b"Test Tournament", ts::ctx(&mut scenario));
        create_test_agent(&mut scenario, ADMIN, b"Agent1", b"Strategy1");
        
        let agent_id = ts::most_recent_id_for_address<Agent>(ADMIN);
        
        // Settle tournament
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut tournament = ts::take_shared<Tournament>(&scenario);
            arena_battle::settle_tournament(
                &mut tournament,
                agent_id,
                b"walrus_blob_123",
                ts::ctx(&mut scenario)
            );
            ts::return_shared(tournament);
        };
        
        // Try to settle again (should fail)
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut tournament = ts::take_shared<Tournament>(&scenario);
            arena_battle::settle_tournament(
                &mut tournament,
                agent_id,
                b"walrus_blob_456",
                ts::ctx(&mut scenario)
            );
            ts::return_shared(tournament);
        };
        
        ts::end(scenario);
    }

    #[test]
    #[expected_failure]
    fun test_cannot_play_in_occupied_cell() {
        let mut scenario = ts::begin(ADMIN);
        
        // Create agents and battle
        create_test_agent(&mut scenario, ADMIN, b"Agent1", b"Strategy1");
        create_test_agent(&mut scenario, ADMIN, b"Agent2", b"Strategy2");
        
        ts::next_tx(&mut scenario, ADMIN);
        {
            let agent1 = ts::take_shared<Agent>(&scenario);
            let agent2 = ts::take_shared<Agent>(&scenario);
            arena_battle::create_battle(&agent1, &agent2, ts::ctx(&mut scenario));
            ts::return_shared(agent1);
            ts::return_shared(agent2);
        };
        
        // Play same position twice
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut battle = ts::take_shared<Battle>(&scenario);
            arena_battle::make_move(&mut battle, 4, ts::ctx(&mut scenario));
            ts::return_shared(battle);
        };
        
        ts::next_tx(&mut scenario, ADMIN);
        {
            let mut battle = ts::take_shared<Battle>(&scenario);
            arena_battle::make_move(&mut battle, 4, ts::ctx(&mut scenario)); // Should fail
            ts::return_shared(battle);
        };
        
        ts::end(scenario);
    }
}

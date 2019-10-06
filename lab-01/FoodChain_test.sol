pragma solidity >=0.4.0 <0.6.0;
    import "remix_tests.sol"; // this import is automatically injected by Remix.
    import "browser/FoodChain.sol";

    library codes{
        enum statusCode {success, notAllowed, incorrectState, invalidParameter}
    }

    // file name has to end with '_test.sol'
    contract test1{
        // FoodChain f;
        test_voter[] voters;

        function beforeAll() public {
            uint numVoters = 5;
            voters.length = numVoters;
            for(uint i = 0; i<numVoters; i++)
                voters[i] = new test_voter();
        }

        function checkInvite() public {
            FoodChain f = new FoodChain(4);
            f.openPoll(100);

            uint result = uint(f.invite(address(voters[0]), false));
            Assert.equal(result, 0, "No Veto Invite failed");

            uint result1 = uint(f.invite(address(voters[1]), true));
            Assert.equal(result1, 0, "Veto Invite failed");
        }

        function checkRSVP() public{
            FoodChain f = new FoodChain(4);
            f.openPoll(100);

            f.invite(address(voters[0]), false);
            Assert.equal(voters[0].rsvp(f, true), 0, "Invited voter cannot RSVP");

            uint result1 = voters[1].rsvp(f, true);
            Assert.equal(result1, 1, "Not invited voter can RSVP");
        }

        function checkVote() public {
            FoodChain f = new FoodChain(4);
            f.openPoll(100);

            f.invite(address(voters[0]), false);
            voters[0].rsvp(f, true);
            uint8[] memory v = new uint8[](4);
            v[0] = 2;
            v[1] = 1;
            v[2] = 3;
            v[3] = 4;
            uint result0 = voters[0].vote(f, v);
            Assert.equal(result0, 0, "Invited, RSVP'd voter cannot vote");
        }

        function checkWinner() public {
            FoodChain f = new FoodChain(4);
            f.openPoll(1000);

            uint8[] memory v = new uint8[](4);
            v[0] = 2;
            v[1] = 1;
            v[2] = 3;
            v[3] = 4;
            for(uint i = 0; i<3; i++){
                f.invite(address(voters[0]), false);
                voters[0].rsvp(f, true);
                voters[0].vote(f, v);
            }

            uint winner = f.winningProposal();
            Assert.equal(winner, 2, "Inccorect winner");
        }

        function checkTransfer() public {
            // Try STV voting in a 3 choice election
            // For example say choice 0 is Republican, choice 1 is Democrat
            // and choice 2 is a third party say Socialists
            // When the socialist party is eleminitated their votes are
            // transfered to their second choice, the Democrats who then win

            FoodChain f = new FoodChain(3);
            f.openPoll(1000);

            // Invite and RSVP five voters
            for(uint i = 0; i<5; i++){
                f.invite(address(voters[i]), false);
                voters[i].rsvp(f, true);
            }

            uint8[] memory rep = new uint8[](3); // replican party line
            rep[0] = 0;
            rep[1] = 1;
            rep[2] = 2;

            uint8[] memory dem = new uint8[](3); // Democrat party line
            dem[0]= 1;
            dem[1] = 2;
            dem[2] = 0;

            uint8[] memory soc = new uint8[](3); // Socialist party line
            soc[0] = 2;
            soc[1] = 1; // note Democrats are 2nd choice
            soc[2] = 0;

            voters[0].vote(f, rep); // Votes Republican
            voters[1].vote(f, rep); // Votes Republican
            voters[2].vote(f, dem); // Votes Democrat
            voters[3].vote(f, dem); // Votes Democrat
            voters[4].vote(f, soc); // Votes Semocrat

            f.closePoll();
            uint winnerID = f.winningProposal();
            Assert.equal(winnerID, uint(1), "Votes not transferred correctly");
        }
      }

    contract test_voter{
        function rsvp(FoodChain f, bool intent) public returns (uint statusCode){
            return uint(f.rsvp(intent));
        }
        function vote(FoodChain f, uint8[] memory rankings) public returns (uint statusCode){
            return uint(f.vote(rankings));
        }
        function veto(FoodChain f, uint8 proposalID) public returns (uint statusCode){
            return uint(f.veto(proposalID));
        }
    }
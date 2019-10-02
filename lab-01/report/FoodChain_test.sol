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
            uint numVoters = 3;
            voters.length = numVoters;
            for(uint i = 0; i<numVoters; i++)
                voters[i] = new test_voter();
        }

        function checkInvite() public {
            FoodChain f = new FoodChain(4);
            f.openPoll(100);

            uint result = uint(f.invite(address(voters[0]), false));
            Assert.equal(result, 0, "Invite failed");
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
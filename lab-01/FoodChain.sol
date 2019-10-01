pragma solidity >=0.4.22 <0.6.0;
contract FoodChain {

    struct Voter {
        bool hasVoted;
        bool isInvited;
        bool willAttend;
        bool canVeto;
        int8[] votes;
    }
    struct Proposal {
        bool isVetoed;
    }

    address organizer;
    mapping(address => Voter) voters;
    mapping(uint => address) voterAddresses;
    uint numVoters;
    Proposal[] proposals;

    /// Create a new poll with $(_numProposals) different proposals.
    constructor(uint8 _numProposals) public {
        // The person who creates the poll is the organizer
        organizer = msg.sender;
        proposals.length = _numProposals;
        numVoters = 0;
        // Initialize all proposals as not vetoed
        for (uint8 prop = 0; prop < proposals.length; prop++){
            proposals[prop].isVetoed = false;
        }
    }

    function invite(address voterAddress, bool allowVeto) public {
        if (msg.sender != organizer || voters[voterAddress].isInvited) return;
        voters[voterAddress].canVeto = allowVeto;
        voters[voterAddress].isInvited = true;
        voters[voterAddress].hasVoted = false;
        voters[voterAddress].willAttend = false; // assume invited person will not attend
        voterAddresses[numVoters] = voterAddress;
        numVoters += 1;
    }

    function rsvp(bool intent) public{
        if (!voters[msg.sender].isInvited) return; // if voter isn't invited they cannot rsvp
        voters[msg.sender].willAttend = intent; // set the voter rsvp status, must be true to vote
    }

    function vote(int8[] memory votesArray) public {
        Voter storage sender = voters[msg.sender];
        // To vote, the sender must be invited, be attending, and have the correct # of up/down votes
        if (!sender.isInvited || !sender.willAttend || votesArray.length != proposals.length) return;
        sender.votes = votesArray; // store the number
        sender.hasVoted = true;
    }

    function winningProposal() public view returns (uint8 _winningProposal) {
        int[] memory propVotes = new int[](proposals.length);
        
        // For every voter
        for (uint i = 0; i < numVoters; i++){
            address a = voterAddresses[i];
            Voter memory v = voters[a];
            // if voter is "valid" and has voted add their votes
            if(v.isInvited && v.willAttend && v.hasVoted){
                // Count their vote for each proposal
                for (uint8 prop = 0; prop < proposals.length; prop++){
                    if(v.votes[prop]==1 || v.votes[prop]==-1) // users may only up/down vote
                        propVotes[prop] += v.votes[prop]; // add vote to proposal
                }
            }
        }
        
        int winningVoteCount = 0;
        for (uint8 prop = 0; prop < proposals.length; prop++){
            if (propVotes[prop] > winningVoteCount) {
                winningVoteCount = propVotes[prop];
                _winningProposal = prop;
            }
        }
    }
}

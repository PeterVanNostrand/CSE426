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
    enum State {init, voting, closed}
    State currentState;
    enum statusCode {success, notAllowed, incorrectState, invalidParameter}

    address organizer;
    mapping(address => Voter) voters;
    mapping(uint => address) voterAddresses;
    uint numVoters;
    Proposal[] proposals;
    uint startTime = 0;
    uint duration = 0;

    modifier timed(){
        if(currentState==State.voting && now > (startTime + duration))
            currentState = State.closed;
        _;
    }

    /// Create a new poll with numProposals different proposals
    constructor(uint8 numProposals) public {
        organizer = msg.sender; // The person who creates the poll is the organizer
        proposals.length = numProposals;
        numVoters = 0;
        currentState = State.init;
        // Initialize all proposals as not vetoed
        for (uint8 prop = 0; prop < proposals.length; prop++) proposals[prop].isVetoed = false;
    }

    function invite(address voterAddress, bool allowVeto) public timed returns(statusCode code) {
        if(msg.sender != organizer) return statusCode.notAllowed; // sender is not organizer
        if(voters[voterAddress].isInvited) return statusCode.success; // voter is already invited
        voters[voterAddress].canVeto = allowVeto;
        voters[voterAddress].isInvited = true;
        voters[voterAddress].hasVoted = false;
        voters[voterAddress].willAttend = false; // assume invited person will not attend
        voterAddresses[numVoters] = voterAddress;
        numVoters += 1;
        return statusCode.success;
    }

    function rsvp(bool intent) public timed returns(statusCode code) {
        if(!voters[msg.sender].isInvited) return statusCode.notAllowed; // if voter isn't invited they cannot rsvp
        if(currentState != State.voting) return statusCode.incorrectState; // rsvp only allowed during voting
        voters[msg.sender].willAttend = intent; // set the voter rsvp status, must be true to vote
        return statusCode.success;
    }

    function vote(int8[] memory votesArray) public timed returns(statusCode code) {
        Voter storage sender = voters[msg.sender];
        // To vote, the sender must be invited, be attending, and have the correct # of up/down votes
        if (!sender.isInvited || !sender.willAttend) return statusCode.notAllowed;
        if(currentState != State.voting) return statusCode.incorrectState;
        if(votesArray.length != proposals.length) return statusCode.invalidParameter;
        sender.votes = votesArray; // store the number
        sender.hasVoted = true;
        return statusCode.success;
    }

    function veto(uint8 proposalID) public timed returns(statusCode code) {
        Voter storage sender = voters[msg.sender];
        // must be invited, attending voter, with veto power
        if (!sender.isInvited || !sender.willAttend || !sender.canVeto) return statusCode.notAllowed;
        if(currentState != State.voting) return statusCode.incorrectState;
        if(proposalID > proposals.length-1) return statusCode.invalidParameter; // no such proposal
        proposals[proposalID].isVetoed = true;
        return statusCode.success;
    }

    function openPoll(uint durationSecs) public returns(statusCode code) {
        if(msg.sender != organizer) return statusCode.notAllowed;
        currentState = State.voting;
        startTime = now;
        duration = durationSecs;
        return statusCode.success;
    }

    function closePoll() public returns (statusCode code) {
        if(msg.sender != organizer) return statusCode.notAllowed;
        currentState = State.closed;
        return statusCode.success;
    }

    function winningProposal() public view returns (int winnerID) {
        int[] memory propVotes = new int[](proposals.length);

        // Count the votes for each prproposal
        for (uint i = 0; i < numVoters; i++){ // For every voter
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

        // Determine wining proposal
        int winningVoteCount = 0;
        int winningProp = -1;
        for (uint8 prop = 0; prop < proposals.length; prop++){
            if(proposals[prop].isVetoed) continue; // vetoed proposals can't win
            if (propVotes[prop] > winningVoteCount) {
                winningVoteCount = propVotes[prop];
                winningProp = prop;
            }
        }
        return winningProp;
    }
}

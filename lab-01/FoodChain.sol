pragma solidity >=0.4.22 <0.6.0;
contract FoodChain {

    struct Voter {
        bool hasVoted;
        bool isInvited;
        bool willAttend;
        bool canVeto;
        uint8[] votes;
    }
    struct Proposal {
        bool isVetoed;
        bool isDropped;
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
    uint256 constant UINT256_MAX = ~uint256(0);
    uint8 constant UINT8_MAX = ~uint8(0);

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

    function vote(uint8[] memory votesArray) public timed returns(statusCode code) {
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

    function winningProposal() public view returns (uint8 winnerID) {
        Proposal[] memory local_props = proposals; // copy of proposals array

        // Count the number of valid (not-vetoed or dropped) proposals
        uint8 validProposals = 0;
        for (uint8 prop = 0; prop < local_props.length; prop++)
            if(!local_props[prop].isVetoed) validProposals++;

        // Drop all but one proposal
        while(validProposals>1){
            uint[] memory propVotes = new uint[](local_props.length);
            // Count the votes for each proposal
            for (uint i = 0; i < numVoters; i++){ // For every voter
                address a = voterAddresses[i];
                Voter memory v = voters[a];
                // if voter is "valid" and has voted, count their vote
                if(v.isInvited && v.willAttend && v.hasVoted){
                    // Determine the voters first valid choice
                    uint topChoiceIndex = 0;
                    // if the voters ith choice is vetoed or eliminated, check their next choice
                    while(local_props[v.votes[topChoiceIndex]].isDropped || local_props[v.votes[topChoiceIndex]].isVetoed)
                        topChoiceIndex++;
                    // Count their vote for the first valid choice
                    propVotes[v.votes[topChoiceIndex]] += 1;
                }
            }

            // Determine the most losing proposal
            uint losingVoteCount = UINT256_MAX;
            uint8 losingProp = UINT8_MAX;
            for (uint8 prop = 0; prop < local_props.length; prop++){
                // vetoed and dropped proposals have already lost
                if(local_props[prop].isVetoed || local_props[prop].isDropped) continue;
                if (propVotes[prop] < losingVoteCount) {
                    losingVoteCount = propVotes[prop];
                    losingProp = prop;
                }
            }
            // Drop the loser
            local_props[losingProp].isDropped = true;
            validProposals--;
        }

        // The one remaining valid proposal is the winner
        uint8 winningProp = UINT8_MAX;
        for (uint8 prop = 0; prop < local_props.length; prop++)
            if(!local_props[prop].isVetoed && !local_props[prop].isDropped)
                winningProp = prop;
        return winningProp;
    }
}

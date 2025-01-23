//SPDX-License-Identifier: MIT

pragma solidity ^0.8.21;

contract ElectionContract{
    struct Candidate{
        address candidateAddress;       //address of the candidate
        uint candidateId;               //Id of the Canddiate
        uint votes;                     //numbers of votes the candidate have gone... initially it will be 0 for all the candidates
    }

    uint public candidateNumber = 0;           //varaible for keeping track of how many candidates have register for the elections and also for providing ther candidateId to each candidate
    uint vottingStart;
    uint vottingEnd;


    Candidate[] public candidates;      //array for storing data of all the candidatess standing in the elections
    mapping(address => bool) public hasVoted;          // a map for keeping the track of voters, wheather they have voted or not because each voter can vote only once.
    mapping(address => bool) public isCandidate;
    mapping(uint => Candidate) public candidateById;


    function candidateRegistration() public {               //function for getting the person registered as a candidate if it wants to stand in a election
        require(isCandidate[msg.sender] == false, "You are already a candidate.");
        Candidate memory newCandidate = Candidate(msg.sender, candidateNumber, 0);
        candidateNumber++;
        candidates.push(newCandidate);
        candidateById[candidateNumber] = newCandidate;
        isCandidate[msg.sender] = true;
    }


    function Vote(uint _candidateId) public {
        require(!hasVoted[msg.sender], "You have already Voted");
        require(_candidateId >= 0 && _candidateId <= candidateNumber, "Invalid Candidate ID");

        candidates[_candidateId].votes++;

        // candidateById[_candidateId].votes++;
        hasVoted[msg.sender] = true;
    }

    function getCandidates() public view returns(Candidate[] memory){
        return candidates;
    }


}
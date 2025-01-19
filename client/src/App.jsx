import React, { useState, useEffect } from 'react';
import { Vote, Users, Award, UserPlus, Contact } from 'lucide-react';
import Web3 from "web3";
import Election from "./contracts/ElectionContract.json"



function App() {
  const [showElectionForm, setShowElectionForm] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [state, setState] = useState({web:null, contract:null});
  const [candidateId, setCandidateId] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [currentAccount, setCurrentAccount] = useState(null);


  //auto connect wallet on loading of the page
  useEffect(() => {
    async function connectWallet() {
      if(window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            methods: 'eth_requestAccounts',
          });
          setCurrentAccount(accounts[0]);
          console.log("Connected account: ", accounts[0]);
        } catch (error) {
          console.error("Error Connecting wallet: ", error);
        }
      } else {
        console.warn("MetaMask not detected");
      }
    }

    connectWallet();
  }, [])


  //initializing the contract
  useEffect(() => {
    const web3 = new Web3(
      new Web3.providers.HttpProvider(`https://eth-sepolia.alchemyapi.io/v2/${import.meta.env.PROJECT_ID}`)
    );

    web3.eth.net.isListening()
      .then(() => console.log("Connected to Sepolia network via Alchemy"))
      .catch((error) => console.error("Error connecting to Sepolia:", error));

    async function initializeContract(){
      const networkId = (await web3.eth.net.getId()).toString();
      const deployedNetwork = Election.networks[networkId];
      const contract = new web3.eth.Contract(
        Election.abi,
        deployedNetwork.address
      );
      

      if(!deployedNetwork){
        alert("Contract not deployed");
      }else{
        // console.log("Network ID: ", networkId);
        // console.log("Deployed network address = ", deployedNetwork.address);
      }

      setState({web3: web3, contract: contract});
      // console.log(web3);
      // console.log(contract);
      fetchCandidates(contract);

    }

    web3 && initializeContract();
  }, []);



  const handleStandInElection = () => {
    setShowElectionForm(true);
  };

  const handleSubmitElection = async (event) => {
    event.preventDefault();
    const {contract, web3} = state;
    if(!contract){
      alert("Contract is not initialized");
      return;
    }

    try{
      // const accounts = await web3.eth.getAccounts();
      const transaction = await contract.methods.candidateRegistration().send(
        {from: currentAccount,
          gas: 300000
        });
      console.log(transaction);

      alert("candidate Registered Successfully");
      setWalletAddress('');
      setShowElectionForm(false);
      fetchCandidates();
    } catch(error) {
      console.error("Error registering candidate:", error);
      alert("Failed to register candidate. Please try again.");
    }
  };


  


  
  //fetching the candidates
  const fetchCandidates = async (contractInstance) =>{
    const contract = contractInstance || state.contract;
    if(!contract) return;

    try{
      setIsLoadingCandidates(true);

      const candidatesList = await contract.methods.getCandidates().call();

      if(candidatesList.length == 0){
        console.log("No candidates present.");
        setCandidates([]);
      }else{
        console.log("Fetched Candidaets: ", candidatesList)
        setCandidates(candidatesList);
      }

      const candidateCount = await contract.methods.candidateNumber().call();
      console.log("Total candidates are: ", candidateCount);

      console.log("Fetched candidates are: ", candidatesList);
      console.log("Candidate no 1 ka wallet address: ", candidatesList[0].candidateAddress);
    } catch (error){
      console.log("Error fetching condidates: ", error);
    } finally {
      setIsLoadingCandidates(false);
    }
  };


  const handleVote = async () => {
    setIsVoting(true);
    const {contract, web3} = state;

    if(!contract){
      console.log("Contract not initialized");
      return;
    }

    if(!candidateId || isNaN(candidateId) ||candidateId<0 || candidateId >= candidates.length){
      alert("Invalid Candidate ID");
      setCandidateId('');
      return;
    }

    try{
      const accounts = await web3.eth.getAccounts();
      await contract.methods.Vote(candidateId).send({
        from: currentAccount,
        gas: 300000
      });

      setCandidateId('');
      fetchCandidates();    //refresh candidates
      alert("Vote Cast Successfully");
    } catch (error){
      console.error("Error casting vote: ", error);
      alert("Failed to cast vote. Please try again later.")
    } finally {
      setIsVoting(false);
    }
    
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Vote className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Decentralized Election Platform</h1>
            </div>
            <button
              onClick={handleStandInElection}
              className="flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-lg"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Stand in Election
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Election Registration Form */}
        {showElectionForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-6">Register as a Candidate</h2>
              <p>Wallet Address: {currentAccount}</p>
              <button
                onClick={handleSubmitElection}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Register
              </button>
            </div>
          </div>
        )}

        {/* Voting Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Award className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">Cast Your Vote</h2>
          </div>
          <div className="flex space-x-4">
            <input
              type="text"
              value={candidateId}
              onChange={(e) => setCandidateId(e.target.value)}
              placeholder="Enter Candidate ID"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <button
              onClick={handleVote}
              className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-200"
            >
              {isVoting ? "Voting.." : "Vote Now"}
            </button>
          </div>
        </div>


        {/* Candidates List */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Users className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">Current Candidates</h2>
          </div>
          {isLoadingCandidates ? (
            <p>Loading candidates...</p>
          ) : candidates.length > 0 ? (
            <div className="grid gap-6">
              {candidates.map((candidate, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-6 hover:border-blue-500 transition-colors duration-200"
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Candidate ID</p>
                      <p className="font-semibold text-gray-900">{candidate.candidateId.toString()}</p>
                    </div>
                    <div className="break-all">
                      <p className="text-sm text-gray-600">Wallet Address</p>
                      <p className="font-mono text-sm text-gray-900">{candidate.candidateAddress}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Votes</p>
                      <p className="font-semibold text-gray-900">{candidate.votes.toString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No candidates available yet.</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
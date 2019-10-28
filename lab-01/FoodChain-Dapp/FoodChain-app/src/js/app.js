App = {
    web3Provider: null,
    contracts: {},
    names: new Array(),
    url: 'http://127.0.0.1:7545',
    chairPerson:null,
    currentAccount:null,
    init: function() {
      $.getJSON('../proposals.json', function(data) {
        var proposalsRow = $('#proposalsRow');
        var proposalTemplate = $('#proposalTemplate');
  
        for (i = 0; i < data.length; i ++) {
          proposalTemplate.find('.panel-title').text(data[i].name);
          // proposalTemplate.find('img').attr('src', data[i].picture);
          proposalTemplate.find('.btn-vote').attr('data-id', data[i].id);
  
          proposalsRow.append(proposalTemplate.html());
          App.names.push(data[i].name);
        }
      });
      return App.initWeb3();
    },
  
    initWeb3: function() {
          // Is there is an injected web3 instance?
      if (typeof web3 !== 'undefined') {
        App.web3Provider = web3.currentProvider;
      } else {
        // If no injected web3 instance is detected, fallback to the TestRPC
        App.web3Provider = new Web3.providers.HttpProvider(App.url);
      }
      web3 = new Web3(App.web3Provider);
  
      ethereum.enable();
  
      App.populateAddress();
      return App.initContract();
    },
  
    initContract: function() {
      $.getJSON('FoodChain.json', function(data) {
    // Get the necessary contract artifact file and instantiate it with truffle-contract
    var voteArtifact = data;
    App.contracts.vote = TruffleContract(voteArtifact);

    // Set the provider for our contract
    App.contracts.vote.setProvider(App.web3Provider);
    
    App.getOrganizer();
    return App.bindEvents();
  });
  },
  
    bindEvents: function() {
      $(document).on('click', '#btnOpen', App.handleOpen);
      $(document).on('click', '#btnClose', App.handleClose);
      $(document).on('click', '#btnRegister', App.handleRegister);
      $(document).on('click', '#btnRSVP', App.handleRSVP);
      $(document).on('click', '#btnVeto', App.handleVeto);
      $(document).on('click', '#btnVote', App.handleVote);
      $(document).on('click', '#btnWinner', App.handleWinner);
    },
  
    populateAddress : function(){
      new Web3(new Web3.providers.HttpProvider(App.url)).eth.getAccounts((err, accounts) => {
        jQuery.each(accounts,function(i){
          if(web3.eth.coinbase != accounts[i]){
            var optionElement = '<option value="'+accounts[i]+'">'+accounts[i]+'</option';
            jQuery('#selRegister').append(optionElement);  
          }
        });
      });
    },
  
    getOrganizer : function(){
      App.contracts.vote.deployed().then(function(instance) {
        return instance;
      }).then(function(result) {
        App.organizer = result.constructor.currentProvider.selectedAddress.toString();
        App.currentAccount = web3.eth.coinbase;
        if(App.organizer != App.currentAccount){
          jQuery('#address_div').css('display','none');
          jQuery('#register_div').css('display','none');
        }else{
          jQuery('#address_div').css('display','block');
          jQuery('#register_div').css('display','block');
        }
      })
    },

    handleVeto: function(){
      console.log("Handling Veto...");
      var propID = parseInt($('#txtVeto').val());
      var voteInstance;

      web3.eth.getAccounts(function(error, accounts) {
        var account = accounts[0];
        console.log("\tVoter: " + account);
        console.log("\tVetoes proposal: " + propID)
  
        App.contracts.vote.deployed().then(function(instance) {
          voteInstance = instance;
  
          return voteInstance.veto(propID, {from: account});
        }).then(function(result, error){
              if(result){
                console.log("\t%cSuccessfully vetoed proposal", "color:green");
              } else {
                console.log("\t%cError handling veto from voter: " + account, "color:red");
                console.log(error);
              }   
          });
      });
    },

    handleOpen: function(){
      console.log("Opening Poll...");
      var time = parseInt($('#txtOpen').val());
      var voteInstance;

      web3.eth.getAccounts(function(error, accounts) {
        var account = accounts[0];
  
        App.contracts.vote.deployed().then(function(instance) {
          voteInstance = instance;
  
          return voteInstance.openPoll(time, {from: account});
        }).then(function(result, error){
              if(result){
                console.log("\t%cSuccessfully opened poll", "color:green");
              } else {
                console.log("\t%cError opening poll by voter: " + account, "color:red");
                console.log(error);
              }   
          });
      });
    },

    handleClose: function(){
      console.log("Closing Poll...");
      var voteInstance;

      web3.eth.getAccounts(function(error, accounts) {
        var account = accounts[0];
  
        App.contracts.vote.deployed().then(function(instance) {
          voteInstance = instance;
  
          return voteInstance.closePoll({from: account});
        }).then(function(result, error){
              if(result){
                console.log("\t%cSuccessfully closed poll", "color:green");
              } else {
                console.log("\t%cError closing poll by voter: " + account, "color:red");
                console.log(error);
              }   
          });
      });
    },

    handleRegister: function(){
      console.log("Handling Registration...");
      var canVeto = $('#txtCanVeto').val();
      var addr = $('#selRegister').val() 
      var voteInstance;

      web3.eth.getAccounts(function(error, accounts) {
        var account = accounts[0];
        console.log("\tAccount:  " + account);
        console.log("\tRegisters Voter:  " + addr);
  
        App.contracts.vote.deployed().then(function(instance) {
          voteInstance = instance;
  
          return voteInstance.invite(addr, canVeto, {from: account});
        }).then(function(result, error){
              if(result){
                console.log("\t%cRegistration Successfull", "color:green");
              } else {
                console.log("\t%cError during registration for voter " + account, "color:red");
                console.log(error);
              }   
          });
      });
    },

    handleRSVP: function(){
      console.log("Handling RSVP...");
      var attend = $('#txtRSVP').val();
      var voteInstance;

      web3.eth.getAccounts(function(error, accounts) {
        var account = accounts[0];
        console.log("\tVoter: " + account);
        console.log("\tRSVPs: " + attend);
  
        App.contracts.vote.deployed().then(function(instance) {
          voteInstance = instance;
  
          return voteInstance.rsvp(attend, {from: account});
        }).then(function(result, error){
              if(result){
                console.log("\t%cRSVP Successfull", "color:green");
              } else {
                console.log("\t%cError during RSVP for voter " + account, "color:red");
                console.log(error);
              }   
          });
      });
    },

    handleVote: function() {
      console.log("Handling Vote...");
      var choice1 = parseInt($('#txtChoice1').val());
      var choice2 = parseInt($('#txtChoice2').val());
      var choice3 = parseInt($('#txtChoice3').val());
      var choice4 = parseInt($('#txtChoice4').val());
      var votes = [0, 0, 0, 0];
      votes[0] = choice1;
      votes[1] = choice2;
      votes[2] = choice3;
      votes[3] = choice4;
      var voteInstance;

      web3.eth.getAccounts(function(error, accounts) {
        var account = accounts[0];
        console.log("\tVoter: " + account);
        console.log("\tVotes: " + votes);
  
        App.contracts.vote.deployed().then(function(instance) {
          voteInstance = instance;
  
          return voteInstance.vote(votes, {from: account});
        }).then(function(result, error){
              if(result){
                console.log("\t%cVoting Successfull", "color:green");
              } else {
                console.log("\t%cError voting for voter " + account, "color:red");
                console.log(error);
              }   
          });
      });
    },

    handleWinner : function() {
      console.log("Getting Winner...");
      var voteInstance;
      App.contracts.vote.deployed().then(function(instance) {
        voteInstance = instance;
        return voteInstance.winningProposal();
      }).then(function(res){
        console.log("\t%cSuccessfully got winner", "color: green")
        console.log("\tWinner ID: " + res);
        alert("Choice " + res + " wins!");
      }).catch(function(error){
        console.log("\t%cError getting winner!", "color: red");
        console.log(error.message);
      })
    },
  };
  
  $(function() {
    $(window).load(function() {
      App.init();
    });
  });
  
App = {
    web3Provider: null,
    contracts: {},
    names: new Array(),
    url: 'http://127.0.0.1:7545',
    chairPerson:null,
    currentAccount:null,
    init: function() {
      console.log("App Init Start");
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
      console.log("App Init End");
      return App.initWeb3();
    },
  
    initWeb3: function() {
      console.log("Web3 init start");
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
      console.log("Web3 init end");
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
      console.log("bind event start");
      $(document).on('click', '#btnOpen', App.handleOpen);
      $(document).on('click', '#btnRegister', App.handleRegister);
      $(document).on('click', '#btnRSVP', App.handleRSVP);
      $(document).on('click', '#btnVeto', App.handleVeto);
      $(document).on('click', '#btnVote', App.handleVote);
      $(document).on('click', '#btnWinner', App.handleWinner);
      console.log("bind event end");
    },
  
    populateAddress : function(){
      new Web3(new Web3.providers.HttpProvider(App.url)).eth.getAccounts((err, accounts) => {
        jQuery.each(accounts,function(i){
          if(web3.eth.coinbase != accounts[i]){
            var optionElement = '<option value="'+accounts[i]+'">'+accounts[i]+'</option';
            jQuery('#enter_address').append(optionElement);  
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
  
        App.contracts.vote.deployed().then(function(instance) {
          voteInstance = instance;
  
          return voteInstance.veto(propID, {from: account});
        }).then(function(result, err){
              if(result){
                var code = parseInt(result.receipt.status);
                  console.log(result);
                alert("code" + code);
              } else {
                console.log(err);
                alert(account + " voting failed")
              }   
          });
      });
    },

    handleOpen: function(){
      console.log("handleOpen start");
      var time = parseInt($('#txtOpen').val());
      var voteInstance;

      web3.eth.getAccounts(function(error, accounts) {
        var account = accounts[0];
  
        App.contracts.vote.deployed().then(function(instance) {
          voteInstance = instance;
  
          return voteInstance.openPoll(time, {from: account});
        }).then(function(result, err){
              if(result){
                var code = parseInt(result.receipt.status);
                  console.log(result);
                alert("code" + code);
              } else {
                console.log(err);
                alert(account + " voting failed")
              }   
          });
      });
    },

    handleRegister: function(){
      var addr = $('#txtRegister').val();
      var canVeto = $('#txtCanVeto').val();

      console.log("handleRegister start");
      var voteInstance;

      web3.eth.getAccounts(function(error, accounts) {
        var account = accounts[0];
  
        App.contracts.vote.deployed().then(function(instance) {
          voteInstance = instance;
  
          return voteInstance.invite(addr, canVeto, {from: account});
        }).then(function(result, err){
              if(result){
                var code = parseInt(result.receipt.status);
                console.log(result);
                alert("code" + code);
              } else {
                console.log(err);
                alert(account + " invite failed");
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
  
        App.contracts.vote.deployed().then(function(instance) {
          voteInstance = instance;
  
          return voteInstance.rsvp(attend, {from: account});
        }).then(function(result, err){
              if(result){
                var code = parseInt(result.receipt.status);
                console.log(result);
                alert("code" + code);
              } else {
                console.log(error);
                alert(account + " invite failed");
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
      console.log("Votes: " + votes);
      var voteInstance;

      web3.eth.getAccounts(function(error, accounts) {
        var account = accounts[0];
  
        App.contracts.vote.deployed().then(function(instance) {
          voteInstance = instance;
  
          return voteInstance.vote(votes, {from: account});
        }).then(function(result, err){
              if(result){
                var code = parseInt(result.receipt.status);
                console.log(result);
                alert("code" + code);
              } else {
                console.log(error);
                alert(account + " invite failed");
              }   
          });
      });
    },

    handleWinner : function() {
      console.log("Handling Winner...");

      var voteInstance;
      App.contracts.vote.deployed().then(function(instance) {
        voteInstance = instance;
        return voteInstance.winningProposal();
      }).then(function(res){
      console.log(res);
        alert(res + "  is the winner ! :)");
      }).catch(function(err){
        console.log(err.message);
      })
    },
  };
  
  $(function() {
    $(window).load(function() {
      console.log("page load");
      App.init();
    });
  });
  
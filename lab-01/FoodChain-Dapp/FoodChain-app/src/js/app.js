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
            // var optionElement = '<li class="mdl-menu__item" data-val="'+ accounts[i] + '">' + accounts[i] + '</li>';
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
        }).then(function(result){
          console.log("\t%cSuccessfully vetoed proposal", "color:green");
        }).catch(function(error){
          console.log("\t%cRevert during open poll by voter: " + account, "color:red");
          console.log("\t%cLikely causes:", "color: red");
          console.log("\t%c - Must be invited to veto", "color: red");          
          console.log("\t%c - Must be attending to veto", "color: red");
          console.log("\t%c - Sender does not have veto power", "color: red");
          console.log("\t%c - Poll must be open to veto", "color: red");
          console.log("\t%c - Invalid proposal ID", "color: red");
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
        }).then(function(result){
          console.log("\t%cSuccessfully opened poll", "color:green");
        }).catch(function(error){
          console.log("\t%cRevert during open poll by voter: " + account, "color:red");
          console.log("\t%cLikely cause: User must be organizer to open poll", "color: red");
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
        }).then(function(result){
          console.log("\t%cSuccessfully closed poll", "color:green");
        }).catch(function(error){
          console.log("\t%cRevert during close poll from voter " + account, "color:red");
          console.log("\t%cLikely cause: Must be organizer to close poll", "color: red");
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
        }).then(function(result){
              // if(parseInt(result.receipt.status) == 1){
                console.log("\t%cRegistration Successfull", "color:green");
          }).catch(function(error){
            console.log("\t%cRevert during RSVP for voter " + account, "color:red");
            console.log("\t%cLikely cause: User must be organizer to invite", "color: red");
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
        }).then(function(result){
            console.log("\t%cRSVP Successfull", "color:green");
          }).catch(function(error){
            console.log("\t%cRevert during RSVP for voter " + account, "color:red");
            console.log("\t%cLikely causes:", "color: red");
            console.log("\t%c - Must be invited to RSVP", "color: red");
            console.log("\t%c - Voting must be open to RSVP", "color: red");
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
        }).then(function(result){
          console.log("\t%cVoting Successfull", "color:green");
        }).catch(function(error){
          console.log("\t%cRevert during voting for voter " + account, "color:red");
          console.log("\t%cLikely causes:", "color: red");
          console.log("\t%c - Must be invited to vote", "color: red");
          console.log("\t%c - Must be attending to vote", "color: red");
          console.log("\t%c - Poll must be open to vote", "color: red");
          console.log("\t%c - Invalid number of proposals", "color: red");
        });
      });
    },

    handleWinner : function() {
      console.log("Getting Winner...");
      var voteInstance;
      var mess = "";
      App.contracts.vote.deployed().then(function(instance) {
        voteInstance = instance;
        return voteInstance.winningProposal();
      }).then(function(res){
        console.log("\tWinner ID: " + res);
        console.log("\t%cSuccessfully got winner", "color: green");
        mess = "Choice " + res + " wins!";
        App.displayToast(mess, 4000);
      }).catch(function(error){
        console.log("\t%cError getting winner!", "color: red");
      });      
    },

    displayToast : function(text, duration){
      var snackbarContainer = document.querySelector('#demo-toast-example');
      var data = {message: text, timeout: duration};
      snackbarContainer.MaterialSnackbar.showSnackbar(data);
    },
  };
  
  $(function() {
    $(window).load(function() {
      App.init();

      App.displayToast("Please Check The Console For Detailed Information (F12)", 10000);

      var welcomeText = "Welcome to the FoodChain Application!\nI reccomend keeping this console open ahd hiding all message from other sources (such as MetaMask) as I've provided useful logging messages for each function call";
      console.log("%c"+welcomeText, "color: blue");
    });
  });
  
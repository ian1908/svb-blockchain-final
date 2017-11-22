import { Pizza } from 'app/shared/models/pizza'; // import the model of the pizza
import { Component, HostListener, NgZone } from '@angular/core';

const Web3 = require('web3'); // import web3
const contract = require('truffle-contract'); // import truffle contract 
const voting_artifacts = require('../../build/contracts/Voting.json') // import the smart contract
declare var window: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})

export class AppComponent {
  Voting = contract(voting_artifacts);
  
  account: any; // first account in contract -- contract creator
  accounts: any; // all accounts in contract
  web3: any; // Ethereum development framework -- lets you excute Ethereum based commands

  pizzaArray: Pizza[] = []; // will hold pizza's available in smart contract 
  pizzaVotes:any; // holds the votes for current voter account
    
  status: string; // status to show in html

  voter: string = '0x899dd221d6feebb010150065f8d0a80ae38725e3'; // set voter address here
  voterPassword: string = 'X!91h8G$002g'; // set voter password here
  voterUrl: string = 'https://ropsten.etherscan.io/address/' + this.voter; // shows etherscan details of voter account
  
  voterTokensBought: number; // holds total value of tokens bought by voter account
  voterTokensBalance: number; // holds total tokens open for spending for voter account
  voterETHBalance: number; // holds total ETH of voter account

  contractTokensTotal:number;
  contractTokensAvailable:number;
  contractETHBalance: number;

  tokenPrice: number; // holds token price -- 1/10 ETH

  constructor(private _ngZone: NgZone) {
  }

  @HostListener('window:load')
  windowLoaded() { // start when window loaded is retreived from browser 
    this.checkAndInstantiateWeb3(); // loads the web3 ethereum framwework
    this.onReady(); // start
  }

  checkAndInstantiateWeb3 = () => {
    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof window.web3 !== 'undefined') {
      console.warn('Using metamask or mist');
      this.web3 = new Web3(window.web3.currentProvider); // Use Mist/MetaMask's provider
    } else {
      console.warn('No web3 detected - falling back to http://localhost:8545');
      this.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545')); // sets the localhost provider -- ropsten
    }
  };

  onReady(){
    this.Voting.setProvider(this.web3.currentProvider); // sets web3 provider to use the 

    // Get the initial account balance so it can be displayed.
    this.web3.eth.getAccounts((err, accs) => {
      if (err != null) {
        this.status = 'There was an error fetching your accounts, is the network up?';
        return;
      }
      if (accs.length === 0) {
        this.status = 'Couldn\'t get any accounts! Make sure your Ethereum client is configured correctly.'
        return;
      }

      this.status = 'Connected to Ethereum Network and Smart Contract'
      this.accounts = accs;
      this.account = this.accounts[0];

      // This is run from window:load and ZoneJS is not aware of it we
      // need to use _ngZone.run() so that the UI updates on promise resolution
      this._ngZone.run(() => {
        this.populateTokenData();
        this.populatePizzas();               
      });
    });
  };

  populatePizzas(){
    // gets pizza list from contract
    this.Voting.deployed().then(contractInstance => {
        contractInstance.allPizzas.call().then(pizzaArray => {
          
          this.lookupVoterInfo(); 

          for(let i=0; i < pizzaArray.length; i++){
            contractInstance.totalVotesFor.call(this.web3.toUtf8(pizzaArray[i])).then(v => 
              {
                console.log("pizza votes - " + this.web3.toUtf8(pizzaArray[i]) + ": " + v)
                // set pizza names and id's to array  
                this.pizzaArray.push(
                  new Pizza(
                    i, // id
                    this.web3.toUtf8(pizzaArray[i]), // name
                    '../assets/images/pizzas/pizza-' + i + '.PNG', // image
                    v.toString() // votes
                    ,0
                  )
                ) 
              });
          };
        })
      }
    );
  }

  unlockAccount(){
    try{
      this.web3.personal.unlockAccount(this.voter, this.voterPassword, 15000);
      this.status = "Succesfully unlocked account " + this.voter;  
    }
    catch(e){
      this.status = e.message;
    }
  }

  buyTokens(tokensToBuy){

    this.status = "Buying " + tokensToBuy + " pizza token(s) please wait...";
    let price = tokensToBuy * this.tokenPrice;
    
    this.Voting.deployed().then(contractInstance => {
      contractInstance.buy({value: this.web3.toWei(price, 'ether'), from: this.voter})
        .then(v => {        
          this.web3.eth.getBalance(contractInstance.address, function(error, result) {});
          this.status = "Succesfully bought " + tokensToBuy + " new token(s)"             
          this.populateTokenData();
          this.lookupVoterInfo();
        })     
        .catch(e => {
          this.status = e.message;
        });    
    });
  }

  voteForPizza(pizzaName) {
    
    let voteTokens = 1;
    
    // https://ethstats.net/
    // gas price currently: 15 GWEI
    
    // 140000 is needed to run the contract transaction: 140.000 * 15 = 2100000 GWEI = 2100000000000000 WEI
    
    // https://etherconverter.online/
    // 2.100.000.000.000.000 WEI = 0.0021 ETH
    // 0.0021 ETH = 0.693 USD 
    
    
    let gas = 280000; // gas is needed to run transaction -- voter needs gas -- 1 gas     

    this.status = "Voting for " + pizzaName + ", please wait...";
     this.Voting.deployed().then(contractInstance => {
      //contractInstance.voteForPizza(pizzaName, voteTokens, {gas: 140000, from: web3.eth.accounts[0]}).then(function() {
      contractInstance.voteForPizza(pizzaName, voteTokens, {gas: gas, from: this.voter})
        .then(v => { 
          console.log(contractInstance.totalVotesFor.call(pizzaName).then(v => console.log("votes for pizza " + pizzaName + ": " + v )));
          this.status = 'Succesfully voted for pizza ' + pizzaName
        })
        .catch(e => this.status = e.message);
    });
  }  

  lookupVoterInfo() {

    // gets voter eth balance
    this.voterETHBalance = this.web3.eth.getBalance(this.voter) / 1000000000000000000 // divide to get ether amount;
    console.log("voter ETH balance: " + this.voterETHBalance)
    
    // gets voter contract info 
    this.Voting.deployed().then(contractInstance => {
      contractInstance.voterDetails.call(this.voter).then(v => {        
        this.voterTokensBought = v[0]; // set total voter tokens bought
        this.voterTokensBalance = v[0]; // set initial balance        
        
        console.log("user tokens bought: " + v[0]);
        console.log("voterdetails: " + v);
        
        let votesPerPizza = v[1];
        console.log("votes per pizze list: " + votesPerPizza);

        for(let i=0; i < this.pizzaArray.length; i++) {
          if(!votesPerPizza[i]){
            votesPerPizza[i] = 0;
          }          
          this.pizzaArray[i].userVotes = votesPerPizza[i];
          this.voterTokensBalance -= votesPerPizza[i];
        }
      });
    });
  }  

  populateTokenData(){

    // contractTokensTotal:number;
    // contractTokensAvailable:number;
    // contractETHBalance: number;

    this.Voting.deployed().then(
      contractInstance => {
        // tokens total
        contractInstance.totalTokens().then(v => {
          this.contractTokensTotal = v;
          console.log("contract tokens total: " + this.contractTokensTotal);
        });
        // tokens available
        contractInstance.balanceTokens().then(v => {
          this.contractTokensAvailable = v;
          console.log("contract tokens available: " +this.contractTokensAvailable);
        });
        // tokens sold
        contractInstance.tokensSold.call().then(v => console.log("contract tokens sold: " + v.toString()));
        // token price
        contractInstance.tokenPrice().then(v => {
          this.tokenPrice = parseFloat(this.web3.fromWei(v.toString()));
          console.log("contract token price: " + this.tokenPrice + " ETH");
        });
        // contract eth balance
        this.contractETHBalance = this.web3.eth.getBalance(contractInstance.address)/1000000000000000000;
        console.log("contract eth balance: " + this.contractETHBalance);
      })
  };

}

// We have to specify what version of compiler this code will compile with
pragma solidity ^0.4.11;

// Smart Contract
contract Voting {

// We use the struct datatype to store the voter information.
  struct voter {
    address voterAddress; // The address of the voter
    uint tokensBought;    // The total no. of tokens this voter owns
    uint[] tokensUsedPerPizza; // Array to keep track of votes per pizza.
    /* We have an array of pizzas initialized below.
     Every time this voter votes with her tokens, the value at that
     index is incremented. Example, if pizzaList array declared
     below has ["pizza1", "pizza2", "pizza3"] and this
     voter votes 10 tokens to Nick, the tokensUsedPerPizza[1]
     will be incremented by 10.
     */
  }

  /* 
      Mapping is equivalent to an associate array or hash
      The key of the mapping is pizza name stored as type bytes32 and value is
      an unsigned integer which used to store the vote count
      (keyType => valueType) mapName
      {
        pizzaName: votes
      } 
   */

  mapping (bytes32 => uint) public votesReceived;
  mapping (address => voter) public voterInfo;
  
  /*  
      Solidity doesn't let you return an array of strings yet. We will use an array of bytes32
      instead to store the list of pizzas
  */
  
  bytes32[] public pizzaList;

  uint public totalTokens; // Total no. of tokens available for this election
  uint public balanceTokens; // Total no. of tokens still available for purchase
  uint public tokenPrice; // Price per token

  /* When the contract is deployed on the blockchain, we will initialize
   the total number of tokens for sale, cost per token and all the pizzas
   */
  function Voting(uint tokens, uint pricePerToken, bytes32[] pizzaNames) {
    pizzaList = pizzaNames;
    totalTokens = tokens;
    balanceTokens = tokens;
    tokenPrice = pricePerToken;
  }

  function totalVotesFor(bytes32 pizza) constant returns (uint) {
    return votesReceived[pizza];
  }

  /* Instead of just taking the pizza name as an argument, we now also
   require the no. of tokens this voter wants to vote for the pizza
   */
  function voteForPizza(bytes32 pizza, uint votesInTokens) {
    uint index = indexOfPizza(pizza);
    if (index == uint(-1)) throw;

    // msg.sender gives us the address of the account/voter who is trying
    // to call this function
    if (voterInfo[msg.sender].tokensUsedPerPizza.length == 0) {
      for(uint i = 0; i < pizzaList.length; i++) {
        voterInfo[msg.sender].tokensUsedPerPizza.push(0);
      }
    }

    // Make sure this voter has enough tokens to cast the vote
    uint availableTokens = voterInfo[msg.sender].tokensBought - totalTokensUsed(voterInfo[msg.sender].tokensUsedPerPizza);
    if (availableTokens < votesInTokens) throw;

    votesReceived[pizza] += votesInTokens;

    // Store how many tokens were used for this pizza
    voterInfo[msg.sender].tokensUsedPerPizza[index] += votesInTokens;
  }

  // Return the sum of all the tokens used by this voter.
  function totalTokensUsed(uint[] _tokensUsedPerPizza) private constant returns (uint) {
    uint totalUsedTokens = 0;
    for(uint i = 0; i < _tokensUsedPerPizza.length; i++) {
      totalUsedTokens += _tokensUsedPerPizza[i];
    }
    return totalUsedTokens;
  }

  function indexOfPizza(bytes32 pizza) constant returns (uint) {
    for(uint i = 0; i < pizzaList.length; i++) {
      if (pizzaList[i] == pizza) {
        return i;
      }
    }
    return uint(-1);
  }

  /* This function is used to purchase the tokens. Note the keyword 'payable'
   below. By just adding that one keyword to a function, your contract can
   now accept Ether from anyone who calls this function.
   */

  function buy() payable returns (uint) {
    uint tokensToBuy = msg.value / tokenPrice;
    if (tokensToBuy > balanceTokens) throw;
    voterInfo[msg.sender].voterAddress = msg.sender;
    voterInfo[msg.sender].tokensBought += tokensToBuy;
    balanceTokens -= tokensToBuy;
    return tokensToBuy;
  }

  function tokensSold() constant returns (uint) {
    return totalTokens - balanceTokens;
  }

  function voterDetails(address user) constant returns (uint, uint[]) {
    return (voterInfo[user].tokensBought, voterInfo[user].tokensUsedPerPizza);
  }

  /* All the ether sent by voters who purchased the tokens is in this
   contract's account. This method will be used to transfer out all those ethers
   in to another account. *** The way this function is written currently, anyone can call
   this method and transfer the balance in to their account. In reality, you should add
   check to make sure only the owner of this contract can cash out.
   */

  function transferTo(address account) {
    account.transfer(this.balance);
  }

  function allPizzas() constant returns (bytes32[]) {
    return pizzaList;
  }

}
var FoodChain = artifacts.require("FoodChain");
 
module.exports = function(deployer) {
  deployer.deploy(FoodChain,4);
};

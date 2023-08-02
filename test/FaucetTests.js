const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');

describe('Faucet', function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployContractAndSetVariables() {
    const Faucet = await ethers.getContractFactory('Faucet');
    const faucet = await Faucet.deploy( {value: ethers.parseEther("1")} );

    const [owner, notOwner] = await ethers.getSigners();

    return { faucet, owner, notOwner };
  }

  it('should deploy and set the owner correctly', async function () {
    const { faucet, owner } = await loadFixture(deployContractAndSetVariables);

    expect(await faucet.owner()).to.equal(owner.address);
  });

  it('should not allow withdrawAll from address that is not owner', async function () {
    const { faucet, notOwner } = await loadFixture(deployContractAndSetVariables);

    await expect(faucet.connect(notOwner).withdrawAll()).to.be.reverted;
  });

  it('should allow withdrawAll from owner and transfer to owner', async function () {
    const { faucet, owner } = await loadFixture(deployContractAndSetVariables);
    const contractInitialBalance = await ethers.provider.getBalance(faucet);

    await expect(faucet.connect(owner).withdrawAll()).to.not.be.reverted;
    expect(ethers.provider.getBalance(owner) == contractInitialBalance);
  });

  it('should not allow withdrawal over .1 ETH', async function () {
    const { faucet } = await loadFixture(deployContractAndSetVariables);
    const withdrawAmount = await ethers.parseUnits('10', 'ether');

    await expect(faucet.withdraw(withdrawAmount)).to.be.reverted;
  });

  it('should not allow destroy from address that is not owner', async function () {
    const { faucet, notOwner } = await loadFixture(deployContractAndSetVariables);

    await expect(faucet.connect(notOwner).destroyFaucet()).to.be.reverted;
  });
  
  it('should self destroy', async function () {
    const { faucet, owner } = await loadFixture(deployContractAndSetVariables);

    await faucet.connect(owner).destroyFaucet();

    expect(await ethers.provider.getCode(faucet)).to.equal('0x');
  });
});
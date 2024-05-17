const { ethers } = require('ethers')
const hre = require('hardhat')

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(
    'http://127.0.0.1:8545/'
  )
  const signer = provider.getSigner()

  console.log(
    'Deploying contracts with the account:',
    await signer.getAddress()
  )

  const Land = await hre.ethers.getContractFactory('Land')
  const land = await Land.deploy()

  console.log('Land contract deployed to:', land.address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

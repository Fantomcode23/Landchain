const express = require('express')
const app = express()
const path = require('path')
const ethers = require('ethers')
const { abi } = require('./public/Land.json')
const port = 8080
const ejsmate = require('ejs-mate')
const methodoverride = require('method-override')
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '/views'))
app.use(express.static(path.join(__dirname, '/public')))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.engine('ejs', ejsmate)
app.use(methodoverride('_method'))

const rpcUrl = 'http://127.0.0.1:8545/'
const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
const gasPrice = ethers.utils.parseUnits('100', 'gwei')

const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'
const contract = new ethers.Contract(contractAddress, abi, provider)
const privateKey =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

let walletAddress = null

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})

app.post('/connect-wallet', async (req, res) => {
  try {
    const { walletAddress: address } = req.body
    walletAddress = address
    res.json({ message: 'Wallet connected successfully!' })
  } catch (error) {
    console.error('Error connecting wallet:', error)
    res.status(500).json({ error: 'Error connecting wallet' })
  }
})

const ensureWalletAddress = async (req, res, next) => {
  try {
    while (!walletAddress) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    next()
  } catch (error) {
    console.error('Error ensuring wallet address:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}

app.get('/', async (req, res) => {
  res.locals.ethers = ethers
  res.render('listings/index.ejs')
})
app.get('/ownerdetails', (req, res) => {
  res.render('listings/ownerdetails.ejs')
})
app.get('/userdetails', ensureWalletAddress, async (req, res) => {
  res.render('listings/userdetails.ejs')
})
app.get('/govtauth'),
  (req, res) => {
    res.render('listings/govtauthdetails.ejs')
  }
app.post('/gotownerdetails', async (req, res) => {
  let ownerdetails = req.body
  const transaction = await contract.addLand(
    ownerdetails.unitarea,
    ownerdetails.landaddress,
    ownerdetails.landprice,
    ownerdetails.propertyid,
    ownerdetails.documentno
  )
  await transaction.wait()
  res.json({ message: 'Land registered successfully!' })
  alert('Land Registered Succesully')
})
app.post('/gotuserdetails', ensureWalletAddress, async (req, res) => {
  try {
    const {
      username: username,
      age: age,
      city: city,
      aadharno: aadharno,
      panno: panno,
      emailid: emailid,
    } = req.body

    const wallet = new ethers.Wallet(privateKey, provider)
    const signer = wallet.connect(provider)
    const contractWithSigner = contract.connect(signer)
    console.log(username, age, city, aadharno, panno, emailid)
    const transaction = await contractWithSigner.registerUser(
      username,
      age,
      city,
      aadharno,
      panno,
      emailid,
      {
        gasLimit: 3000000,
        gasPrice,
      }
    )
    await transaction.wait()
    res.json({ message: 'Buyer registered successfully!' })
  } catch (error) {
    console.error(error)
  }
})

app.get('/registeredUsers', async (req, res) => {
  const wallet = new ethers.Wallet(privateKey, provider)
  const signer = wallet.connect(provider)
  const contractWithSigner = contract.connect(signer)
  const registeredUsers = await contractWithSigner.ReturnAllUserList()
  console.log(registeredUsers)
  res.render('listings/buyer.ejs', { registeredUsers })
})

app.post('/gotgovtauth', async (req, res) => {
  try {
    const { name, age, designation, city } = req.body

    const address = walletAddress
    const wallet = new ethers.Wallet(address, provider)

    const signer = wallet.connect(provider)

    const contractWithSigner = contract.connect(signer)

    const transaction = await contractWithSigner.addGovtAuthority(
      address,
      name,
      age,
      designation,
      city
    )
    await transaction.wait()

    res.json({ message: 'Government authority registered successfully!' })
    alert('Govt authority registered')
  } catch (error) {
    console.error('Error registering government authority:', error)
    res.status(500).json({ error: 'Error registering government authority' })
  }
})

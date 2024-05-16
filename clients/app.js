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
app.get('/govtauth', (req, res) => {
  res.render('listings/govtauthdetails.ejs')
})
app.post('/gotownerdetails', async (req, res) => {
  const wallet = new ethers.Wallet(privateKey, provider)
  const signer = wallet.connect(provider)
  const contractWithSigner = contract.connect(signer)

  let ownerdetails = req.body
  console.log(
    ownerdetails.unitarea,
    ownerdetails.landaddress,
    ownerdetails.landprice,
    ownerdetails.propertyid,
    ownerdetails.documentno
  )
  const transaction = await contractWithSigner.addLand(
    ownerdetails.unitarea,
    ownerdetails.landaddress,
    ownerdetails.landprice,
    ownerdetails.propertyid,
    ownerdetails.documentno
  )
  await transaction.wait()
  console.log('Transaction done')
  res.redirect('/owner')
})

app.get('/owner', async (req, res) => {
  const landDetailsArray = []
  const landIds = await contract.ReturnAllLandList()
  for (let i = 0; i < landIds.length; i++) {
    const landId = landIds[i]
    const landDetails = await contract.lands(landId)

    const id = landDetails.id.toNumber()
    const area = landDetails.area.toNumber()
    const landPrice = landDetails.landPrice.toNumber()
    const landObject = {
      id: id,
      area: area,
      landAddress: landDetails.landAddress,
      landPrice: landPrice,
    }
    landDetailsArray.push(landObject)
  }
  res.render('listings/owner.ejs', { landDetailsArray })
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
    res.redirect('/registeredUsers')
  } catch (error) {
    console.error(error)
  }
})

app.get('/registeredUsers', async (req, res) => {
  try {
    const wallet = new ethers.Wallet(privateKey, provider)
    const landDetailsArray = []
    const signer = wallet.connect(provider)
    const contractWithSigner = contract.connect(signer)
    const userDetails = await contractWithSigner.UserMapping(walletAddress)
    if (!userDetails.id) {
      return res.status(404).send('User not found')
    }
    const userObject = {
      id: userDetails.id,
      name: userDetails.name,
      age: userDetails.age.toNumber(),
      city: userDetails.city,
      aadharNumber: userDetails.aadharNumber,
      panNumber: userDetails.panNumber,
      email: userDetails.email,
    }

    console.log(userObject)

    const landIds = await contract.ReturnAllLandList()
    for (let i = 0; i < landIds.length; i++) {
      const landId = landIds[i]
      const landDetails = await contract.lands(landId)

      const id = landDetails.id.toNumber()
      const area = landDetails.area.toNumber()
      const landPrice = landDetails.landPrice.toNumber()
      const landObject = {
        id: id,
        area: area,
        landAddress: landDetails.landAddress,
        landPrice: landPrice,
      }
      landDetailsArray.push(landObject)
    }
    res.render('listings/buyer.ejs', { landDetailsArray, userObject })
  } catch (error) {
    console.error(error)
  }
})

app.post('/gotgovtauth', ensureWalletAddress, async (req, res) => {
  try {
    const { username, age, designation, city } = req.body

    console.log(username, age, designation, city)

    const wallet = new ethers.Wallet(privateKey, provider)

    const signer = wallet.connect(provider)

    const contractWithSigner = contract.connect(signer)

    console.log(walletAddress)

    const transaction = await contractWithSigner.addGovtAuthority(
      walletAddress,
      username,
      age,
      designation,
      city
    )
    await transaction.wait()
    res.render('listings/govtauthdetails.ejs')
  } catch (error) {
    console.error('Error registering government authority:', error)
    res.status(500).json({ error: 'Error registering government authority' })
  }
})

app.get('/', async (req, res) => {
  res.render('listings/govtauthdetails.ejs')
})
app.get('/ownerdetails', (req, res) => {
  res.render('listings/ownerdetails.ejs')
})
app.get('/userdetails', (req, res) => {
  res.render('listings/userdetails.ejs')
})
app.post('/gotownerdetails', (req, res) => {
  let ownerdetails = req.body
  res.render('listings/owner.ejs', { ownerdetails })
})
app.post('/gotuserdetails', (req, res) => {
  let userdetails = req.body
  res.render('listings/buyer.ejs', { userdetails })
})
app.get('/owner/:id', async (req, res) => {
  let { id } = req.params
  const landDetails = []
  const land = await contract.ReturnAllLandList()
  const landId = land[id]
  const lands = await contract.lands(landId)
  const area = lands.area.toNumber()
  const landPrice = lands.landPrice.toNumber()
  const propertyid = lands.propertyPID.toNumber()
  const address = lands.landAddress
  const document = lands.document
  landObj = {
    area: area,
    address: address,
    landPrice: landPrice,
    propertyid: propertyid,
    document: document,
  }
  landDetails.push(landObj)
  res.render('listings/showpropowner.ejs', { landDetails })
})
app.get('/buyer/:id', (req, res) => {
  res.render('listings/showpropuser.ejs')
})
app.get('/addtosale/:id', async (req, res) => {
  let { id } = req.params
  const wallet = new ethers.Wallet(privateKey, provider)
  const signer = wallet.connect(provider)
  const contractWithSigner = contract.connect(signer)
  const tx = await contractWithSigner.makeItforSell(id, {
    gasLimit: 3000000,
    gasPrice,
  })
  const receipt = await tx.wait()
  console.log('Transaction receipt:', receipt)
  res.send('Land added for sale successfully')
})

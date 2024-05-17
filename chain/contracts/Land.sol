// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Land is ERC721URIStorage, Ownable {
    address public contractOwner;

    constructor() ERC721("LandNFT", "LND")  Ownable(msg.sender) {
        contractOwner = msg.sender;
    }

    struct Landreg {
        uint id;
        uint area;
        string landAddress;
        uint landPrice;
        uint propertyPID;
        string document;
        bool isforSell;
        address payable ownerAddress;
        bool isLandVerified;
    }

    
    struct User {
        address id;
        string name;
        uint age;
        string city;
        string aadharNumber;
        string panNumber;
        string email;
        bool isUserVerified;
    }

    struct GovtAuthority {
        uint id;
        address _addr;
        string name;
        uint age;
        string designation;
        string city;
    }

     struct LandRequest {
        uint reqId;
        address payable sellerId;
        address payable buyerId;
        uint landId;
        reqStatus requestStatus;
        bool isPaymentDone;
     }

     enum reqStatus { requested, accepted, rejected, paymentdone, commpleted }

    uint govtAuthoritiesCount;
    uint public userCount;
    uint public landsCount;
    uint public documentId;
    uint requestCount;

    mapping(address => GovtAuthority) public GovtAuthorityMapping;
    mapping(uint => address[]) allGovtAuthorityList;
    mapping(address => bool) RegisteredGovtAuthorityMapping;
    mapping(address => User) public UserMapping;
    mapping(uint => address) AllUsers;
    mapping(uint => address[]) allUsersList;
    mapping(address => bool) RegisteredUserMapping;
    mapping(address => uint[]) MyLands;
    mapping(uint => Landreg) public lands;
    mapping(uint => LandRequest) public LandRequestMapping;
    mapping(address => uint[]) MyReceivedLandRequest;
    mapping(address => uint[]) MySentLandRequest;
    mapping(uint => uint[]) allLandList;
    mapping(uint => uint[]) paymentDoneList;
    

    function isContractOwner(address _addr) public view returns(bool) {
        return _addr == contractOwner;
    }

    function changeContractOwner(address _addr) public {
        require(msg.sender == contractOwner, "you are not contractOwner");
        contractOwner = _addr;
    }

     
     // Govt Authority

     function addGovtAuthority(address _addr, string memory _name, uint _age, string memory _designation, string memory _city) public returns(bool) {
        if (contractOwner != msg.sender)
            return false;
        require(contractOwner == msg.sender);
        RegisteredGovtAuthorityMapping[_addr] = true;
        allGovtAuthorityList[1].push(_addr);
        GovtAuthorityMapping[_addr] = GovtAuthority(govtAuthoritiesCount, _addr, _name, _age, _designation, _city);
        return true;
    }


    function removeGovtAuthority(address _addr) public {
        require(msg.sender == contractOwner, "You are not contractOwner");
        require(RegisteredGovtAuthorityMapping[_addr], "Govt authority not found");
        RegisteredGovtAuthorityMapping[_addr] = false;

        uint len = allGovtAuthorityList[1].length;
        for (uint i = 0; i < len; i++) {
            if (allGovtAuthorityList[1][i] == _addr) {
                allGovtAuthorityList[1][i] = allGovtAuthorityList[1][len - 1];
                allGovtAuthorityList[1].pop();
                break;
            }
        }
    }

     function ReturnAllGovtAuthorityList() public view returns(address[] memory) {
        return allGovtAuthorityList[1];
    }

    function isGovtAuthority(address _id) public view returns (bool) {
        return RegisteredGovtAuthorityMapping[_id];
    }

    //buyer

     function isUserRegistered(address _addr) public view returns(bool) {
        return RegisteredUserMapping[_addr];
    }

    function registerUser(string memory _name, uint _age, string memory _city, string memory _aadharNumber, string memory _panNumber, string memory _email) public {
        require(!RegisteredUserMapping[msg.sender]);

        RegisteredUserMapping[msg.sender] = true;
        userCount++;
        allUsersList[1].push(msg.sender);
        AllUsers[userCount] = msg.sender;
        UserMapping[msg.sender] = User(msg.sender, _name, _age, _city, _aadharNumber, _panNumber, _email, false);
    }

    function verifyUser(address _userId) public {
        require(isGovtAuthority(msg.sender));
        UserMapping[_userId].isUserVerified = true;
    }

    function isUserVerified(address id) public view returns(bool) {
        return UserMapping[id].isUserVerified;
    }

    function ReturnAllUserList() public view returns(address[] memory) {
        return allUsersList[1];  
    }

//  function getUserDetails(address _userId) public view returns (
//     string memory name,
//     uint age,
//     string memory city,
//     string memory aadharNumber,
//     string memory panNumber,
//     string memory email
// ) {
//     require(RegisteredUserMapping[_userId], "User not found");
    
//     User memory user = UserMapping[_userId];
//     return user
// } 



//Land

function addLand(uint _area, string memory _address, uint _landPrice, uint _propertyPID, string memory _document) public {
        landsCount++;
        lands[landsCount] = Landreg(landsCount, _area, _address, _landPrice,_propertyPID, _document,false, payable(msg.sender) ,false);
        MyLands[msg.sender].push(landsCount);
        allLandList[1].push(landsCount);
         _mint(payable(msg.sender), landsCount);
        _setTokenURI(landsCount, _document);
    }

    function ReturnAllLandList() public view returns(uint[] memory)
    {
        return allLandList[1];
    }

    function verifyLand(uint _id) public{
        require(isGovtAuthority(msg.sender));
        lands[_id].isLandVerified=true;
    }
    function isLandVerified(uint id) public view returns(bool){
        return lands[id].isLandVerified;
    }

    function myAllLands(address id) public view returns( uint[] memory){
        return MyLands[id];
    }


    function makeItforSell(uint id) public{
        require(lands[id].ownerAddress==msg.sender);
        lands[id].isforSell=true;
    }

  function requestforBuy(uint _landId) public {
    require(isUserVerified(msg.sender) && isLandVerified(_landId));
    requestCount++;
    LandRequestMapping[requestCount] = LandRequest(
        requestCount,
        payable(lands[_landId].ownerAddress), 
        payable(msg.sender), 
        _landId,
        reqStatus.requested,
        false
    );
    MyReceivedLandRequest[lands[_landId].ownerAddress].push(requestCount);
    MySentLandRequest[msg.sender].push(requestCount);
   }


    function myReceivedLandRequests() public view returns(uint[] memory)
    {
        return MyReceivedLandRequest[msg.sender];
    }
    function mySentLandRequests() public view returns(uint[] memory)
    {
        return MySentLandRequest[msg.sender];
    } 
    function acceptRequest(uint _requestId) public
    {
        require(LandRequestMapping[_requestId].sellerId==msg.sender);
        LandRequestMapping[_requestId].requestStatus=reqStatus.accepted;
    }
    function rejectRequest(uint _requestId) public
    {
        require(LandRequestMapping[_requestId].sellerId==msg.sender);
        LandRequestMapping[_requestId].requestStatus=reqStatus.rejected;
    }

    function requesteStatus(uint id) public view returns(bool)
    {
        return LandRequestMapping[id].isPaymentDone;
    }

    function landPrice(uint id) public view returns(uint)
    {
        return lands[id].landPrice;
    }
    function makePayment(uint _requestId) public payable
    {
        require(LandRequestMapping[_requestId].buyerId==msg.sender && LandRequestMapping[_requestId].requestStatus==reqStatus.accepted);

        LandRequestMapping[_requestId].requestStatus=reqStatus.paymentdone;
        lands[LandRequestMapping[_requestId].landId].ownerAddress.transfer(msg.value);
        LandRequestMapping[_requestId].isPaymentDone=true;
        paymentDoneList[1].push(_requestId);
    }

    function returnPaymentDoneList() public view returns(uint[] memory)
    {
        return paymentDoneList[1];
    }

    function transferOwnership(uint _requestId) public returns (bool) {
    require(isGovtAuthority(msg.sender));

    LandRequestMapping[_requestId].requestStatus = reqStatus.commpleted;
    MyLands[LandRequestMapping[_requestId].buyerId].push(LandRequestMapping[_requestId].landId);

    uint len = MyLands[LandRequestMapping[_requestId].sellerId].length;
    for (uint i = 0; i < len; i++) {
        if (MyLands[LandRequestMapping[_requestId].sellerId][i] == LandRequestMapping[_requestId].landId) {
            MyLands[LandRequestMapping[_requestId].sellerId][i] = MyLands[LandRequestMapping[_requestId].sellerId][len - 1];
            MyLands[LandRequestMapping[_requestId].sellerId].pop();
            break;
        }
    }

    lands[LandRequestMapping[_requestId].landId].isforSell = false;
    lands[LandRequestMapping[_requestId].landId].ownerAddress = LandRequestMapping[_requestId].buyerId;

    return true;
}

    function makePaymentTestFun(address payable _reveiver) public payable
    {
        _reveiver.transfer(msg.value);
    }
}
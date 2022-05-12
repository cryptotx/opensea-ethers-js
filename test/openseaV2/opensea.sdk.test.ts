import * as secrets from '../../../secrets.json'
import {assetToMetadata} from "../../src/openseaEx/utils/helper";
import {OpenseaEx} from "../../src/openseaEx/openseaEx";
import {UserAccount, Asset, SellOrderParams} from "web3-wallets";


const buyer = '0x9F7A946d935c8Efc7A8329C0d894A69bA241345A'
const seller = '0x0A56b3317eD60dC4E1027A63ffbE9df6fb102401'

// const standard = ExSchemaName.OpenseaEx

;(async () => {
        try {
            const chainId = 4
            const eleEx = new OpenseaEx({
                chainId,
                address: seller,
                priKey: secrets.accounts[seller]
            },)

            const buyerSdk = new OpenseaEx({
                chainId,
                address: buyer,
                priKey: secrets.accounts[buyer]
            })
            const sellAsset = {
                tokenId: '203089',//
                tokenAddress: '0x5fecbbbaf9f3126043a48a35eb2eb8667d469d53',
                schemaName: 'ERC721'
            } as Asset;

            const sellBal = await eleEx.userAccount.getAssetBalances(sellAsset)
            const buyerBal = await eleEx.userAccount.getAssetBalances(sellAsset, buyer)
            if (sellBal == '0' && buyerBal == '0') {
                throw 'Asset balance 0'
            }
            if (Number(buyerBal) > Number(sellBal)) {
                const buyerSDK = new UserAccount({
                    chainId,
                    address: buyer,
                    priKey: secrets.accounts[buyer]
                });
                const metadata = assetToMetadata(sellAsset, "1")
                const tx = await buyerSDK.assetTransfer(metadata, seller)
                await tx.wait()
            }

            // paymentToken: sellEx.contracts.ETH,
            const sellParams = {
                asset: sellAsset,
                startAmount: 0.002,
            } as SellOrderParams

            // const step = await eleEx.getOrderApproveStep(sellParams, OrderType.Sell)
            // console.log(step)
            const sellData = await eleEx.createSellOrder(sellParams)
            const orderStr = JSON.stringify(sellData)

            // const res = await eleEx.postOpenSeaOrder(orderStr)
            // const res = await eleEx.postOrder(orderStr,{standard})
            // console.log(res)
            const {callData, params, sell, buy} = await buyerSdk.getMatchCallData({
                orderStr,
            })
            //https://rinkeby.etherscan.io/tx/0x290a6ae032856189e148b0d352ab76b45c2f07bbf2db4f32ed65c21e2798c5a6
            const gas = await buyerSdk.estimateGas(callData).catch(async (err: any) => {
                console.log(err)
            })
            console.log('Buy Now success ', gas)

            // const acceptTx = await buyerSdk.acceptOrder(orderStr, {standard}).catch(async (err: any) => {
            //     console.log(err)
            // })
            // await acceptTx.wait()
            // console.log('Buy Now success ', acceptTx.hash)

            const buyData = await buyerSdk.createBuyOrder(sellParams)

            const buyOrderStr = JSON.stringify(buyData)
            const offerOrder = await eleEx.getMatchCallData({
                orderStr: buyOrderStr,
            })

            //ok https://rinkeby.etherscan.io/tx/0x1a9ab7ba090f62460a2157187578ba7698cadd9d48a430cadc2da785e890c0b8
            const offerGas = await eleEx.estimateGas(offerOrder.callData).catch(async (err: any) => {
                console.log(err)
            })
            console.log("Offer  success ", offerGas)
            // const tx = await eleEx.ethSend(offerOrder.callData)
            // if(tx){
            //     console.log(tx.hash)
            // }
        } catch
            (e) {
            console.log(e)
        }
    }
)()

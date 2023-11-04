import algosdk from "algosdk";
import {
    algodClient,
    indexerClient,
    marketplaceNote,
    minRound,
    myAlgoConnect,
    numGlobalBytes,
    numGlobalInts,
    numLocalBytes,
    numLocalInts
} from "./constants";
/* eslint import/no-webpack-loader-syntax: off */
import approvalProgram from "!!raw-loader!../contracts/marketplace_approval.teal";
import clearProgram from "!!raw-loader!../contracts/marketplace_clear.teal";
import { base64ToUTF8String, utf8ToBase64String } from "./conversions";
global.Buffer = global.Buffer || require('buffer').Buffer

class Product {
    constructor(name, image, description, price, sold, appId, owner, gifted) {
        this.name = name;
        this.image = image;
        this.description = description;
        this.price = price;
        this.sold = sold;
        this.appId = appId;
        this.owner = owner;
        this.gifted = gifted;
    }
}

// Compile smart contract in .teal format to program
const compileProgram = async (programSource) => {
    let encoder = new TextEncoder();
    let programBytes = encoder.encode(programSource);
    let compileResponse = await algodClient.compile(programBytes).do();
    const compiledProgramBase64 = compileResponse.result;
    console.log("Compiled Program Base64:", compiledProgramBase64);
    return new Uint8Array(Buffer.from(compileResponse.result, "base64"));
}

// CREATE PRODUCT: ApplicationCreateTxn
export const createProductAction = async (senderAddress, product) => {
    console.log("Adding product...")

    let params = await algodClient.getTransactionParams().do();
    params.fee = algosdk.ALGORAND_MIN_TX_FEE;
    params.flatFee = true;

    // Compile programs
    const compiledApprovalProgram = await compileProgram(approvalProgram)
    const compiledClearProgram = await compileProgram(clearProgram)

    // Build note to identify transaction later and required app args as Uint8Arrays
    let note = new TextEncoder().encode(marketplaceNote);
    let name = new TextEncoder().encode(product.name);
    let image = new TextEncoder().encode(product.image);
    let description = new TextEncoder().encode(product.description);
    let price = algosdk.encodeUint64(product.price);

    let appArgs = [name, image, description, price]

    // Create ApplicationCreateTxn
    let txn = algosdk.makeApplicationCreateTxnFromObject({
        from: senderAddress,
        suggestedParams: params,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        approvalProgram: compiledApprovalProgram,
        clearProgram: compiledClearProgram,
        numLocalInts: numLocalInts,
        numLocalByteSlices: numLocalBytes,
        numGlobalInts: numGlobalInts,
        numGlobalByteSlices: numGlobalBytes,
        note: note,
        appArgs: appArgs
    });

    // Get transaction ID
    let txId = txn.txID().toString();

    // Sign & submit the transaction
    let signedTxn = await myAlgoConnect.signTransaction(txn.toByte());
    console.log("Signed transaction with txID: %s", txId);
    await algodClient.sendRawTransaction(signedTxn.blob).do();

    // Wait for transaction to be confirmed
    let confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);

    // Get the completed Transaction
    console.log("Transaction " + txId + " confirmed in round " + confirmedTxn["confirmed-round"]);

    // Get created application id and notify about completion
    let transactionResponse = await algodClient.pendingTransactionInformation(txId).do();
    let appId = transactionResponse['application-index'];
    console.log("Created new app-id: ", appId);
    return appId;
}

// BUY PRODUCT: Group transaction consisting of ApplicationCallTxn and PaymentTxn
export const buyProductAction = async (senderAddress, product, count) => {
    console.log("Buying product...");
    console.log(senderAddress, product.owner)

    let params = await algodClient.getTransactionParams().do();

    // Build required app args as Uint8Array
    let buyArg = new TextEncoder().encode("buy")
    let countArg = algosdk.encodeUint64(count);
    let appArgs = [buyArg, countArg]

    // Create ApplicationCallTxn
    let appCallTxn = algosdk.makeApplicationCallTxnFromObject({
        from: senderAddress,
        appIndex: product.appId,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        suggestedParams: params,
        appArgs: appArgs
    })

    // Create PaymentTxn
    let paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: senderAddress,
        to: product.owner,
        amount: product.price * count,
        suggestedParams: params
    })

    let txnArray = [appCallTxn, paymentTxn]

    // Create group transaction out of previously build transactions
    let groupID = algosdk.computeGroupID(txnArray)
    for (let i = 0; i < 2; i++) txnArray[i].group = groupID;

    // Sign & submit the group transaction
    let signedTxn = await myAlgoConnect.signTransaction(txnArray.map(txn => txn.toByte()));
    console.log("Signed group transaction");
    let tx = await algodClient.sendRawTransaction(signedTxn.map(txn => txn.blob)).do();
    console.log(tx)

    // Wait for group transaction to be confirmed
    let confirmedTxn = await algosdk.waitForConfirmation(algodClient, tx.txId, 4);

    // Notify about completion
    console.log("Group transaction " + tx.txId + " confirmed in round " + confirmedTxn["confirmed-round"]);
}

// DELETE PRODUCT: ApplicationDeleteTxn
export const deleteProductAction = async (senderAddress, index) => {
    console.log("Deleting application...");

    let params = await algodClient.getTransactionParams().do();
    params.fee = algosdk.ALGORAND_MIN_TX_FEE;
    params.flatFee = true;

    // Create ApplicationDeleteTxn
    let txn = algosdk.makeApplicationDeleteTxnFromObject({
        from: senderAddress, suggestedParams: params, appIndex: index,
    });

    // Get transaction ID
    let txId = txn.txID().toString();

    // Sign & submit the transaction
    let signedTxn = await myAlgoConnect.signTransaction(txn.toByte());
    console.log("Signed transaction with txID: %s", txId);
    await algodClient.sendRawTransaction(signedTxn.blob).do();

    // Wait for transaction to be confirmed
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);

    // Get the completed Transaction
    console.log("Transaction " + txId + " confirmed in round " + confirmedTxn["confirmed-round"]);

    // Get application id of deleted application and notify about completion
    let transactionResponse = await algodClient.pendingTransactionInformation(txId).do();
    let appId = transactionResponse['txn']['txn'].apid;
    console.log("Deleted app-id: ", appId);
}

// GIFT PRODUCT: ApplicationGiftTxn
export const giftProductAction = async (senderAddress, appId, receiver) => {
    // try {
    console.log("Gifting product...");

    let params = await algodClient.getTransactionParams().do();
    params.fee = algosdk.ALGORAND_MIN_TX_FEE;
    params.flatFee = true;

    let giftArg = new TextEncoder().encode("gift");

    const appCallTxn = algosdk.makeApplicationNoOpTxnFromObject({
        from: senderAddress,
        suggestedParams: params,
        appIndex: appId,
        appArgs: [giftArg, algosdk.decodeAddress(receiver).publicKey],
    });

    console.log(appCallTxn);
    // Get transaction ID
    let txId = appCallTxn.txID().toString();

    // Sign & submit the transaction
    let signedTxn = await myAlgoConnect.signTransaction(appCallTxn.toByte());
    console.log("Signed transaction with txID: %s", txId, signedTxn);
    await algodClient.sendRawTransaction(signedTxn.blob).do();

    // Wait for transaction to be confirmed
    let confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);

    // Get the completed Transaction
    console.log(
        "Transaction " +
        txId +
        " confirmed in round " +
        confirmedTxn["confirmed-round"]
    );
    console.log("Gifted Application Params");
};

// UPDATE PRODUCTS: 
export const updateProductAction = async (senderAddress, appId, price, description) => {
    console.log("Updating...");

    let params = await algodClient.getTransactionParams().do();

    // Build required app args as Uint8Array
    let updateArg = new TextEncoder().encode("update");
    // let newPrice = new TextEncoder().encode(price);
    let newPrice = new Uint8Array(algosdk.encodeUint64(price * 1000000));
    let newDescription = new TextEncoder().encode(description);

    let appArgs = [updateArg, newPrice, newDescription];

    // Create ApplicationCallTxn
    let appCallTxn = algosdk.makeApplicationCallTxnFromObject({
        from: senderAddress,
        appIndex: appId,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        suggestedParams: params,
        appArgs: appArgs,
    });

    let txnArray = [appCallTxn];

    // Create group transaction out of previously build transactions
    let groupID = algosdk.computeGroupID(txnArray);
    for (let i = 0; i < 1; i++) txnArray[i].group = groupID;

    // Sign & submit the group transaction
    let signedTxn = await myAlgoConnect.signTransaction(
        txnArray.map((txn) => txn.toByte())
    );
    console.log("Signed group transaction");
    let tx = await algodClient
        .sendRawTransaction(signedTxn.map((txn) => txn.blob))
        .do();

    // Wait for group transaction to be confirmed
    let confirmedTxn = await algosdk.waitForConfirmation(algodClient, tx.txId, 4);

    // Notify about completion
    console.log(
        "Group transaction " +
        tx.txId +
        " confirmed in round " +
        confirmedTxn["confirmed-round"]
    );
}

// GET PRODUCTS: Use indexer
export const getProductsAction = async () => {
    console.log("Fetching products...")


    // Get latest round for minRound filter
    const latestRound = await getStatus()

    let note = new TextEncoder().encode(marketplaceNote);
    let encodedNote = Buffer.from(note).toString("base64");

    // Step 1: Get all transactions by notePrefix (+ minRound filter for performance)
    let transactionInfo = await indexerClient.searchForTransactions()
        .notePrefix(encodedNote)
        .txType("appl")
        .minRound(latestRound)
        .do();
    let products = []
    console.log(transactionInfo)
    console.log(transactionInfo.transactions)
    for (const transaction of transactionInfo.transactions) {
        let appId = transaction["created-application-index"]
        console.log("Getting product id")
        console.log(appId)
        if (appId) {
            // Step 2: Get each application by application id
            let product = await getApplication(appId)
            if (product) {
                products.push(product)
            }
        }
    }
    console.log("Products fetched.")
    console.log(products)
    return products
}

const getStatus = async () => {
    try {
        const status = await algodClient.status().do();
        const latestRound = status['last-round'];

        if (!latestRound) {
            return minRound
        }

        return Number(latestRound) - 1000 || minRound
    } catch (error) {
        console.error('Error getting status:', error);
        throw error;
    }
};

const getApplication = async (appId) => {
    console.log(appId)
    try {
        // 1. Get application by appId
        let response = await indexerClient.lookupApplications(appId).includeAll(true).do();
        console.log(response);
        if (response.application.deleted) {
            return null;
        }
        let globalState = response.application.params["global-state"]

        // 2. Parse fields of response and return product
        let owner = ""
        let name = ""
        let image = ""
        let description = ""
        let price = 0
        let sold = 0
        let gifted = ""

        const getField = (fieldName, globalState) => {
            return globalState.find(state => {
                return state.key === utf8ToBase64String(fieldName);
            })
        }

        if (getField("NAME", globalState) !== undefined) {
            let field = getField("NAME", globalState).value.bytes
            name = base64ToUTF8String(field)
        }

        if (getField("OWNER", globalState) !== undefined) {
            let field = getField("OWNER", globalState).value.bytes;
            owner = algosdk.encodeAddress(Buffer.from(field, "base64"));
        }

        if (getField("IMAGE", globalState) !== undefined) {
            let field = getField("IMAGE", globalState).value.bytes
            image = base64ToUTF8String(field)
        }

        if (getField("DESCRIPTION", globalState) !== undefined) {
            let field = getField("DESCRIPTION", globalState).value.bytes
            description = base64ToUTF8String(field)
        }

        if (getField("PRICE", globalState) !== undefined) {
            price = getField("PRICE", globalState).value.uint
        }

        if (getField("SOLD", globalState) !== undefined) {
            sold = getField("SOLD", globalState).value.uint
        }

        if (getField("GIFTED", globalState) !== undefined) {
            let field = getField("GIFTED", globalState).value.bytes;
            gifted = base64ToUTF8String(field);
        }

        return new Product(name, image, description, price, sold, appId, owner, gifted)
    } catch (err) {
        return null;
    }
}
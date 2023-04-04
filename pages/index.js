import { stark, Provider, hash, NetworkName, Account, Contract, json } from "starknet";
import starkwareCrypto from "../starkex-resources/crypto/starkware/crypto/signature/signature";
import abi from "../contracts/contract_abi.json"

import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.scss";
import { useState, useEffect } from "react";

const CONTRACT_ADDRESS = "0x04a5855bdd52e80d7d7fb1e8ab58d2d27824acf60884a5831ae570989b483b12"//"0x072c5c2dedc514a7d05a0d4f64b6caaef987ba7c056693cb0dbf8bc73bc11122";
const SCANNER_URL = "https://www.voyager.online/tx/";
const BETTOR_KEY = BigInt("1760418810258047747319624810079239535625535714501828538519032901506640722029");
const COUNTER_BETTOR_KEY = BigInt("278322248623630296242648006019224416377168424768993359209428903413523070650");
const JUDGE_KEY = BigInt("713135050985816517586543284074128109440152783727087655040412995250074188501");

const GoerliProvider = new Provider({
  sequencer: {
      network: 'SN_GOERLI'
  }
});


const TEMP_ACC = {
  address: "0x0499A19E3c1c87655D3052D627f4CA96F282bafFA21FF3Afe8F167fbba40BfA6",
  key: "1229854529509114180637580673869934976982766236016511634876491324808930874473"
}
const tempGoerliAccount = new Account(GoerliProvider, TEMP_ACC.address, TEMP_ACC.key);
const BetContract = new Contract(abi, CONTRACT_ADDRESS, tempGoerliAccount);


export default function Home() {
  const [provider, setProvider] = useState(GoerliProvider);
  const [account, setAccount] = useState(tempGoerliAccount);
  const [contract, setContract] = useState(BetContract);
  const [balance, setBalance] = useState("0");
  const [amount, setAmount] = useState("");
  const [balanceIncrease, setBalanceIncrease] = useState("");
  const [userId, setUserId] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [keyPair, setKeyPair] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [transactionHash, setTransactionHash] = useState("");
  const [canVote, setCanVote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function getBalance() {
    if(publicKey){
/*       const balance = await provider.callContract({
        contract_address: CONTRACT_ADDRESS,
        entry_point_selector: hash.getSelectorFromName("get_balance"),
        calldata: [BigInt(`0x${publicKey}`).toString()],
      }); */
      const balance = await provider.callContract({
        contractAddress: CONTRACT_ADDRESS,
        entrypoint: 'get_balance',
        calldata: [BigInt(`0x${publicKey}`).toString()],
      })
      setBalance(BigInt(balance.result[0]).toString());
    }
  }

  useEffect(() => {
    // const provider = new Provider({baseUrl: 'https://alpha-mainnet.starknet.io/',  feederGatewayUrl: 'feeder_gateway', gatewayUrl: 'gateway'})
    // setProvider(provider);
  }, []);

  useEffect(() => {
    console.log("Getting Balance...")
    getBalance();
  });

  useEffect(() => {
    async function judgeCheck() {
      if(publicKey) {
        const judge = await provider.getStorageAt(CONTRACT_ADDRESS, JUDGE_KEY);
        setCanVote(judge === `0x${publicKey}`)
      }
    }
    judgeCheck();
  }, [publicKey]);

  useEffect(() => {
    if(error) {
      setTimeout(() => {
        setError("");
      }, 5000)
    }
  }, [error]);
  function handleChangeAmount(e) {
    setAmount(e.target.value);
  }
  function handleChangeIncreaseBalance(e) {
    setBalanceIncrease(e.target.value);
  }
  function handleChangeUserId(e) {
    setUserId(e.target.value);
  }
  function handleOpenTransaction() {
    window.open(`${SCANNER_URL}${transactionHash}`, '_blank');
    setTransactionHash("");
  }
  function handleCloseError() {
    setError("");
  }

  async function handleIncreaseBalance() {
    if(!publicKey) {
      setError("Please connect")
      return;
    }
    if(!balanceIncrease) {
      setError("Please enter the amount")
      return;
    }
    const messageHash = starkwareCrypto.pedersen([balanceIncrease, 0]);
    const signature = starkwareCrypto.sign(keyPair, messageHash);
    var r = "0x" + signature.r.toString(16);
    var s = "0x" + signature.s.toString(16);
    try {
      setLoading(true);
      setTransactionHash("");
/*       const tx = await provider.addTransaction({
        type: "INVOKE_FUNCTION",
        contract_address: CONTRACT_ADDRESS,
        entry_point_selector: getSelectorFromName("increase_balance"),
        calldata: [BigInt(`0x${publicKey}`).toString(), `${balanceIncrease}`],
        signature:[BigInt(r), BigInt(s)],
      }); */
      const tx = contract.increase_balance(`0x${publicKey}`, `${balanceIncrease}`);

      try {
        await provider.waitForTx(tx.transaction_hash);
      } catch (ex) {
        setError("Transaction Failed!")
      }
      setLoading(false)
      setTransactionHash(tx.transaction_hash);
      setBalanceIncrease("")
    } catch (ex) {
      console.log(ex)
    }
  }

  async function handleCreateChallenge() {
    if(!publicKey) {
      setError("Please connect")
      return;
    }
    if(!amount) {
      setError("Please enter the amount")
      return;
    }
    const messageHash = starkwareCrypto.pedersen([amount]);
    const signature = starkwareCrypto.sign(keyPair, messageHash);
    var r = "0x" + signature.r.toString(16);
    var s = "0x" + signature.s.toString(16);
    try {
      setLoading(true);
      setTransactionHash("");
      const tx = await provider.addTransaction({
        type: "INVOKE_FUNCTION",
        contract_address: CONTRACT_ADDRESS,
        entry_point_selector: getSelectorFromName("createBet"),
        calldata: [BigInt(`0x${publicKey}`).toString(), `${amount}`, `12345`],
        signature:[BigInt(r), BigInt(s)],
      });
      try {
        await provider.waitForTx(tx.transaction_hash);
      } catch (ex) {
        setError("Transaction Failed!")
      }
      setLoading(false)
      setTransactionHash(`${tx.transaction_hash}`);
      setAmount("");
    } catch (ex) {
      console.log(ex)
    }
  }

  async function handleJoinChallenge() {
    if(!publicKey) {
      setError("Please connect")
      return;
    }
    try {
      setLoading(true);
      setTransactionHash("");
      const tx = await provider.addTransaction({
        type: "INVOKE_FUNCTION",
        contract_address: CONTRACT_ADDRESS,
        entry_point_selector: getSelectorFromName("joinCounterBettor"),
        calldata: [BigInt(`0x${publicKey}`).toString()],
      });
      try {
        await provider.waitForTx(tx.transaction_hash);
      } catch (ex) {
        setError("Transaction Failed!")
      }
      setLoading(false)
      setTransactionHash(`${tx.transaction_hash}`);
    } catch (ex) {
      console.log(ex)
    }

  }

  async function handleBeJudge() {
    if(!publicKey) {
      setError("Please connect")
      return;
    }
    try {
      setLoading(true);
      setTransactionHash("");
      const tx = await provider.addTransaction({
        type: "INVOKE_FUNCTION",
        contract_address: CONTRACT_ADDRESS,
        entry_point_selector: getSelectorFromName("joinJudge"),
        calldata: [BigInt(`0x${publicKey}`).toString()],
      });
      try {
        await GoerliProvider.waitForTx(tx.transaction_hash);
        setCanVote(true);
      } catch (ex) {
        setError("Transaction Failed!")
      }
      setLoading(false)
      setTransactionHash(`${tx.transaction_hash}`);
    } catch (ex) {
      console.log(ex)
    }
  }

  async function handleVote(choice) {
    if(!publicKey) {
      setError("Please connect")
      return;
    }
    const winnerKey = choice ? BETTOR_KEY : COUNTER_BETTOR_KEY;
    const winner = await provider.getStorageAt(CONTRACT_ADDRESS, winnerKey);
    
    if (!winner || winner === '0x0') {
      setError("Participant didn't join yet")
      return;
    }
    const messageHash = starkwareCrypto.pedersen([winner.substr(2)]);
    const signature = starkwareCrypto.sign(keyPair, messageHash);
    var r = "0x" + signature.r.toString(16);
    var s = "0x" + signature.s.toString(16);
    try {
      setLoading(true);
      setTransactionHash("");
      const tx = await provider.addTransaction({
        type: "INVOKE_FUNCTION",
        contract_address: CONTRACT_ADDRESS,
        entry_point_selector: getSelectorFromName("voteBettor"),
        calldata: [BigInt(`0x${publicKey}`).toString(), BigInt(winner).toString()],
        signature:[BigInt(r), BigInt(s)],
      });      
      try {
        await provider.waitForTx(tx.transaction_hash);
      } catch (ex) {
        setError("Transaction Failed!")
      }
      setLoading(false)
      setTransactionHash(`${tx.transaction_hash}`);
    } catch (ex) {
      console.log(ex)
    }
  }

  function handleSubmitUserID() {
    const keyPair = starkwareCrypto.ec.keyFromPrivate(userId, 'hex');
    const publicKey = starkwareCrypto.ec.keyFromPublic(keyPair.getPublic(true, 'hex'), 'hex').pub.getX().toString(16);
    setKeyPair(keyPair);
    setPublicKey(publicKey);
    setShowModal(false)
  }
  function handleCloseConnect () {
    setShowModal(false);
    setUserId("");
  }
  return (
    <div className={styles.container}>
      <Head>
        <title>IBY</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        {showModal ? (
          <div className={styles.backdrop}>
            <div className={styles.modal}>
              <button className={styles.close} onClick={handleCloseConnect}>
                <Image
                  src="/close.svg"
                  alt="close"
                  width={75}
                  height={75}
                />
              </button>
              <h3>Please enter your User Id</h3>
              <input
                className={styles.formInput}
                type="text"
                placeholder="User ID"
                onChange={handleChangeUserId}
                style={{marginBottom: "15px"}}
                value={userId}
              />
              <button className={styles.btnPrimary} onClick={handleSubmitUserID}>Submit</button>
            </div>
          </div>
        ) : null}
        <div className={styles.card}>
          <div className={styles.header}>
            <Image
              className={styles.logo}
              src="/logo.svg"
              alt="IBY Logo"
              width={75}
              height={75}
            />
            {
              publicKey 
                ? <span className={styles.address} onClick={() => setShowModal(true)}>{`0x${publicKey.substr(0,5)}...${publicKey.substr(publicKey.length - 3)}`}</span>
                : <button className={styles.btnConnect} onClick={() => setShowModal(true)}>Connect</button>
            }
          </div>
        {transactionHash ? (
            <div className={styles.transactionHash} onClick={handleOpenTransaction}>
              Transaction Hash: {transactionHash}
            </div>
        ) : null }
        {error ? (
            <div className={styles.error} onClick={handleCloseError}>
              {error}
            </div>
        ) : null }
        {loading ? <div className={styles.loader}></div> : (
          <div className={styles.controlContainer}>
            <h3>Balance: {balance}</h3>
            <div className={styles.formContainer}>
              <input
                className={styles.formInput}
                placeholder="Amount"
                type="number"
                name="amount"
                value={balanceIncrease}
                onChange={handleChangeIncreaseBalance}
              />
              <button className={styles.btnPrimary} onClick={handleIncreaseBalance}>Increase Balance</button>
            </div>
            <div className={styles.formContainer}>
              <input
                className={styles.formInput}
                placeholder="Amount"
                type="number"
                name="amount"
                value={amount}
                onChange={handleChangeAmount}
              />
              <button className={styles.btnPrimary} onClick={handleCreateChallenge}>Create Challenge</button>
            </div>
            <div className={styles.buttonContainer}>
              <button className={styles.btnPrimary} onClick={handleJoinChallenge}>Join Challenge</button>
            </div>
            <div className={styles.buttonContainer}>
              <button className={styles.btnPrimary} onClick={handleBeJudge}>Be Judge</button>
            </div>
            {canVote ? (
              <div>
                <h3>Vote</h3>
                <div className={styles.formContainer}>
                  <button className={styles.btnPrimaryOutline} onClick={() => handleVote(true)}>
                    Challenger
                  </button>
                  <button className={styles.btnPrimaryOutline} onClick={() => handleVote(false)}>
                    Counter Challenger
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
          <div className={styles.powered}>Powered by IBY</div>
        </div>
      </main>
    </div>
  );
}

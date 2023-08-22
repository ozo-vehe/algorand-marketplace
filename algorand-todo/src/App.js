import React, {useEffect, useState} from "react";
import './App.css';
import MyAlgoConnect from "@randlabs/myalgo-connect";
import {getTodosAction} from "./utils/todo";

const App = function AppWrapper() {

    const [address, setAddress] = useState(null);
    const [products, setProducts] = useState([]);

    const connectWallet = async () => {
        new MyAlgoConnect().connect()
            .then(accounts => {
                const _account = accounts[0];
                setAddress(_account.address);
            }).catch(error => {
            console.log('Could not connect to MyAlgo wallet');
            console.error(error);
        })
    };

    useEffect(() => {
        getTodosAction().then(products => {
            setProducts(products)
        });
    }, []);

    return (
        <>
            {address ? (
                products.forEach((product) => console.log(product))
            ) : (
                <button onClick={connectWallet}>CONNECT WALLET</button>
            )}
        </>
    );
}

export default App;
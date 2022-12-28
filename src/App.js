import './App.css';
import currencies from './currencies.json';
import { useCallback, useState } from 'react';
import Select from 'react-select';
import BigNumber from 'bignumber.js';

async function fetchRates(amount, currencyFrom, currencyTo, fee) {
  try {
    const resp = await fetch(`https://api.benqq.io/v1/rates?amount=${amount}&currencyFrom=${currencyFrom}&currencyTo=${currencyTo}&fee=${fee}`);
    const json = await resp.json();
    const controller = new AbortController();
    const id = setTimeout(() => {
      controller.abort()
      throw new Error('timeout');
    }, 12000);
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal  
    });
    return json.data.data.crdhldBillAmt;
  } catch (e) {
    return fetchRates(amount, currencyFrom, currencyTo, fee);
  }
}

async function calculateCMC(amount) {
  const resp = await fetch(`https://api.coinbase.com/v2/exchange-rates?currency=USDC`);
  const json = await resp.json();
  const GBPRate = new BigNumber('1').div(new BigNumber(String(json.data.rates.GBP)));
  return new BigNumber(amount).times(GBPRate).toNumber();
}

const mappedCurrencies = currencies.map(currency => ({ value: currency.cc, label: currency.name }));
const plans = {
  free: {
    name: 'Free (3%, 0.5$ FX Fee)',
    fee: 3,
    fx: 0.5
  },
  camper: {
    name: 'Happy Camper (2.5%, 0.4$ FX Fee)',
    fee: 2.5,
    fx: 0.4
  },
  nomad: {
    name: 'Digital Nomad (2%, 0.25$ FX Fee)',
    fee: 2,
    fx: 0.25
  },
  highflyer: {
    name: 'High Flyer (1.5%, 0.1$ FX Fee)',
    fee: 1.5,
    fx: 0.1
  }
};
const mappedPlans = Object.entries(plans).map(([key, plan]) => ({ value: key, label: plan.name }));

function App() {
  const [currencyOp, setCurrencyOp] = useState('USD');
  const [plan, setPlan] = useState('free');
  const [value, setValue] = useState();
  const [loading, setLoading] = useState(false);
  const [calculatedValue, setCalculatedValue] = useState(0);

  const handleCalculate = useCallback(async () => {
    setLoading(true);
    const costInGBP = await fetchRates(parseFloat(value).toFixed(2), currencyOp, 'GBP', plans[plan].fee);
    const costInUSD = await calculateCMC(parseFloat(costInGBP));
    setCalculatedValue(costInUSD);
    setLoading(false);
  }, [currencyOp, plan, value]);

  return (
    <div className="App">
      <div className='input-with-label'>
        <label>Your plan</label>
        <Select 
          defaultValue={mappedPlans.find(currency => currency.value === 'free')} 
          onChange={(value) => setPlan(value.value)} 
          options={mappedPlans} 
        />
      </div>
      <div className='input-with-label'>
        <label>Transaction currency</label>
        <Select 
          defaultValue={mappedCurrencies.find(currency => currency.value === 'USD')} 
          onChange={(value) => setCurrencyOp(value.value)} 
          options={mappedCurrencies} 
        />
      </div>
      <div className='input-with-label'>
        <label>Transaction amount</label>
        <input value={value} onChange={(e) => setValue(e.currentTarget.value)} />
      </div>
      <div className='input-with-label'>
        <button disabled={loading} onClick={handleCalculate}>Calculate!</button>
      </div>
      {calculatedValue ? <div className='input-with-label'>
        <p>{(calculatedValue + plans[plan].fx).toFixed(2)}$</p>
      </div> : null}
      <div className='input-with-label'>
        <p style={{ width: "300px" }}>DISCLAIMER: exchange rates are approximate, but as close as possible to real ones. Service is not affiliated with maps.me</p>
      </div>
      <div className='input-with-label'>
        <p style={{ width: "150px" }}>Donations:</p>
        <img src="https://donations.fra1.digitaloceanspaces.com/qr-sol.png" width={150} height={150} />
      </div>
      <p style={{ width: "500px" }}>F4aaRWB28DCH7yJp7TFZmufor3svaC6ih9L9tUqeyyEJ</p>
    </div>
  );
}

export default App;

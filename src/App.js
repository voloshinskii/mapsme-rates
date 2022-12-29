import './App.css';
import currencies from './currencies.json';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import Select from 'react-select';
import BigNumber from 'bignumber.js';
import { useSelectedCurrency } from './hooks/useSelectedCurrency';
import { useSelectedPlan } from './hooks/useSelectedPlan';

async function fetchRates(amount, currencyFrom, currencyTo, fee) {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => {
      controller.abort()
      throw new Error('timeout');
    }, 12000);
    const resp = await fetch(`https://api.benqq.io/v1/rates?amount=${amount}&currencyFrom=${currencyFrom}&currencyTo=${currencyTo}&fee=${fee}`, { signal: controller.signal });
    const json = await resp.json();
    clearTimeout(id);
    return json.data.data.crdhldBillAmt;
  } catch (e) {
    return fetchRates(amount, currencyFrom, currencyTo, fee);
  }
}

async function calculateCMC(amount, fee) {
  const resp = await fetch(`https://api.benqq.io/v1/rates/usdc-gbp`);
  const json = await resp.json();
  const GBPRate = new BigNumber('1').div(new BigNumber(json.data));
  return new BigNumber(amount).times(GBPRate).times(fee).toNumber();
}

const mappedCurrencies = currencies.map(currency => ({ value: currency.cc, label: currency.name }));
const plans = {
  free: {
    name: 'Free (3%, 0.5$ FX Fee)',
    fee: 1.03,
    atmWithdrawalFee: 1.06,
    fx: 0.5
  },
  camper: {
    name: 'Happy Camper (2.5%, 0.4$ FX Fee)',
    fee: 1.025,
    atmWithdrawalFee: 1.05,
    fx: 0.4
  },
  nomad: {
    name: 'Digital Nomad (2%, 0.25$ FX Fee)',
    fee: 1.02,
    atmWithdrawalFee: 1.04,
    fx: 0.25
  },
  highflyer: {
    name: 'High Flyer (1.5%, 0.1$ FX Fee)',
    fee: 1.015,
    atmWithdrawalFee: 1.03,
    fx: 0.1
  }
};
const mappedPlans = Object.entries(plans).map(([key, plan]) => ({ value: key, label: plan.name }));

function App() {
  const [currencyOp, setCurrencyOp] = useSelectedCurrency();
  const [plan, setPlan] = useSelectedPlan();
  const [value, setValue] = useState();
  const [loading, setLoading] = useState(false);
  const [calculatedValue, setCalculatedValue] = useState(0);
  const [withFxFee, setWithFxFee] = useState(true);
  const [isAtmWithdrawal, setIsAtmWithdrawal] = useState(false);

  const handleCalculate = useCallback(async () => {
    setLoading(true);
    const costInGBP = await fetchRates(parseFloat(value.replace(',', '.')).toFixed(2), currencyOp, 'GBP', 0);
    const costInUSD = await calculateCMC(parseFloat(costInGBP), isAtmWithdrawal ? plans[plan].atmWithdrawalFee : plans[plan].fee);
    setCalculatedValue(costInUSD);
    setLoading(false);
  }, [currencyOp, plan, value, isAtmWithdrawal]);

  return (
    <div className="App">
      <div className='input-with-label'>
        <label>Your plan</label>
        <Select 
          defaultValue={mappedPlans.find(mappedPlan => mappedPlan.value === plan)} 
          onChange={(value) => setPlan(value.value)} 
          options={mappedPlans} 
        />
      </div>
      <div className='input-with-label'>
        <label>Transaction currency</label>
        <Select 
          defaultValue={mappedCurrencies.find(currency => currency.value === currencyOp)} 
          onChange={(value) => setCurrencyOp(value.value)} 
          options={mappedCurrencies} 
        />
      </div>
      <div className='input-with-label'>
        <label>Transaction amount</label>
        <input value={value} onChange={(e) => setValue(e.currentTarget.value)} />
      </div>
      <div className='input-with-label'>
        <input type="checkbox" id="fxfee" name="fxfee" checked={withFxFee} onChange={() => setWithFxFee(!withFxFee)} />
        <label for="fxfee">FX Fee</label>
      </div>
      <div className='input-with-label'>
        <input type="checkbox" id="atmwithdrawal" name="atmwithdrawal" checked={isAtmWithdrawal} onChange={() => setIsAtmWithdrawal(!isAtmWithdrawal)} />
        <label for="atmwithdrawal">ATM Withdrawal</label>
      </div>
      <div className='input-with-label'>
        <button disabled={loading} onClick={handleCalculate}>Calculate!</button>
      </div>
      {calculatedValue ? <div className='input-with-label'>
        <p>{(calculatedValue + (withFxFee ? plans[plan].fx : 0)).toFixed(2)}$</p>
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

import { useEffect, useLayoutEffect, useState } from "react";

export function useSelectedCurrency() {
    const [currencyOp, setCurrencyOp] = useState(localStorage.getItem('selectedCurrency') || 'USD');

    useEffect(() => {
        localStorage.setItem('selectedCurrency', currencyOp);
    }, [currencyOp]);

    return [currencyOp, setCurrencyOp];
}
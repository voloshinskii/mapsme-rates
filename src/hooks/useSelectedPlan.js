import { useEffect, useLayoutEffect, useState } from "react";

export function useSelectedPlan() {
    const [plan, setPlan] = useState(localStorage.getItem('selectedPlan') || 'free');

    useEffect(() => {
        localStorage.setItem('selectedPlan', plan);
    }, [plan]);

    return [plan, setPlan];
}
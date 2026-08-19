'use client';

import React, { useState, useMemo, useEffect } from 'react';

type ConnectionKeys = 'shopify' | 'plaid' | 'ads' | 'analytics';

interface ConnectionsState {
  shopify: boolean;
  plaid: boolean;
  ads: boolean;
  analytics: boolean;
}

// Deterministic Pseudo-Random Number Generator (LCG)
function createPRNG(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export default function SwiftAdsOnboarding() {
  const [step, setStep] = useState<number>(1);
  
  // Step 1 State
  const [hasHistory, setHasHistory] = useState<boolean>(true);
  const [hasMinMRR, setHasMinMRR] = useState<boolean>(true);

  // Step 2 State
  const [connections, setConnections] = useState<ConnectionsState>({
    shopify: false,
    plaid: false,
    ads: false,
    analytics: false,
  });
  const [consent, setConsent] = useState<boolean>(false);

  // Financial Constants: Bank of Canada Prime Rate
  const PRIME_RATE = 5.95; 

  // -------------------------------------------------------------
  // SESSION PERSISTENCE ENGINE (Generated ONCE per session)
  // -------------------------------------------------------------
  // 1. Lock in a random session seed when the page loads
  const [sessionSeed] = useState<number>(() => Math.floor(Math.random() * 1000000) + 1);

  // 2. Generate and store session-wide underwriting metrics
  const sessionMetrics = useMemo(() => {
    const rng = createPRNG(sessionSeed);

    // Weighted Credit Score Distribution
    // 800–900: 41.1% | 750–799: 18.6% | 650–749: 25.4% | 550–649: 10.4% | 300–549: 4.5%
    const scoreRoll = rng();
    let generatedScore = 720;
    if (scoreRoll < 0.411) {
      generatedScore = Math.floor(rng() * (900 - 800 + 1) + 800);
    } else if (scoreRoll < 0.597) {
      generatedScore = Math.floor(rng() * (799 - 750 + 1) + 750);
    } else if (scoreRoll < 0.851) {
      generatedScore = Math.floor(rng() * (749 - 650 + 1) + 650);
    } else if (scoreRoll < 0.955) {
      generatedScore = Math.floor(rng() * (649 - 550 + 1) + 550);
    } else {
      generatedScore = Math.floor(rng() * (549 - 300 + 1) + 300);
    }

    // Determine Margin & Max Repayment Term based on Credit Score Tiers
    let creditMargin = 3.00;
    let allowedMaxTerm = 24;

    if (generatedScore >= 800) {
      creditMargin = 3.00; // Prime + 3.00%
      allowedMaxTerm = 24;
    } else if (generatedScore >= 750) {
      creditMargin = 4.50; // Prime + 4.50%
      allowedMaxTerm = 24;
    } else if (generatedScore >= 650) {
      creditMargin = 6.00; // Prime + 6.00%
      allowedMaxTerm = 24;
    } else if (generatedScore >= 550) {
      creditMargin = 8.50; // Prime + 8.50%
      allowedMaxTerm = 12; // Capped at 12 months for < 650
    } else {
      creditMargin = 12.00; // Prime + 12.00% (Up to 17.95% APR < 19%)
      allowedMaxTerm = 6;   // Capped at 6 months for < 550
    }

    const calculatedAPR = Number((PRIME_RATE + creditMargin).toFixed(2));
    const monthlyMRR = Math.floor(rng() * (45000 - 14000 + 1) + 14000); // $14k - $45k
    const roas = Number((rng() * (4.6 - 2.8) + 2.8).toFixed(1));         // 2.8x - 4.6x
    const trafficGrowthPercent = Math.floor(rng() * (32 - 12 + 1) + 12); // +12% - +32%
    const netMarginPercent = Math.floor(rng() * (35 - 20 + 1) + 20);     // 20% - 35%

    return {
      creditScore: generatedScore,
      appliedAPR: calculatedAPR,
      allowedMaxTerm,
      monthlyMRR,
      roas,
      trafficGrowthPercent,
      netMarginPercent,
    };
  }, [sessionSeed]);

  // -------------------------------------------------------------
  // DYNAMIC LIMIT SCALING (Preserves base metrics)
  // -------------------------------------------------------------
  let dataMultiplier = 1.0;
  if (connections.ads) dataMultiplier += 0.25;
  if (connections.analytics) dataMultiplier += 0.15;

  const mrrCap = sessionMetrics.monthlyMRR * 3;
  const rawCap = Math.round((sessionMetrics.monthlyMRR * 1.2 * dataMultiplier) / 500) * 500;
  const maxLoanCap = Math.min(rawCap, mrrCap, 50000);

  // Step 3 User Inputs
  const [loanAmount, setLoanAmount] = useState<number>(15000);
  const [paybackMonths, setPaybackMonths] = useState<number>(12);
  const [email, setEmail] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  // Calculate Optimal Payback Horizon
  const calculateRecommendedTerm = (
    amount: number,
    mrr: number,
    margin: number,
    growth: number
  ): number => {
    const effectiveGrowth = connections.analytics ? growth : 0;
    const projectedNetProfit = mrr * (margin / 100) * (1 + effectiveGrowth / 100);
    const maxSafeMonthlyPayment = projectedNetProfit / 1.5;

    if (maxSafeMonthlyPayment <= 0) return sessionMetrics.allowedMaxTerm;

    for (let months = 1; months <= sessionMetrics.allowedMaxTerm; months++) {
      const totalInterest = amount * (sessionMetrics.appliedAPR / 100) * (months / 12);
      const estPayment = (amount + totalInterest) / months;
      if (estPayment <= maxSafeMonthlyPayment) {
        return months;
      }
    }
    return sessionMetrics.allowedMaxTerm;
  };

  const recommendedTerm = calculateRecommendedTerm(
    loanAmount,
    sessionMetrics.monthlyMRR,
    sessionMetrics.netMarginPercent,
    sessionMetrics.trafficGrowthPercent
  );

  const getMarkerPercent = (term: number) => {
    return ((term - 1) / (sessionMetrics.allowedMaxTerm - 1)) * 100;
  };

  const recommendedPercent = getMarkerPercent(recommendedTerm);

  // Sync initial loan slider and recommended term when entering Step 3
  useEffect(() => {
    if (step === 3) {
      if (loanAmount > maxLoanCap) {
        setLoanAmount(maxLoanCap);
      }
      if (paybackMonths > sessionMetrics.allowedMaxTerm) {
        setPaybackMonths(sessionMetrics.allowedMaxTerm);
      }
    }
  }, [step, maxLoanCap, sessionMetrics.allowedMaxTerm]);

  // Payment Breakdown Calculations
  const calculateMonthlyPayment = (principal: number, months: number): number => {
    const totalInterest = principal * (sessionMetrics.appliedAPR / 100) * (months / 12);
    const totalRepayable = principal + totalInterest;
    return Math.round(totalRepayable / months);
  };

  const monthlyPayment = calculateMonthlyPayment(loanAmount, paybackMonths);
  const totalCostOfBorrowing = Math.round(loanAmount * (sessionMetrics.appliedAPR / 100) * (paybackMonths / 12));

  const toggleConnection = (key: ConnectionKeys) => {
    setConnections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-[#F6F7EB] text-[#30292F] font-sans antialiased">
      {/* Header Bar */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between shadow-sm sticky top-0 z-30">
        <div className="flex items-center space-x-2">
          <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#1E67B1]">
            Swift<span className="text-[#F68C1F]">Ads</span>
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="bg-[#F6F7EB] text-[#30292F] text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-gray-300 flex items-center gap-1.5">
            🇨🇦 Operating in Canada
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        
        {/* Step Indicator */}
        <div className="mb-6 sm:mb-10 flex items-center justify-between max-w-xs sm:max-w-sm mx-auto text-xs sm:text-sm font-bold text-gray-500 px-2">
          <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-[#1E67B1]' : ''}`}>
            <span className={`w-6 h-6 sm:w-7 sm:h-7 text-xs rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-[#1E67B1] text-white' : 'bg-gray-200'}`}>1</span>
            <span>Eligibility</span>
          </div>
          <div className="h-0.5 w-6 sm:w-10 bg-gray-300"></div>
          <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-[#1E67B1]' : ''}`}>
            <span className={`w-6 h-6 sm:w-7 sm:h-7 text-xs rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-[#1E67B1] text-white' : 'bg-gray-200'}`}>2</span>
            <span>Connect Data</span>
          </div>
          <div className="h-0.5 w-6 sm:w-10 bg-gray-300"></div>
          <div className={`flex items-center gap-1.5 ${step >= 3 ? 'text-[#1E67B1]' : ''}`}>
            <span className={`w-6 h-6 sm:w-7 sm:h-7 text-xs rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-[#1E67B1] text-white' : 'bg-gray-200'}`}>3</span>
            <span>Pre-Approval</span>
          </div>
        </div>

        {/* SCREEN 1: ELIGIBILITY CHECK */}
        {step === 1 && (
          <div className="bg-white rounded-2xl p-5 sm:p-8 md:p-10 shadow-md border border-gray-100 max-w-2xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E67B1] mb-3 text-center tracking-tight">
              Get Capital to Grow Quickly
            </h1>
            <p className="text-center text-gray-600 mb-6 sm:mb-8 text-xs sm:text-sm leading-relaxed max-w-lg mx-auto">
              Get approved for growth capital of up to $5,000 – $50,000 in under 2 minutes. Connect your growth metrics and revenue sources to see how much you can qualify for.
            </p>

            <div className="space-y-4 sm:space-y-6 bg-[#F6F7EB] p-4 sm:p-6 rounded-xl border border-gray-200 mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <p className="font-semibold text-sm text-[#30292F]">Operating History</p>
                  <p className="text-xs text-gray-500 mt-0.5">Has your business been active for 6+ months?</p>
                </div>
                <div className="flex gap-2 self-start sm:self-auto shrink-0">
                  <button
                    onClick={() => setHasHistory(true)}
                    className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition min-w-[60px] ${
                      hasHistory ? 'bg-[#1E67B1] text-white shadow-sm' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setHasHistory(false)}
                    className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition min-w-[60px] ${
                      !hasHistory ? 'bg-[#1E67B1] text-white shadow-sm' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-200/80 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <p className="font-semibold text-sm text-[#30292F]">Monthly Revenue (MRR)</p>
                  <p className="text-xs text-gray-500 mt-0.5">Do you generate at least $5,000 / month in revenue?</p>
                </div>
                <div className="flex gap-2 self-start sm:self-auto shrink-0">
                  <button
                    onClick={() => setHasMinMRR(true)}
                    className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition min-w-[60px] ${
                      hasMinMRR ? 'bg-[#1E67B1] text-white shadow-sm' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setHasMinMRR(false)}
                    className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition min-w-[60px] ${
                      !hasMinMRR ? 'bg-[#1E67B1] text-white shadow-sm' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>

            {(!hasHistory || !hasMinMRR) ? (
              <div className="p-3.5 bg-red-50 text-red-700 rounded-xl text-xs sm:text-sm mb-6 text-center border border-red-200 font-medium">
                Minimum requirements: 6+ months operating history and $5,000 monthly revenue.
              </div>
            ) : null}

            <p className="text-center text-xs text-gray-500 mb-5 font-medium leading-relaxed">
              Connect the required accounts and data points to see how much capital you're qualified for.
            </p>

            <button
              disabled={!hasHistory || !hasMinMRR}
              onClick={() => setStep(2)}
              className="w-full bg-[#F68C1F] hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3.5 px-6 rounded-xl transition duration-200 shadow-md text-center text-sm sm:text-base cursor-pointer"
            >
              Connect Data Points
            </button>
          </div>
        )}

        {/* SCREEN 2: DATA INTEGRATIONS VAULT */}
        {step === 2 && (
          <div className="bg-white rounded-2xl p-5 sm:p-8 md:p-10 shadow-md border border-gray-100 max-w-2xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-[#1E67B1] mb-2 text-center tracking-tight">
              Connect Channels to See How Much Capital You can Qualify for
            </h2>
            <p className="text-center text-xs sm:text-sm text-gray-500 mb-6 leading-relaxed max-w-md mx-auto">
              Connect store sales, financial statements, and ad accounts to see how much you're eligible to borrow up to.
            </p>

            <div className="bg-[#1E67B1] text-white p-3.5 sm:p-4 rounded-xl text-xs sm:text-sm flex items-center gap-3 mb-6 shadow-sm">
              <span className="text-xl sm:text-2xl shrink-0">🔒</span>
              <div>
                <p className="font-semibold text-xs sm:text-sm">Data Secured</p>
                <p className="opacity-90 text-[11px] sm:text-xs mt-0.5">Data is encrypted and stored safely.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              
              {/* Card 1: Shopify */}
              <div className="bg-[#F6F7EB] p-4 sm:p-5 rounded-xl border border-gray-200 flex flex-col justify-between h-full">
                <div>
                  <span className="font-bold text-xs sm:text-sm block text-[#30292F]">Connect a Revenue Source</span>
                  <span className="inline-block text-[10px] bg-blue-100 text-[#1E67B1] font-bold px-2 py-0.5 rounded mt-1.5 mb-2.5">
                    Required
                  </span>
                  <p className="text-xs text-gray-500 mb-4 leading-relaxed">Connect an e-commerce platform so we can evaluate your monthly sales history.</p>
                </div>
                <button
                  onClick={() => toggleConnection('shopify')}
                  className={`w-full text-xs font-bold py-2.5 px-3 rounded-lg transition shadow-sm ${
                    connections.shopify ? 'bg-green-600 text-white' : 'bg-[#1E67B1] text-white hover:bg-blue-800'
                  }`}
                >
                  {connections.shopify ? '✓ e-commerce Platform Connected' : 'Connect e-commerce Platform'}
                </button>
              </div>

              {/* Card 2: Bank Data */}
              <div className="bg-[#F6F7EB] p-4 sm:p-5 rounded-xl border border-gray-200 flex flex-col justify-between h-full">
                <div>
                  <span className="font-bold text-xs sm:text-sm block text-[#30292F]">Connect your Banking Data</span>
                  <span className="inline-block text-[10px] bg-blue-100 text-[#1E67B1] font-bold px-2 py-0.5 rounded mt-1.5 mb-2.5">
                    Required
                  </span>
                  <p className="text-xs text-gray-500 mb-4 leading-relaxed">Verifies cash flow via your financial institutions.</p>
                </div>
                <button
                  onClick={() => toggleConnection('plaid')}
                  className={`w-full text-xs font-bold py-2.5 px-3 rounded-lg transition shadow-sm ${
                    connections.plaid ? 'bg-green-600 text-white' : 'bg-[#1E67B1] text-white hover:bg-blue-800'
                  }`}
                >
                  {connections.plaid ? '✓ Bank Connected' : 'Connect Bank Account'}
                </button>
              </div>

              {/* Card 3: Ads Accounts */}
              <div className="bg-[#F6F7EB] p-4 sm:p-5 rounded-xl border border-gray-200 flex flex-col justify-between h-full">
                <div>
                  <span className="font-bold text-xs sm:text-sm block text-[#30292F]">Connect Your Ads Account(s)</span>
                  <span className="inline-block text-[10px] bg-orange-100 text-[#F68C1F] font-bold px-2 py-0.5 rounded mt-1.5 mb-2.5">
                    Access more capital by connecting your account
                  </span>
                  <p className="text-xs text-gray-500 mb-4 leading-relaxed">This data point will help us evaluate and predict customer demand.</p>
                </div>
                <button
                  onClick={() => toggleConnection('ads')}
                  className={`w-full text-xs font-bold py-2.5 px-3 rounded-lg border transition shadow-sm ${
                    connections.ads ? 'bg-green-600 text-white border-green-600' : 'border-[#F68C1F] text-[#F68C1F] hover:bg-orange-50 bg-white'
                  }`}
                >
                  {connections.ads ? '✓ Ad Accounts Connected' : 'Connect Ad Accounts'}
                </button>
              </div>

              {/* Card 4: Web Analytics */}
              <div className="bg-[#F6F7EB] p-4 sm:p-5 rounded-xl border border-gray-200 flex flex-col justify-between h-full">
                <div>
                  <span className="font-bold text-sm block text-[#30292F]">Connect Your Web Analytics</span>
                  <span className="inline-block text-[10px] bg-orange-100 text-[#F68C1F] font-bold px-2 py-0.5 rounded mt-1.5 mb-2.5">
                    Access more capital by connecting your account
                  </span>
                  <p className="text-xs text-gray-500 mb-4 leading-relaxed">This data point will help us evaluate your business' growth potential.</p>
                </div>
                <button
                  onClick={() => toggleConnection('analytics')}
                  className={`w-full text-xs font-bold py-2.5 px-3 rounded-lg border transition shadow-sm ${
                    connections.analytics ? 'bg-green-600 text-white border-green-600' : 'border-[#F68C1F] text-[#F68C1F] hover:bg-orange-50 bg-white'
                  }`}
                >
                  {connections.analytics ? '✓ Web Analytics Connected' : 'Connect Web Analytics'}
                </button>
              </div>

            </div>

            <div className="flex items-start gap-3 bg-[#F6F7EB] p-4 rounded-xl mb-6 border border-gray-200">
              <input
                type="checkbox"
                id="consent"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#1E67B1] focus:ring-[#1E67B1] shrink-0 cursor-pointer"
              />
              <label htmlFor="consent" className="text-xs text-gray-600 leading-relaxed cursor-pointer select-none">
                I agree to the terms and conditions.
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm transition"
              >
                Back
              </button>
              <button
                disabled={!connections.shopify || !connections.plaid || !consent}
                onClick={() => setStep(3)}
                className="w-2/3 bg-[#F68C1F] hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 px-4 sm:px-6 rounded-xl transition duration-200 shadow-md text-xs sm:text-sm"
              >
                See How Much You Qualify For
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 3: PRE-APPROVAL DASHBOARD */}
        {step === 3 && (
          <div className="bg-white rounded-2xl p-5 sm:p-8 md:p-10 shadow-md border border-gray-100 max-w-3xl mx-auto">
            <div className="bg-[#1E67B1] text-white p-6 sm:p-8 rounded-2xl text-center mb-6 sm:mb-8 shadow-lg relative overflow-hidden">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-blue-800/60 px-3 py-1 rounded-full border border-blue-400/30 inline-block">
                Capital Eligibility
              </span>
              <p className="text-xs sm:text-sm font-medium text-blue-100 mt-3">You're Eligible for Up To</p>
              <h2 className="text-4xl sm:text-5xl font-black mt-1 mb-3 text-white tracking-tight">
                ${maxLoanCap.toLocaleString()}
              </h2>
              <span className="inline-block bg-[#F68C1F] text-white font-bold text-xs px-3.5 py-1.5 rounded-full shadow-sm">
                Interest Rate: {sessionMetrics.appliedAPR.toFixed(2)}% APR
              </span>
            </div>

            {/* Dynamic Underwriting Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
              
              {/* Card 1: Monthly MRR */}
              <div className="bg-[#F6F7EB] p-3.5 sm:p-4 rounded-xl border border-gray-200 flex flex-col justify-between">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Monthly MRR</p>
                <p className="text-base sm:text-lg font-extrabold text-[#30292F] mt-1">${sessionMetrics.monthlyMRR.toLocaleString()}</p>
              </div>

              {/* Card 2: ROAS Performance OR Direct Connect Option */}
              {connections.ads ? (
                <div className="bg-[#F6F7EB] p-3.5 sm:p-4 rounded-xl border border-gray-200 transition-all duration-300 flex flex-col justify-between">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">ROAS Performance</p>
                  <p className="text-base sm:text-lg font-extrabold text-[#30292F] mt-1">{sessionMetrics.roas}x</p>
                </div>
              ) : (
                <div 
                  onClick={() => toggleConnection('ads')}
                  className="bg-orange-50 border border-dashed border-[#F68C1F] p-3.5 sm:p-4 rounded-xl cursor-pointer hover:bg-orange-100 transition flex flex-col justify-between"
                >
                  <p className="text-[10px] text-[#F68C1F] font-bold uppercase tracking-wider">ROAS Unverified</p>
                  <p className="text-xs font-bold text-[#30292F] underline mt-1">+ Connect Ad Accounts</p>
                </div>
              )}

              {/* Card 3: Traffic Trajectory OR Direct Connect Option */}
              {connections.analytics ? (
                <div className="bg-[#F6F7EB] p-3.5 sm:p-4 rounded-xl border border-gray-200 transition-all duration-300 flex flex-col justify-between">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Traffic Trajectory</p>
                  <p className="text-base sm:text-lg font-extrabold text-[#30292F] mt-1">+{sessionMetrics.trafficGrowthPercent}% growth</p>
                </div>
              ) : (
                <div 
                  onClick={() => toggleConnection('analytics')}
                  className="bg-blue-50 border border-dashed border-[#1E67B1] p-3.5 sm:p-4 rounded-xl cursor-pointer hover:bg-blue-100 transition flex flex-col justify-between"
                >
                  <p className="text-[10px] text-[#1E67B1] font-bold uppercase tracking-wider">Traffic Unverified</p>
                  <p className="text-xs font-bold text-[#30292F] underline mt-1">+ Connect Analytics Platform</p>
                </div>
              )}

              {/* Card 4: Interest Rate */}
              <div className="bg-[#F6F7EB] p-3.5 sm:p-4 rounded-xl border border-gray-200 flex flex-col justify-between">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Interest Rate</p>
                <p className="text-base sm:text-lg font-extrabold text-[#1E67B1] mt-1">{sessionMetrics.appliedAPR.toFixed(2)}%</p>
              </div>

            </div>

            {/* Interactive Calculator Section */}
            <div className="bg-[#F6F7EB] p-4 sm:p-6 rounded-xl border border-gray-200 mb-6 sm:mb-8 space-y-5 sm:space-y-6">
              
              {/* Slider 1: Loan Amount */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-1 sm:gap-0">
                  <label className="text-xs sm:text-sm font-bold text-[#30292F]">1. Choose the amount of capital:</label>
                  <span className="text-base sm:text-lg font-black text-[#1E67B1]">${loanAmount.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max={maxLoanCap}
                  step="500"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="w-full accent-[#F68C1F] cursor-pointer"
                />
                {!connections.ads || !connections.analytics ? (
                  <p className="text-[11px] text-[#30292F] mt-2 font-semibold leading-relaxed">
                    💡 Tip: Click the unverified cards above to connect your Ad Accounts and/or Analytics to unlock more capital and favourable terms.
                  </p>
                ) : null}
              </div>

              {/* Slider 2: Loan Term (Months) */}
              <div className="border-t border-gray-300/80 pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-1 sm:gap-0">
                  <label className="text-xs sm:text-sm font-bold text-[#30292F]">2. Choose how much time you need to repay the capital (months):</label>
                  <span className="text-sm sm:text-base font-bold text-[#30292F]">{paybackMonths} Months</span>
                </div>

                {/* Relative Track Wrapper for Pointer Speech Bubble & Marker */}
                <div className="relative pt-7 pb-3">
                  
                  {/* Floating Speech Bubble Tooltip when slider is on recommended term */}
                  {paybackMonths === recommendedTerm && (
                    <div 
                      className="absolute top-0 transform -translate-x-1/2 z-20 transition-all duration-200"
                      style={{ left: `${recommendedPercent}%` }}
                    >
                      <div className="relative bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md shadow-md whitespace-nowrap">
                        ★ Optimal Cash Flow ({recommendedTerm} Mo)
                        {/* Downward Pointer Arrow */}
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-green-600 rotate-45"></div>
                      </div>
                    </div>
                  )}

                  {/* Range Input Slider */}
                  <input
                    type="range"
                    min="1"
                    max={sessionMetrics.allowedMaxTerm}
                    step="1"
                    value={paybackMonths}
                    onChange={(e) => setPaybackMonths(Number(e.target.value))}
                    className="w-full accent-[#1E67B1] cursor-pointer relative z-10"
                  />

                  {/* Permanent Target Pin Indicator on Slider Track */}
                  <div 
                    className="absolute bottom-1 transform -translate-x-1/2 flex flex-col items-center pointer-events-none z-0"
                    style={{ left: `${recommendedPercent}%` }}
                  >
                    <span className="text-[10px] text-green-700 font-extrabold leading-none">▲</span>
                    <span className="text-[9px] text-green-700 font-bold whitespace-nowrap">Optimal</span>
                  </div>

                </div>

                {/* Visual Recommendation Indicator Scale */}
                <div className="flex justify-between text-[10px] sm:text-[11px] text-gray-500 mt-1 px-1">
                  <span>1 Mo</span>
                  {sessionMetrics.allowedMaxTerm >= 12 && <span>6 Mo</span>}
                  {sessionMetrics.allowedMaxTerm >= 12 && <span>12 Mo</span>}
                  {sessionMetrics.allowedMaxTerm === 24 && <span>18 Mo</span>}
                  <span>{sessionMetrics.allowedMaxTerm} Mo Max</span>
                </div>
              </div>

              {/* Repayment Breakdown Output */}
              <div className="bg-white p-4 rounded-lg border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
                <div>
                  <p className="text-[10px] sm:text-xs text-gray-500 font-semibold uppercase tracking-wider">Estimated Monthly Payment</p>
                  <div className="flex flex-col sm:flex-row items-start sm:items-baseline sm:gap-1.5 mt-0.5">
                    <p className="text-xl sm:text-2xl font-black text-[#1E67B1]">
                      ${monthlyPayment.toLocaleString()}
                    </p>
                    <span className="text-xs font-semibold text-gray-500">/ month</span>
                  </div>
                </div>
                <div className="text-left md:text-right border-t md:border-t-0 md:border-l border-gray-200 pt-3 md:pt-0 md:pl-5 w-full md:w-auto">
                  <p className="text-[11px] sm:text-xs text-gray-500">Interest Cost ({sessionMetrics.appliedAPR.toFixed(2)}% APR):</p>
                  <p className="text-xs sm:text-sm font-bold text-gray-700 mt-0.5">+${totalCostOfBorrowing.toLocaleString()}</p>
                </div>
              </div>

            </div>

            {/* HIGH-VISIBILITY FORM BLOCK */}
            {!submitted ? (
              <div className="bg-[#30292F] text-white p-5 sm:p-6 rounded-xl shadow-md border border-gray-700">
                <h3 className="font-bold text-sm sm:text-base mb-1">Lock In Your Terms</h3>
                <p className="text-xs text-gray-300 mb-4 leading-relaxed">
                  Register your account to lock in these terms. Funds are disbursed in as little as 48 hrs.
                </p>
                <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="email"
                    required
                    placeholder="Enter business email (e.g. founder@brand.ca)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm bg-white text-gray-900 border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F68C1F] shadow-inner font-medium"
                  />
                  <button
                    type="submit"
                    className="bg-[#F68C1F] hover:bg-orange-600 text-white font-bold px-6 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm transition duration-200 shadow-md whitespace-nowrap cursor-pointer"
                  >
                    Register Now
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 text-green-800 p-5 sm:p-6 rounded-xl text-center shadow-sm">
                <p className="font-bold text-base sm:text-lg mb-1">🎉 Pre-Approval Reserved!</p>
                <p className="text-xs sm:text-sm leading-relaxed">
                  We saved your offer of <strong>${loanAmount.toLocaleString()}</strong> over <strong>{paybackMonths} months</strong> (${monthlyPayment.toLocaleString()}/mo) for <strong>{email}</strong>.
                </p>
              </div>
            )}

            <button
              onClick={() => {
                setStep(2);
                setSubmitted(false);
              }}
              className="w-full mt-4 text-xs text-gray-400 hover:text-gray-600 font-semibold py-2 transition text-center"
            >
              ← Modify Connected Data Sources
            </button>

          </div>
        )}

      </main>
    </div>
  );
}
'use client';

import React, { useState, useEffect } from 'react';

type ConnectionKeys = 'shopify' | 'plaid' | 'ads' | 'analytics';

interface ConnectionsState {
  shopify: boolean;
  plaid: boolean;
  ads: boolean;
  analytics: boolean;
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

  // Dynamic Underwriting Metrics (Simulated Live Data State)
  const [monthlyMRR, setMonthlyMRR] = useState<number>(18000);
  const [roas, setRoas] = useState<number>(3.4);
  const [trafficGrowthPercent, setTrafficGrowthPercent] = useState<number>(18);
  const [netMarginPercent, setNetMarginPercent] = useState<number>(25);

  // Step 3 State: Loan & Terms
  const [loanAmount, setLoanAmount] = useState<number>(15000);
  const [paybackMonths, setPaybackMonths] = useState<number>(12);
  const [email, setEmail] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  // Financial Constants: Bank of Canada Prime Rate + 3%
  const PRIME_RATE = 5.95; 
  const MARGIN = 3.00;     
  const APPLIED_APR = PRIME_RATE + MARGIN; // Total APR = 8.95%

  // -------------------------------------------------------------
  // DYNAMIC UNDERWRITING SCALING ENGINE
  // -------------------------------------------------------------
  let dataMultiplier = 1.0; // Base (Shopify + Bank)
  if (connections.ads) dataMultiplier += 0.25;       // +25% limit boost for Ads
  if (connections.analytics) dataMultiplier += 0.15; // +15% limit boost for Analytics

  const maxLoanCap = Math.min(
    Math.round((monthlyMRR * 1.2 * dataMultiplier) / 500) * 500,
    50000
  );

  const calculateRecommendedTerm = (
    amount: number,
    mrr: number,
    margin: number,
    growth: number
  ): number => {
    const effectiveGrowth = connections.analytics ? growth : 0;
    const projectedNetProfit = mrr * (margin / 100) * (1 + effectiveGrowth / 100);
    const maxSafeMonthlyPayment = projectedNetProfit / 1.5; // DSCR = 1.5

    if (maxSafeMonthlyPayment <= 0) return 24;

    for (let months = 1; months <= 24; months++) {
      const totalInterest = amount * (APPLIED_APR / 100) * (months / 12);
      const estPayment = (amount + totalInterest) / months;
      if (estPayment <= maxSafeMonthlyPayment) {
        return months;
      }
    }
    return 24;
  };

  const recommendedTerm = calculateRecommendedTerm(
    loanAmount,
    monthlyMRR,
    netMarginPercent,
    trafficGrowthPercent
  );

  // Calculate percentage position (1 to 24 range) for speech bubble and marker placement
  const getMarkerPercent = (term: number) => {
    return ((term - 1) / (24 - 1)) * 100;
  };

  const recommendedPercent = getMarkerPercent(recommendedTerm);

  // Strictly Typed Flat Primitive Dependencies Array
  useEffect(() => {
    if (step === 3 && monthlyMRR === 18000) {
      const randomMRR = Math.floor(Math.random() * (45000 - 14000 + 1) + 14000); // $14k - $45k
      const randomRoas = Number((Math.random() * (4.6 - 2.8) + 2.8).toFixed(1)); // 2.8x - 4.6x
      const randomTraffic = Math.floor(Math.random() * (32 - 12 + 1) + 12); // +12% - +32%
      const randomMargin = Math.floor(Math.random() * (35 - 20 + 1) + 20); // 20% - 35%

      setMonthlyMRR(randomMRR);
      setRoas(randomRoas);
      setTrafficGrowthPercent(randomTraffic);
      setNetMarginPercent(randomMargin);

      const initialCap = Math.min(
        Math.round((randomMRR * 1.2 * dataMultiplier) / 500) * 500,
        50000
      );
      setLoanAmount(initialCap);

      const optimalTerm = calculateRecommendedTerm(initialCap, randomMRR, randomMargin, randomTraffic);
      setPaybackMonths(optimalTerm);
    }
  }, [step, connections.shopify, connections.plaid, connections.ads, connections.analytics]);

  // Adjust loan amount dynamically if connection state changes limit
  useEffect(() => {
    if (loanAmount > maxLoanCap) {
      setLoanAmount(maxLoanCap);
    }
  }, [maxLoanCap]);

  // Amortized Monthly Payment Calculation
  const calculateMonthlyPayment = (principal: number, months: number): number => {
    const totalInterest = principal * (APPLIED_APR / 100) * (months / 12);
    const totalRepayable = principal + totalInterest;
    return Math.round(totalRepayable / months);
  };

  const monthlyPayment = calculateMonthlyPayment(loanAmount, paybackMonths);
  const totalCostOfBorrowing = Math.round(loanAmount * (APPLIED_APR / 100) * (paybackMonths / 12));

  const toggleConnection = (key: ConnectionKeys) => {
    setConnections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-[#F6F7EB] text-[#30292F] font-sans">
      {/* Header Bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-extrabold tracking-tight text-[#1E67B1]">
            Swift<span className="text-[#F68C1F]">Ads</span>
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="bg-[#F6F7EB] text-[#30292F] text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-300 flex items-center gap-1.5">
            🇨🇦 Operating in Canada
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Step Indicator */}
        <div className="mb-8 flex items-center justify-between max-w-xs mx-auto text-xs font-bold text-gray-500">
          <div className={`flex items-center gap-1 ${step >= 1 ? 'text-[#1E67B1]' : ''}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-[#1E67B1] text-white' : 'bg-gray-200'}`}>1</span>
            Eligibility
          </div>
          <div className="h-0.5 w-8 bg-gray-300"></div>
          <div className={`flex items-center gap-1 ${step >= 2 ? 'text-[#1E67B1]' : ''}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-[#1E67B1] text-white' : 'bg-gray-200'}`}>2</span>
            Connect Data
          </div>
          <div className="h-0.5 w-8 bg-gray-300"></div>
          <div className={`flex items-center gap-1 ${step >= 3 ? 'text-[#1E67B1]' : ''}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-[#1E67B1] text-white' : 'bg-gray-200'}`}>3</span>
            Pre-Approval
          </div>
        </div>

        {/* SCREEN 1: ELIGIBILITY CHECK */}
        {step === 1 && (
          <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100 max-w-2xl mx-auto">
            <h1 className="text-3xl font-extrabold text-[#1E67B1] mb-3 text-center">
              Get Capital to Grow Quickly
            </h1>
            <p className="text-center text-gray-600 mb-8 text-sm">
              Get approved for growth capital of up to $5,000 – $50,000 in under 2 minutes. Connect your growth metrics and revenue sources to see how much you can qualify for.
            </p>

            <div className="space-y-6 bg-[#F6F7EB] p-6 rounded-xl border border-gray-200 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">Operating History</p>
                  <p className="text-xs text-gray-500">Has your business been active for 6+ months?</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setHasHistory(true)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      hasHistory ? 'bg-[#1E67B1] text-white' : 'bg-white text-gray-700 border'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setHasHistory(false)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      !hasHistory ? 'bg-[#1E67B1] text-white' : 'bg-white text-gray-700 border'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">Monthly Revenue (MRR)</p>
                  <p className="text-xs text-gray-500">Do you generate at least $5,000 / month in revenue?</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setHasMinMRR(true)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      hasMinMRR ? 'bg-[#1E67B1] text-white' : 'bg-white text-gray-700 border'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setHasMinMRR(false)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      !hasMinMRR ? 'bg-[#1E67B1] text-white' : 'bg-white text-gray-700 border'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>

            {(!hasHistory || !hasMinMRR) ? (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm mb-6 text-center border border-red-200">
                Minimum requirements: 6+ months operating history and $5,000 monthly revenue.
              </div>
            ) : null}

            <p className="text-center text-xs text-gray-500 mb-4 font-medium">
              Connect the required accounts and data points to see how much you're qualified to borrow.
            </p>

            <button
              disabled={!hasHistory || !hasMinMRR}
              onClick={() => setStep(2)}
              className="w-full bg-[#F68C1F] hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3.5 px-6 rounded-xl transition duration-200 shadow-md text-center"
            >
              Connect Data Points
            </button>
          </div>
        )}

        {/* SCREEN 2: DATA INTEGRATIONS VAULT */}
        {step === 2 && (
          <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-[#1E67B1] mb-2 text-center">
              Connect Channels to See How Much You can Qualify for
            </h2>
            <p className="text-center text-xs text-gray-500 mb-6">
              Connect store sales, financial statements, and ad accounts to see how much you're eligible to borrow up to.
            </p>

            <div className="bg-[#1E67B1] text-white p-3.5 rounded-xl text-xs flex items-center gap-3 mb-6 shadow-sm">
              <span className="text-lg">🔒</span>
              <div>
                <p className="font-semibold">Data Secured</p>
                <p className="opacity-90">Data is encrypted and stored safely.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              
              {/* Card 1: Shopify */}
              <div className="bg-[#F6F7EB] p-4 rounded-xl border border-gray-200 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-sm block">Connect a Revenue Source</span>
                  <span className="inline-block text-[10px] bg-blue-100 text-[#1E67B1] font-bold px-2 py-0.5 rounded mt-1 mb-2">
                    Required
                  </span>
                  <p className="text-xs text-gray-500 mb-4">Connect an e-commerce platform so we can evaluate your monthly sales history.</p>
                </div>
                <button
                  onClick={() => toggleConnection('shopify')}
                  className={`w-full text-xs font-bold py-2 rounded-lg transition ${
                    connections.shopify ? 'bg-green-600 text-white' : 'bg-[#1E67B1] text-white hover:bg-blue-800'
                  }`}
                >
                  {connections.shopify ? '✓ Shopify Connected' : 'Connect Shopify'}
                </button>
              </div>

              {/* Card 2: Bank Data */}
              <div className="bg-[#F6F7EB] p-4 rounded-xl border border-gray-200 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-sm block">Connect your Banking Data</span>
                  <span className="inline-block text-[10px] bg-blue-100 text-[#1E67B1] font-bold px-2 py-0.5 rounded mt-1 mb-2">
                    Required
                  </span>
                  <p className="text-xs text-gray-500 mb-4">Verifies cash flow via your financial institutions.</p>
                </div>
                <button
                  onClick={() => toggleConnection('plaid')}
                  className={`w-full text-xs font-bold py-2 rounded-lg transition ${
                    connections.plaid ? 'bg-green-600 text-white' : 'bg-[#1E67B1] text-white hover:bg-blue-800'
                  }`}
                >
                  {connections.plaid ? '✓ Bank Connected' : 'Connect Bank Account'}
                </button>
              </div>

              {/* Card 3: Ads Accounts */}
              <div className="bg-[#F6F7EB] p-4 rounded-xl border border-gray-200 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-sm block">Connect Your Ads Account(s)</span>
                  <span className="inline-block text-[10px] bg-orange-100 text-[#F68C1F] font-bold px-2 py-0.5 rounded mt-1 mb-2">
                    Access more capital by connecting your account
                  </span>
                  <p className="text-xs text-gray-500 mb-4">This data point will help us evaluate and predict customer demand.</p>
                </div>
                <button
                  onClick={() => toggleConnection('ads')}
                  className={`w-full text-xs font-bold py-2 rounded-lg border transition ${
                    connections.ads ? 'bg-green-600 text-white border-green-600' : 'border-[#F68C1F] text-[#F68C1F] hover:bg-orange-50'
                  }`}
                >
                  {connections.ads ? '✓ Ad Accounts Connected' : 'Connect Ad Accounts'}
                </button>
              </div>

              {/* Card 4: Web Analytics */}
              <div className="bg-[#F6F7EB] p-4 rounded-xl border border-gray-200 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-sm block">Connect Your Web Analytics</span>
                  <span className="inline-block text-[10px] bg-orange-100 text-[#F68C1F] font-bold px-2 py-0.5 rounded mt-1 mb-2">
                    Access more capital by connecting your account
                  </span>
                  <p className="text-xs text-gray-500 mb-4">This data point will help us evaluate your business' growth potential.</p>
                </div>
                <button
                  onClick={() => toggleConnection('analytics')}
                  className={`w-full text-xs font-bold py-2 rounded-lg border transition ${
                    connections.analytics ? 'bg-green-600 text-white border-green-600' : 'border-[#F68C1F] text-[#F68C1F] hover:bg-orange-50'
                  }`}
                >
                  {connections.analytics ? '✓ Analytics Connected' : 'Connect Traffic Source'}
                </button>
              </div>

            </div>

            <div className="flex items-start gap-3 bg-[#F6F7EB] p-4 rounded-xl mb-6 border border-gray-200">
              <input
                type="checkbox"
                id="consent"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-[#1E67B1] focus:ring-[#1E67B1]"
              />
              <label htmlFor="consent" className="text-xs text-gray-600 leading-relaxed cursor-pointer">
                I agree to the terms and conditions.
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 bg-gray-100 text-gray-700 font-bold py-3 px-4 rounded-xl text-sm"
              >
                Back
              </button>
              <button
                disabled={!connections.shopify || !connections.plaid || !consent}
                onClick={() => setStep(3)}
                className="w-2/3 bg-[#F68C1F] hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl transition duration-200 shadow-md text-sm"
              >
                See Loan Amount
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 3: PRE-APPROVAL DASHBOARD */}
        {step === 3 && (
          <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100 max-w-3xl mx-auto">
            <div className="bg-[#1E67B1] text-white p-6 rounded-2xl text-center mb-8 shadow-lg relative overflow-hidden">
              <span className="text-xs font-bold uppercase tracking-wider bg-blue-800/60 px-3 py-1 rounded-full border border-blue-400/30">
                Loan Amount
              </span>
              <p className="text-xs font-medium text-blue-100 mt-3">You're Eligible for Up To</p>
              <h2 className="text-5xl font-black mt-1 mb-3 text-white tracking-tight">
                ${maxLoanCap.toLocaleString()}
              </h2>
              <span className="inline-block bg-[#F68C1F] text-white font-bold text-xs px-3 py-1 rounded-full shadow">
                Interest Rate: {APPLIED_APR.toFixed(2)}% APR
              </span>
            </div>

            {/* Dynamic Underwriting Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              
              {/* Card 1: Monthly MRR */}
              <div className="bg-[#F6F7EB] p-3.5 rounded-xl border border-gray-200">
                <p className="text-[10px] text-gray-500 font-bold uppercase">Monthly MRR</p>
                <p className="text-lg font-extrabold text-[#30292F]">${monthlyMRR.toLocaleString()}</p>
              </div>

              {/* Card 2: ROAS Performance OR Direct Connect Option */}
              {connections.ads ? (
                <div className="bg-[#F6F7EB] p-3.5 rounded-xl border border-gray-200 transition-all duration-300">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">ROAS Performance</p>
                  <p className="text-lg font-extrabold text-[#30292F]">{roas}x</p>
                </div>
              ) : (
                <div 
                  onClick={() => toggleConnection('ads')}
                  className="bg-orange-50 border border-dashed border-[#F68C1F] p-3.5 rounded-xl cursor-pointer hover:bg-orange-100 transition flex flex-col justify-between"
                >
                  <p className="text-[10px] text-[#F68C1F] font-bold uppercase">ROAS Unverified</p>
                  <p className="text-xs font-bold text-[#30292F] underline">+ Connect Ad Accounts</p>
                </div>
              )}

              {/* Card 3: Traffic Trajectory OR Direct Connect Option */}
              {connections.analytics ? (
                <div className="bg-[#F6F7EB] p-3.5 rounded-xl border border-gray-200 transition-all duration-300">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Traffic Trajectory</p>
                  <p className="text-lg font-extrabold text-[#30292F]">+{trafficGrowthPercent}% growth</p>
                </div>
              ) : (
                <div 
                  onClick={() => toggleConnection('analytics')}
                  className="bg-blue-50 border border-dashed border-[#1E67B1] p-3.5 rounded-xl cursor-pointer hover:bg-blue-100 transition flex flex-col justify-between"
                >
                  <p className="text-[10px] text-[#1E67B1] font-bold uppercase">Traffic Unverified</p>
                  <p className="text-xs font-bold text-[#30292F] underline">+ Connect Analytics Platform</p>
                </div>
              )}

              {/* Card 4: Interest Rate */}
              <div className="bg-[#F6F7EB] p-3.5 rounded-xl border border-gray-200">
                <p className="text-[10px] text-gray-500 font-bold uppercase">Interest Rate</p>
                <p className="text-lg font-extrabold text-[#1E67B1]">{APPLIED_APR.toFixed(2)}%</p>
              </div>

            </div>

            {/* Interactive Calculator Section */}
            <div className="bg-[#F6F7EB] p-6 rounded-xl border border-gray-200 mb-8 space-y-6">
              
              {/* Slider 1: Loan Amount */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-1 sm:gap-0">
                  <label className="text-sm font-bold text-[#30292F]">1. Choose the amount of capital:</label>
                  <span className="text-lg font-black text-[#1E67B1]">${loanAmount.toLocaleString()}</span>
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
                  <p className="text-[11px] text-[#30292F] mt-1 font-semibold">
                    💡 Tip: Click the unverified cards above to connect your Ad Accounts and/or Analytics to unlock more capital and favourable terms.
                  </p>
                ) : null}
              </div>

              {/* Slider 2: Loan Term (Months) */}
              <div className="border-t border-gray-300 pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-1 sm:gap-0">
                  <label className="text-sm font-bold text-[#30292F]">2. Choose how much time you need to repay the capital (months):</label>
                  <span className="text-base font-bold text-[#30292F]">{paybackMonths} Months</span>
                </div>

                {/* Relative Track Wrapper for Pointer Speech Bubble & Marker */}
                <div className="relative pt-8 pb-4">
                  
                  {/* Floating Speech Bubble Tooltip when slider is on recommended term */}
                  {paybackMonths === recommendedTerm && (
                    <div 
                      className="absolute top-0 transform -translate-x-1/2 z-20 transition-all duration-200"
                      style={{ left: `${recommendedPercent}%` }}
                    >
                      <div className="relative bg-green-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-md whitespace-nowrap">
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
                    max="24"
                    step="1"
                    value={paybackMonths}
                    onChange={(e) => setPaybackMonths(Number(e.target.value))}
                    className="w-full accent-[#1E67B1] cursor-pointer relative z-10"
                  />

                  {/* Permanent Target Pin Indicator on Slider Track */}
                  <div 
                    className="absolute bottom-2 transform -translate-x-1/2 flex flex-col items-center pointer-events-none z-0"
                    style={{ left: `${recommendedPercent}%` }}
                  >
                    <span className="text-[10px] text-green-700 font-extrabold leading-none">▲</span>
                    <span className="text-[9px] text-green-700 font-bold whitespace-nowrap">Optimal</span>
                  </div>

                </div>

                {/* Visual Recommendation Indicator Scale */}
                <div className="flex justify-between text-[11px] text-gray-500 mt-1">
                  <span>1 Mo</span>
                  <span>6 Mo</span>
                  <span>12 Mo</span>
                  <span>18 Mo</span>
                  <span>24 Mo</span>
                </div>
              </div>

              {/* Repayment Breakdown Output */}
              <div className="bg-white p-4 rounded-lg border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Estimated Monthly Payment</p>
                  <div className="flex flex-col items-start sm:flex-row sm:items-baseline sm:gap-1.5">
                    <p className="text-2xl font-black text-[#1E67B1]">
                      ${monthlyPayment.toLocaleString()}
                    </p>
                    <span className="text-xs font-semibold text-gray-500">/ month</span>
                  </div>
                </div>
                <div className="text-left md:text-right border-t md:border-t-0 md:border-l border-gray-200 pt-2 md:pt-0 md:pl-4 w-full md:w-auto">
                  <p className="text-xs text-gray-500">Interest Cost ({APPLIED_APR.toFixed(2)}% APR):</p>
                  <p className="text-sm font-bold text-gray-700">+${totalCostOfBorrowing.toLocaleString()}</p>
                </div>
              </div>

            </div>

            {/* HIGH-VISIBILITY FORM BLOCK */}
            {!submitted ? (
              <div className="bg-[#30292F] text-white p-6 rounded-xl shadow-md border border-gray-700">
                <h3 className="font-bold text-base mb-1">Lock In Your Loan Terms</h3>
                <p className="text-xs text-gray-300 mb-4">
                  Register your account to lock in these terms. Funds are disbursed in as little as 48 hrs.
                </p>
                <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    required
                    placeholder="Enter business email (e.g. founder@brand.ca)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-lg text-sm bg-white text-gray-900 border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F68C1F] shadow-inner font-medium"
                  />
                  <button
                    type="submit"
                    className="bg-[#F68C1F] hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-lg text-sm transition duration-200 shadow-md whitespace-nowrap"
                  >
                    Register Now
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 text-green-800 p-6 rounded-xl text-center">
                <p className="font-bold text-lg mb-1">🎉 Pre-Approval Reserved!</p>
                <p className="text-xs">
                  We saved your offer of <strong>${loanAmount.toLocaleString()}</strong> over <strong>{paybackMonths} months</strong> (${monthlyPayment.toLocaleString()}/mo) for <strong>{email}</strong>.
                </p>
              </div>
            )}

            <button
              onClick={() => {
                setStep(2);
                setSubmitted(false);
              }}
              className="w-full mt-4 text-xs text-gray-400 hover:text-gray-600 font-semibold py-2"
            >
              ← Modify Connected Data Sources
            </button>

          </div>
        )}

      </main>
    </div>
  );
}